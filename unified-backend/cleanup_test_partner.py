import database
import models
from sqlalchemy import text
db = database.SessionLocal()
try:
    print("Cleaning up TestPartner remnants...")
    # Delete from child tables first if they exist
    db.execute(text("DELETE FROM integration_partner_webhooks WHERE partner_id IN (SELECT id FROM integration_partners WHERE name = 'TestPartner')"))
    db.execute(text("DELETE FROM integration_outbox_events WHERE partner_id IN (SELECT id FROM integration_partners WHERE name = 'TestPartner')"))
    db.execute(text("DELETE FROM integration_partners WHERE name = 'TestPartner'"))
    db.commit()
    print("Cleanup successful.")
except Exception as e:
    db.rollback()
    print(f"Cleanup failed: {e}")
finally:
    db.close()
