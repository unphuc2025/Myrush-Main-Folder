from database import engine
from sqlalchemy import text

def migrate():
    print("[MIGRATION] Starting robust migration...")
    try:
        with engine.connect() as conn:
            # 1. Try to add the column
            print("[MIGRATION] Applying ALTER TABLE...")
            conn.execute(text("ALTER TABLE public.booking ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE"))
            conn.commit()
            
            # 2. Verify columns
            print("[MIGRATION] Verifying columns...")
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='booking' AND table_schema='public'"))
            columns = [row[0] for row in result.fetchall()]
            print(f"[MIGRATION] Current columns in 'booking': {columns}")
            
            if 'reminder_sent' in columns:
                print("[MIGRATION] SUCCESS: 'reminder_sent' column exists.")
            else:
                print("[MIGRATION] FAILURE: 'reminder_sent' column NOT found after migration.")
                
    except Exception as e:
        print(f"[MIGRATION ERROR] Critical failure: {e}")

if __name__ == "__main__":
    migrate()
