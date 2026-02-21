import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL not found in .env")
    sys.exit(1)

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Checking admin_coupons table...")
    try:
        result = conn.execute(text("SELECT id, code, is_active, start_date, end_date, discount_type, discount_value, min_order_value FROM admin_coupons;"))
        rows = result.fetchall()
        if not rows:
            print("No coupons found in admin_coupons.")
        for row in rows:
            print(f"ID: {row[0]}")
            print(f"  Code: {row[1]}")
            print(f"  Active: {row[2]}")
            print(f"  Start: {row[3]}")
            print(f"  End: {row[4]}")
            print(f"  Type: {row[5]}")
            print(f"  Value: {row[6]}")
            print(f"  Min Order: {row[7]}")
            print("-" * 20)
    except Exception as e:
        print(f"Error: {e}")

    print("\nChecking current time in DB...")
    res_time = conn.execute(text("SELECT NOW();"))
    print(f"DB NOW(): {res_time.fetchone()[0]}")
