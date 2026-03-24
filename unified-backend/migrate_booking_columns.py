import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()

    try:
        cur.execute("ALTER TABLE booking ADD COLUMN slot_id UUID;")
        print("Added slot_id to booking table.")
    except Exception as e:
        print(f"Failed to add slot_id (might exist): {e}")

    try:
        cur.execute("ALTER TABLE booking ADD COLUMN slice_mask INTEGER;")
        print("Added slice_mask to booking table.")
    except Exception as e:
        print(f"Failed to add slice_mask (might exist): {e}")

    try:
        cur.execute("ALTER TABLE booking DROP COLUMN division_mode_id;")
        print("Dropped division_mode_id from booking table.")
    except Exception as e:
        print(f"Failed to drop division_mode_id: {e}")

    print("Booking table migration complete.")

except Exception as e:
    print(f"DB Error: {e}")
