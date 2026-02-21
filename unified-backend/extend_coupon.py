import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL not found in .env")
    sys.exit(1)

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Extending WINTER-50 coupon validity...")
    try:
        # Extend to end of February 2026
        future_date = "2026-02-28 23:59:59"
        conn.execute(text("UPDATE admin_coupons SET end_date = :end_date, is_active = true WHERE code = 'WINTER-50';"), {"end_date": future_date})
        conn.commit()
        print(f"Coupon WINTER-50 extended to {future_date}")
    except Exception as e:
        print(f"Error: {e}")
