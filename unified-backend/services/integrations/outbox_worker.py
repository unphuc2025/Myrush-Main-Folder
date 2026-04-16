import time
import requests
import json
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from services.integrations.gateway_client import DistrictGatewayClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("OutboxWorker")


def process_outbox():
    """
    Main loop for processing integration outbox events.
    Usually run as a standalone process or a cron job.
    """
    db = SessionLocal()
    try:
        # 1. Get pending or failed events ready for retry
        now = datetime.utcnow()
        events = db.query(models.OutboxEvent).filter(
            models.OutboxEvent.status.in_(['pending', 'failed']),
            models.OutboxEvent.next_attempt_at <= now,
            models.OutboxEvent.attempts < models.OutboxEvent.max_attempts
        ).limit(50).all()

        if not events:
            return

        logger.info(f"Processing {len(events)} outbox events...")

        for event in events:
            partner = event.partner
            if not partner:
                logger.warning(f"Event {event.id} skipped: Partner not found")
                event.status = 'failed'
                db.commit()
                continue

            # Resolve the target webhook URL: Configure -> Fallback -> Error
            target_url = None
            if event.category:
                config = db.query(models.PartnerWebhookConfig).filter(
                    models.PartnerWebhookConfig.partner_id == partner.id,
                    models.PartnerWebhookConfig.event_name == event.category,
                    models.PartnerWebhookConfig.is_active == True
                ).first()
                if config:
                    target_url = config.webhook_url
            
            if not target_url:
                target_url = partner.webhook_url

            if not target_url:
                logger.warning(f"Event {event.id} skipped: No destination URL found (Category: {event.category})")
                event.status = 'failed'
                db.commit()
                continue

            # 2. Update status to processing
            event.status = 'processing'
            event.last_attempt_at = datetime.utcnow()
            event.attempts += 1
            db.commit()

            try:
                # 3. Resolve Adapter and Send Webhook
                logger.info(f"Sending {event.event_type} ({event.category}) for {partner.name} to {target_url}")
                
                # GET ADAPTER via Factory
                from services.integrations.adapter_factory import AdapterFactory
                try:
                    adapter = AdapterFactory.get_adapter(partner.name, str(partner.id), db)
                except ValueError as e:
                    logger.error(f"No adapter for {partner.name}: {e}")
                    event.status = 'failed'
                    event.error_message = str(e)
                    db.commit()
                    continue

                # FETCH CUSTOM HEADERS (if any)
                # Re-fetch config to get headers (safest)
                extra_headers = {}
                if event.category:
                    config = db.query(models.PartnerWebhookConfig).filter(
                        models.PartnerWebhookConfig.partner_id == partner.id,
                        models.PartnerWebhookConfig.event_name == event.category,
                        models.PartnerWebhookConfig.is_active == True
                    ).first()
                    if config and config.headers:
                        extra_headers = config.headers

                # TRANSLATE PAYLOAD (Raw MyRush -> Vendor JSON)
                formatted_payload = adapter.format_webhook_payload(event.category, event.payload)

                # TRANSMIT (Delegated to Adapter for protocol details like HMAC)
                response = adapter.send_webhook(
                    url=target_url,
                    payload=formatted_payload,
                    custom_headers=extra_headers
                )

                # 4. Handle Response & Logging
                try:
                    res_body = response.json()
                except:
                    res_body = {"raw": response.text[:2000]}

                # Log for observability (Target URL is fully resolved)
                log = models.IntegrationLog(
                    partner_id=partner.id,
                    direction='OUTBOUND',
                    endpoint=target_url, 
                    method='POST',
                    request_payload=formatted_payload,
                    response_status=response.status_code,
                    response_payload=res_body
                )
                db.add(log)

                if 200 <= response.status_code < 300:
                    logger.info(f"Event {event.id} delivered successfully.")
                    event.status = 'completed'
                    event.error_message = None
                else:
                    logger.error(f"Event {event.id} failed with status {response.status_code}")
                    event.error_message = f"HTTP {response.status_code}: {response.text[:500]}"
                    _handle_failure(event)

            except Exception as e:
                logger.error(f"Error processing event {event.id}: {e}", exc_info=True)
                event.error_message = str(e)
                _handle_failure(event)
            
            db.commit()

    finally:
        db.close()

def _handle_failure(event: models.OutboxEvent):
    """Calculates exponential backoff for retries and marks as dead if threshold reached"""
    # User Defined Backoff: Attempt 1 = 5m wait, Attempt 2 = 15m, Attempt 3 = 1h, Attempt 4 = 4h
    backoff_minutes = [5, 15, 60, 240]
    
    if event.attempts < event.max_attempts:
        event.status = 'failed'
        # Scale: Use attempt index, fallback to largest delay if attempts exceed scale length
        wait_index = min(event.attempts - 1, len(backoff_minutes) - 1)
        wait_time = backoff_minutes[wait_index]
        
        event.next_attempt_at = datetime.utcnow() + timedelta(minutes=wait_time)
        
        logger.warning(
            f"Event {event.id} failed (Attempt {event.attempts}/{event.max_attempts}). "
            f"Scheduled retry at {event.next_attempt_at} (in {wait_time}m). "
            f"Error: {event.error_message}"
        )
    else:
        event.status = 'dead'
        logger.error(
            f"Event {event.id} permanently failed after {event.attempts} attempts. "
            f"Marked as DEAD. Last error: {event.error_message}"
        )

if __name__ == "__main__":
    logger.info("Outbox worker started...")
    while True:
        try:
            process_outbox()
        except Exception as e:
            logger.error(f"Worker loop error: {e}")
        time.sleep(30) # Wait 30 seconds between polls
