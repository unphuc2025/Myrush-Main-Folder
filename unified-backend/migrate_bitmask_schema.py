import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")

if not db_url:
    print("No DATABASE_URL found.")
    exit(1)

try:
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()

    try:
        cur.execute("ALTER TABLE admin_courts ADD COLUMN total_zones INTEGER DEFAULT 1;")
        print("Added total_zones to admin_courts")
    except Exception as e:
        print(f"Failed to add total_zones (might already exist): {e}")

    try:
        cur.execute("ALTER TABLE admin_bookings ADD COLUMN slot_id UUID;")
        print("Added slot_id to admin_bookings")
    except Exception as e:
        print(f"Failed to add slot_id (might already exist): {e}")

    try:
        cur.execute("ALTER TABLE admin_bookings ADD COLUMN slice_mask INTEGER;")
        print("Added slice_mask to admin_bookings")
    except Exception as e:
        print(f"Failed to add slice_mask (might already exist): {e}")

    print("Migration Check Complete.")
    
except Exception as e:
    print(f"Database connection error: {e}")
