import models, database
from sqlalchemy import text
db = database.SessionLocal()
try:
    print("Running migration for modular webhooks...")
    
    # 1. Add category column to outbox events
    # Note: PostgreSQL supports ADD COLUMN IF NOT EXISTS
    db.execute(text("ALTER TABLE integration_outbox_events ADD COLUMN IF NOT EXISTS category VARCHAR(50)"))
    
    # 2. Create the new webhook config table
    # This will create any missing tables defined in models.py
    models.Base.metadata.create_all(bind=database.engine)
    
    db.commit()
    print("Migration successful: Added 'category' column and verified 'integration_partner_webhooks' table.")
except Exception as e:
    db.rollback()
    print(f"Migration failed: {e}")
finally:
    db.close()
