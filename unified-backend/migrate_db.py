from database import engine
from sqlalchemy import text

def migrate():
    print("[MIGRATION] Starting database migration...")
    try:
        with engine.connect() as conn:
            # 1. Add reminder_sent to booking
            print("[MIGRATION] Adding reminder_sent to booking table...")
            conn.execute(text("ALTER TABLE booking ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE"))
            
            # 2. Add is_read to notifications if it doesn't exist (safety check)
            # print("[MIGRATION] Adding is_read to notifications table...")
            # conn.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE"))
            
            conn.commit()
            print("[MIGRATION] Migration successful!")
    except Exception as e:
        print(f"[MIGRATION ERROR] Failed to apply migration: {e}")

if __name__ == "__main__":
    migrate()
