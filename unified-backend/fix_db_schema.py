import os
import sys
from sqlalchemy import create_engine, inspect, text
from dotenv import load_dotenv

# Add the current directory to sys.path to import local modules
sys.path.append(os.getcwd())

# Load environment variables
load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:YOUR_PASSWORD@db.vqglejkydwtopmllymuf.supabase.co:5432/MYRUSH?sslmode=require"
)

# Masked URL for logging
masked_url = SQLALCHEMY_DATABASE_URL
if "@" in masked_url:
    part1, part2 = masked_url.split("@")
    masked_url = f"{part1.split(':')[0]}:****@{part2}"
print(f"Connecting to: {masked_url}")

engine = create_engine(SQLALCHEMY_DATABASE_URL)

def fix_schema():
    with engine.connect() as conn:
        inspector = inspect(engine)
        
        # 1. Check admin_court_units
        table_name = "admin_court_units"
        if table_name in inspector.get_table_names():
            columns = [c["name"] for c in inspector.get_columns(table_name)]
            print(f"Columns in {table_name}: {columns}")
            if "name" not in columns:
                print(f"Adding 'name' column to {table_name}...")
                conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN name VARCHAR(50)"))
                conn.commit()
                print("Done.")
            else:
                print(f"'name' column already exists in {table_name}.")
        else:
            print(f"Table {table_name} not found!")

        # 2. Check admin_division_modes
        table_name = "admin_division_modes"
        if table_name in inspector.get_table_names():
            columns = [c["name"] for c in inspector.get_columns(table_name)]
            print(f"Columns in {table_name}: {columns}")
            if "name" not in columns:
                print(f"Adding 'name' column to {table_name}...")
                conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN name VARCHAR(255)"))
                conn.commit()
                print("Done.")
            else:
                print(f"'name' column already exists in {table_name}.")
        else:
            print(f"Table {table_name} not found!")
            
        # 3. Double check for any other missing columns in admin_courts
        table_name = "admin_courts"
        if table_name in inspector.get_table_names():
            columns = [c["name"] for c in inspector.get_columns(table_name)]
            print(f"Columns in {table_name}: {columns}")
            # Ensure our new columns exist
            for col, col_type in [("facility_type_id", "UUID"), ("logic_type", "VARCHAR(50)"), ("shared_group_id", "UUID"), ("capacity_limit", "INTEGER")]:
                if col not in columns:
                    print(f"Adding '{col}' column to {table_name}...")
                    conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col} {col_type}"))
                    conn.commit()
                    print("Done.")

if __name__ == "__main__":
    try:
        fix_schema()
        print("Schema fix process completed successfully.")
    except Exception as e:
        print(f"An error occurred: {e}")
