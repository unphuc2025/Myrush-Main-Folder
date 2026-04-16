from database import engine
from sqlalchemy import text

def migrate():
    print("[MIGRATION] Starting enhancement migration...")
    try:
        with engine.connect() as conn:
            # 1. Add review_prompt_sent
            print("[MIGRATION] Adding review_prompt_sent to booking table...")
            conn.execute(text("ALTER TABLE public.booking ADD COLUMN IF NOT EXISTS review_prompt_sent BOOLEAN DEFAULT FALSE"))
            
            # 2. Add expiry_alert_sent
            print("[MIGRATION] Adding expiry_alert_sent to booking table...")
            conn.execute(text("ALTER TABLE public.booking ADD COLUMN IF NOT EXISTS expiry_alert_sent BOOLEAN DEFAULT FALSE"))
            
            conn.commit()
            print("[MIGRATION] Migration successful!")
            
            # Verification
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='booking' AND table_schema='public'"))
            columns = [row[0] for row in result.fetchall()]
            print(f"[MIGRATION] Final columns in 'booking': {columns}")
            
    except Exception as e:
        print(f"[MIGRATION ERROR] Failed: {e}")

if __name__ == "__main__":
    migrate()
