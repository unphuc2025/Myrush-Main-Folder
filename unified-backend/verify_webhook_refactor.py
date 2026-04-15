import os
import sys

# Add the current directory to sys.path to allow imports from services
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'unified-backend')))

import database
import models
from services.integrations.orchestrator import IntegrationOrchestrator
from services.integrations.outbox_worker import process_outbox
from sqlalchemy import text
from uuid import UUID

def test_pluggable_refactor():
    db = database.SessionLocal()
    try:
        print("Cleaning up old test data...")
        db.execute(text("DELETE FROM integration_logs WHERE partner_id IN (SELECT id FROM integration_partners WHERE name = 'REFACTOR')"))
        db.execute(text("DELETE FROM integration_partner_webhooks WHERE partner_id IN (SELECT id FROM integration_partners WHERE name = 'REFACTOR')"))
        db.execute(text("DELETE FROM integration_outbox_events WHERE partner_id IN (SELECT id FROM integration_partners WHERE name = 'REFACTOR')"))
        db.execute(text("DELETE FROM integration_partners WHERE name = 'REFACTOR'"))
        db.commit()

        # 1. Setup a test partner (using name 'REFACTOR' mapping to District in factory)
        print("Setting up Test Partner (REFACTOR)...")
        partner = models.Partner(
            name="REFACTOR",
            unique_id="refactor_test",
            api_key_hash="fake_hash",
            webhook_url="https://global-fallback.com"
        )
        db.add(partner)
        db.commit()
        db.refresh(partner)
        partner_id = str(partner.id)

        # 2. Setup a specific category override with custom headers
        print("Setting up pricing override with custom headers...")
        webhook_config = models.PartnerWebhookConfig(
            partner_id=partner.id,
            event_name="pricing",
            webhook_url="https://pricing-override.com",
            headers={"Authorization": "Bearer refactor-test-token", "X-Custom": "Refactor"}
        )
        db.add(webhook_config)
        db.commit()

        # 3. Queue a pricing event (RAW data)
        print("Queueing RAW pricing event via Orchestrator...")
        court = db.query(models.Court).first()
        if not court:
            print("No courts found for testing.")
            return

        IntegrationOrchestrator.notify_recurring_change(
            db, 
            court_id=str(court.id), 
            day=1, 
            slot_start=10.0, 
            action="update", 
            price=500.0
        )
        db.commit()

        # 4. Run worker loop once
        print("Processing outbox...")
        # This will attempt an actual POST to pricing-override.com
        # Even if it fails (likely), it should log the attempt to IntegrationLog
        process_outbox()

        # 5. Verify Results
        print("\n--- Verification Results ---")
        
        # A. Check OutboxEvent status and internal data
        event = db.query(models.OutboxEvent).filter(models.OutboxEvent.partner_id == partner.id).first()
        if event:
            print(f"OutboxEvent: Status={event.status}")
            print(f"Internal Payload (Raw): {event.payload}")
            if event.error_message:
                print(f"Error captured in Outbox: {event.error_message[:100]}")
        
        # B. Check IntegrationLog for UR observability
        log = db.query(models.IntegrationLog).filter(models.IntegrationLog.partner_id == partner.id).order_by(models.IntegrationLog.created_at.desc()).first()
        if log:
            print(f"Audit Log Found! Endpoint: {log.endpoint}")
            if log.endpoint == "https://pricing-override.com":
                print("SUCCESS: Fully resolved override URL was recorded in the log.")
            else:
                print(f"FAILURE: Log recorded wrong URL: {log.endpoint}")
        else:
            print("FAILURE: No IntegrationLog entry found. Check if process_outbox hit an early exit.")

    except Exception as e:
        print(f"Test crashed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_pluggable_refactor()
