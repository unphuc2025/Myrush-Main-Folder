import models, database
from sqlalchemy import text
db = database.SessionLocal()
try:
    print("Running migration for pluggable webhook refactor...")
    
    # 1. Add headers column to partner webhook configs
    db.execute(text("ALTER TABLE integration_partner_webhooks ADD COLUMN IF NOT EXISTS headers JSONB"))
    
    # 2. Add error_message column to outbox events
    db.execute(text("ALTER TABLE integration_outbox_events ADD COLUMN IF NOT EXISTS error_message TEXT"))
    
    # 3. Add UniqueConstraint if it doesn't exist
    try:
        db.execute(text("ALTER TABLE integration_partner_webhooks ADD CONSTRAINT uq_partner_event_webhook UNIQUE (partner_id, event_name)"))
    except Exception as e:
        print(f"Note: Unique constraint might already exist or failed: {e}")
        db.rollback()
        db = database.SessionLocal()
    
    # 4. Invalidate existing pending events
    print("Invalidating existing pending events for audit trail...")
    db.execute(text("UPDATE integration_outbox_events SET status = 'failed', error_message = 'Invalidated by modular refactor' WHERE status = 'pending'"))
    
    db.commit()
    print("Migration successful.")
except Exception as e:
    db.rollback()
    print(f"Migration failed: {e}")
finally:
    db.close()
