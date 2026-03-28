import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def fix_schema():
    with engine.connect() as conn:
        print("Fixing admin_court_units...")
        # Make problematic columns nullable
        try:
            conn.execute(text("ALTER TABLE admin_court_units ALTER COLUMN unit_name DROP NOT NULL"))
            print("Dropped NOT NULL from unit_name")
        except Exception as e:
            print(f"Could not fix unit_name: {e}")
            
        try:
            conn.execute(text("ALTER TABLE admin_court_units ALTER COLUMN capacity DROP NOT NULL"))
            print("Dropped NOT NULL from capacity")
        except Exception as e:
            print(f"Could not fix capacity: {e}")
            
        try:
            conn.execute(text("ALTER TABLE admin_court_units ALTER COLUMN is_active DROP NOT NULL"))
            print("Dropped NOT NULL from is_active")
        except Exception as e:
            print(f"Could not fix is_active: {e}")

        print("\nFixing admin_division_modes...")
        try:
            conn.execute(text("ALTER TABLE admin_division_modes ALTER COLUMN mode_name DROP NOT NULL"))
            print("Dropped NOT NULL from mode_name")
        except Exception as e:
            print(f"Could not fix mode_name: {e}")
            
        conn.commit()
        print("\nSchema fix completed.")

if __name__ == "__main__":
    fix_schema()
