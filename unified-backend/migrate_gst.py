import models, database
from sqlalchemy import text
db = database.SessionLocal()
try:
    print("Running migration...")
    db.execute(text("ALTER TABLE booking ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10, 2) DEFAULT 0"))
    db.execute(text("ALTER TABLE booking ADD COLUMN IF NOT EXISTS subtotal_amount DECIMAL(10, 2) DEFAULT 0"))
    db.execute(text("UPDATE booking SET subtotal_amount = total_amount WHERE subtotal_amount = 0"))
    db.commit()
    print("Migration successful: Added gst_amount and subtotal_amount columns.")
except Exception as e:
    db.rollback()
    print(f"Migration failed: {e}")
finally:
    db.close()
