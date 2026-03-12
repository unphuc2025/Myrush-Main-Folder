import sys
import os

# Add the current directory to path so we can import models/database
sys.path.append(os.getcwd())

from sqlalchemy.orm import Session
from database import SessionLocal
import models
import uuid

def seed_district():
    db = SessionLocal()
    try:
        print("Checking for District Partner...")
        district = db.query(models.Partner).filter(models.Partner.name == "District").first()
        
        if not district:
            print("Creating District Partner...")
            district = models.Partner(
                name="District",
                unique_id="dist_2a380850",
                api_key_hash="mr_sk_0eb6c8782604c08b5c0a396ce7c849ac",
                webhook_url="https://www.district.in/gw/ext/play/rush/callback",
                is_active=True
            )
            db.add(district)
            db.commit()
            db.refresh(district)
            print(f"✅ District Partner created with ID: {district.id}")
        else:
            print(f"ℹ️ District Partner already exists (ID: {district.id})")
            # Force update credentials to production values
            district.unique_id = "dist_2a380850"
            district.api_key_hash = "mr_sk_0eb6c8782604c08b5c0a396ce7c849ac"
            district.webhook_url = "https://www.district.in/gw/ext/play/rush/callback"
            db.commit()
            print("✅ District credentials and Webhook URL updated to Production values.")

        # Optional: Seed some initial environment variables instructions
        print("\n--- NEXT STEPS ---")
        print("1. Set the following environment variables for webhooks:")
        print("   $env:DISTRICT_WEBHOOK_API_KEY = 'abcde'")
        print("   $env:DISTRICT_WEBHOOK_AUTH = 'Basic akanan'")
        print("2. Run the outbox worker to start sending updates:")
        print("   python services/integrations/outbox_worker.py")
        print("------------------\n")

    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_district()
