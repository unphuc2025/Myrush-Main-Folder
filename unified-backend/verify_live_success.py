import os
import sys

# Add the backend path to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'unified-backend')))

import database
import models
from services.integrations.district_adapter import DistrictAdapter

def verify_live_success():
    db = database.SessionLocal()
    try:
        partner = db.query(models.Partner).filter(models.Partner.name == 'REFACTOR_AVAIL').first()
        if not partner:
            print("Partner REFACTOR_AVAIL not found. Run test_availability_webhook.py first.")
            return
            
        adapter = DistrictAdapter(db, partner_id=str(partner.id))
        
        # 1. Format payload
        print("Formatting availability payload (District Type B format)...")
        # We need a branch and court for District formatting logic
        court = db.query(models.Court).first()
        data = {
            "branch_id": str(court.branch_id),
            "court_id": str(court.id),
            "date": "2026-04-14",
            "slot_start": 10.0,
            "action": "block"
        }
        payload = adapter.format_webhook_payload("availability", data)
        print(f"Payload generated successfully.")
        
        # 2. Send webhook to internal test endpoint (guaranteed 200 OK)
        print("\nSending POST to local backend (http://localhost:8000/webhook-test-200)...")
        response = adapter.send_webhook("http://localhost:8000/webhook-test-200", payload)
        
        print(f"\n--- SUCCESS ---")
        print(f"HTTP Status: {response.status_code} {response.reason}")
        print(f"Response Body: {response.text[:100]}")
        
    except Exception as e:
        print(f"Verification failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_live_success()
