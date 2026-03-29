import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def run_sql(sql):
    with engine.connect() as conn:
        try:
            conn.execute(text(sql))
            conn.commit()
            print(f"SUCCESS: {sql}")
        except Exception as e:
            print(f"FAILED: {sql} - Error: {e}")

if __name__ == "__main__":
    # admin_court_units
    run_sql("ALTER TABLE admin_court_units ALTER COLUMN unit_name DROP NOT NULL")
    run_sql("ALTER TABLE admin_court_units ALTER COLUMN capacity DROP NOT NULL")
    run_sql("ALTER TABLE admin_court_units ALTER COLUMN is_active DROP NOT NULL")
    
    # admin_division_modes
    run_sql("ALTER TABLE admin_division_modes ALTER COLUMN mode_name DROP NOT NULL")
    
    print("\nVerifying...")
    with engine.connect() as conn:
        res = conn.execute(text("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'admin_court_units' AND column_name IN ('unit_name', 'capacity', 'is_active')"))
        for row in res:
            print(f"admin_court_units.{row[0]}: Nullable={row[1]}")
        
        res = conn.execute(text("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'admin_division_modes' AND column_name = 'mode_name'"))
        for row in res:
            print(f"admin_division_modes.{row[0]}: Nullable={row[1]}")
