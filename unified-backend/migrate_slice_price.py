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
        cur.execute("ALTER TABLE admin_sport_slices ADD COLUMN price_per_hour DECIMAL(10, 2);")
        print("Added price_per_hour to admin_sport_slices")
    except Exception as e:
        print(f"Failed to add price_per_hour (might already exist): {e}")

    print("Migration Check Complete.")
    
except Exception as e:
    print(f"Database connection error: {e}")
