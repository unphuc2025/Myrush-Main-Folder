import time
import requests
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal
import models

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
            if not partner or not partner.webhook_url:
                logger.warning(f"Event {event.id} skipped: Partner missing webhook_url")
                event.status = 'failed'
                db.commit()
                continue

            # 2. Update status to processing
            event.status = 'processing'
            event.last_attempt_at = datetime.utcnow()
            event.attempts += 1
            db.commit()

            try:
                # 3. Send Webhook
                logger.info(f"Sending {event.event_type} to {partner.name} at {partner.webhook_url}")
                
                # District/Partner Specific Headers
                headers = {
                    "Content-Type": "application/json",
                    "User-Agent": "RUSH-Webhook/1.0",
                    "true-client-ip": "localhost" # Requirement from District PDF
                }
                
                # Load partner-specific secrets from ENV (Gold Standard: store in Partner.auth_settings)
                import os
                if partner.name.upper() == "DISTRICT":
                    dist_api_key = os.getenv("DISTRICT_WEBHOOK_API_KEY", "abcde")
                    dist_auth = os.getenv("DISTRICT_WEBHOOK_AUTH", "Basic akanan")
                    headers["API-KEY"] = dist_api_key
                    headers["Authorization"] = dist_auth
                
                response = requests.post(
                    partner.webhook_url,
                    json=event.payload,
                    headers=headers,
                    timeout=10
                )

                # 4. Handle Response
                if 200 <= response.status_code < 300:
                    logger.info(f"Event {event.id} delivered successfully.")
                    event.status = 'completed'
                else:
                    logger.error(f"Event {event.id} failed with status {response.status_code}: {response.text}")
                    _handle_failure(event)

            except Exception as e:
                logger.error(f"Network error sending event {event.id}: {e}")
                _handle_failure(event)
            
            db.commit()

    finally:
        db.close()

def _handle_failure(event: models.OutboxEvent):
    """Calculates exponential backoff for retries"""
    event.status = 'failed'
    # Backoff: 5m, 15m, 1h, 4h, 12h
    backoff_minutes = [5, 15, 60, 240, 720]
    
    if event.attempts <= len(backoff_minutes):
        wait_time = backoff_minutes[event.attempts - 1]
        event.next_attempt_at = datetime.utcnow() + timedelta(minutes=wait_time)
        logger.info(f"Event {event.id} rescheduled for retry in {wait_time} minutes.")
    else:
        logger.error(f"Event {event.id} reached maximum attempts and is now dead.")
        # Status remains 'failed', and it won't be picked up again due to attempts < max_attempts filter

if __name__ == "__main__":
    logger.info("Outbox worker started...")
    while True:
        try:
            process_outbox()
        except Exception as e:
            logger.error(f"Worker loop error: {e}")
        time.sleep(30) # Wait 30 seconds between polls
