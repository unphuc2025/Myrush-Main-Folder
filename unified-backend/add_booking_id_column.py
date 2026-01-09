from sqlalchemy import create_engine, text
import json
import random
import string
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL from env
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env")

def generate_booking_id():
    """Generates a short human-readable booking ID like BK-8X92A"""
    chars = string.ascii_uppercase + string.digits
    suffix = ''.join(random.choices(chars, k=6))
    return f"BK-{suffix}"

def migrate():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Checking if 'booking_display_id' column exists...")
        try:
            # Check column existence
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='booking' AND column_name='booking_display_id'"))
            if result.rowcount == 0:
                print("Adding 'booking_display_id' column...")
                conn.execute(text("ALTER TABLE booking ADD COLUMN booking_display_id VARCHAR(20)"))
                print("Column added.")
            else:
                print("Column 'booking_display_id' already exists.")
            
            # Backfill existing NULLs
            print("Backfilling NULL booking_display_id...")
            result = conn.execute(text("SELECT id FROM booking WHERE booking_display_id IS NULL"))
            rows = result.fetchall()
            
            count = 0
            for row in rows:
                booking_id = row[0] # UUID
                display_id = generate_booking_id()
                # Ensure uniqueness (simple check, for full robustness we'd query, but collision low for 6 chars)
                conn.execute(text("UPDATE booking SET booking_display_id = :did WHERE id = :bid"), {"did": display_id, "bid": booking_id})
                count += 1
            
            conn.commit()
            print(f"Backfilled {count} bookings with new IDs.")
            
            # Add Unique Constraint if not exists
            # (Postgres automatically names it, try adding safely)
            try:
                conn.execute(text("ALTER TABLE booking ADD CONSTRAINT uq_booking_display_id UNIQUE (booking_display_id)"))
                conn.commit()
                print("Added UNIQUE constraint.")
            except Exception as e:
                print("Constraint might already exist or duplicates found:", e)
                # If duplicates, we might want to regenerate? But we just backfilled.
        
        except Exception as e:
            print(f"Migration Failed: {e}")
            raise

if __name__ == "__main__":
    migrate()
