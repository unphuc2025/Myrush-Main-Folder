from sqlalchemy import text
from database import engine

def check_data():
    with engine.connect() as conn:
        print("\n--- Rows in adminvenues ---")
        try:
            result = conn.execute(text(f"SELECT COUNT(*) FROM adminvenues"))
            count = result.scalar()
            print(f"Count: {count}")
            if count > 0:
                rows = conn.execute(text(f"SELECT id, court_name FROM adminvenues LIMIT 5")).fetchall()
                for row in rows:
                    print(row)
        except Exception as e:
            print(f"Error checking adminvenues: {e}")

if __name__ == "__main__":
    check_data()
