from sqlalchemy import text
from database import engine

def check_columns():
    with engine.connect() as conn:
        for table in ["adminvenues", "admin_branches", "admin_amenities", "admin_branch_amenities"]:
            print(f"\n--- Columns in {table} ---")
            try:
                result = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}'"))
                for row in result:
                    print(row[0])
            except Exception as e:
                print(f"Error checking {table}: {e}")

if __name__ == "__main__":
    check_columns()
