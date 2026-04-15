import os
import sys

# Add the backend path to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'unified-backend')))

import database
import models
from services.integrations.orchestrator import IntegrationOrchestrator
from services.integrations.outbox_worker import process_outbox
from sqlalchemy import text
from datetime import datetime

def test_availability_webhook():
    db = database.SessionLocal()
    try:
        print("Cleaning up old test data for REFACTOR_AVAIL...")
        db.execute(text("DELETE FROM integration_logs WHERE partner_id IN (SELECT id FROM integration_partners WHERE name = 'REFACTOR_AVAIL')"))
        db.execute(text("DELETE FROM integration_partner_webhooks WHERE partner_id IN (SELECT id FROM integration_partners WHERE name = 'REFACTOR_AVAIL')"))
        db.execute(text("DELETE FROM integration_outbox_events WHERE partner_id IN (SELECT id FROM integration_partners WHERE name = 'REFACTOR_AVAIL')"))
        db.execute(text("DELETE FROM integration_partners WHERE name = 'REFACTOR_AVAIL'"))
        db.commit()

        # 1. Setup a test partner
        print("Registering Test Partner (REFACTOR_AVAIL)...")
        partner = models.Partner(
            name="REFACTOR_AVAIL",
            unique_id="avail_test_001",
            api_key_hash="fake_hash",
            webhook_url="https://fallback.com"
        )
        db.add(partner)
        db.commit()
        db.refresh(partner)

        # 2. Setup availability override
        print("Configuring Availability Override URL (Live Status 200 via HTTP)...")
        webhook_config = models.PartnerWebhookConfig(
            partner_id=partner.id,
            event_name="availability",
            webhook_url="http://httpstat.us/200",
            headers={"X-Test": "Availability-Live"}
        )
        db.add(webhook_config)
        db.commit()

        # 3. Trigger Availability Change via Orchestrator
        print("Triggering Availability Change (Action: block)...")
        # Get a real court for consistency
        court = db.query(models.Court).first()
        if not court:
            print("No courts found!")
            return

        date_str = datetime.now().strftime('%Y-%m-%d')
        IntegrationOrchestrator.notify_inventory_change(
            db, 
            court_id=str(court.id), 
            date=date_str, 
            slot_start=14.0, 
            action="block"
        )
        db.commit()

        # 4. Process Outbox
        print("Running Outbox Worker...")
        process_outbox()

        # 5. Verify Results
        print("\n--- TEST VERIFICATION ---")
        
        # Check Event
        event = db.query(models.OutboxEvent).filter(models.OutboxEvent.partner_id == partner.id).first()
        if event:
            print(f"OutboxEvent: ID={event.id}, Category={event.category}, Status={event.status}")
            print(f"Raw Data in Payload: {event.payload}")
            
        # Check Log for Resolved URL
        log = db.query(models.IntegrationLog).filter(models.IntegrationLog.partner_id == partner.id).first()
        if log:
            print(f"IntegrationLog: Endpoint={log.endpoint}")
            if log.endpoint == "https://mock-availability.com/api/v1/update":
                print("SUCCESS: The worker correctly resolved the Availability override URL!")
            else:
                print(f"FAILURE: Worker used wrong endpoint: {log.endpoint}")
        else:
            print("FAILURE: No log entry found. Check for errors above.")
            if event and event.error_message:
                print(f"Error captured: {event.error_message}")

    except Exception as e:
        print(f"Test crashed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_availability_webhook()
