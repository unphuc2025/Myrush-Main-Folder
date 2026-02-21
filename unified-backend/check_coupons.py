from database import SessionLocal
from sqlalchemy import text

def check_coupons():
    db = SessionLocal()
    try:
        query = text("SELECT code, discount_type, discount_value, min_order_value, is_active, start_date, end_date FROM admin_coupons")
        results = db.execute(query).fetchall()
        print(f"Total coupons in DB: {len(results)}")
        for row in results:
            print(f"Code: {row[0]}, Type: {row[1]}, Value: {row[2]}, Min: {row[3]}, Active: {row[4]}, Start: {row[5]}, End: {row[6]}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_coupons()
