import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def run_diagnostic():
    tables = ["admin_court_units", "admin_division_modes"]
    with engine.connect() as conn:
        for table in tables:
            print(f"\n--- Columns in {table} ---")
            query = text(f"""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = '{table}'
                ORDER BY ordinal_position
            """)
            res = conn.execute(query)
            for row in res:
                print(f"Col: {row[0]}, Type: {row[1]}, Nullable: {row[2]}, Default: {row[3]}")

if __name__ == "__main__":
    try:
        run_diagnostic()
    except Exception as e:
        print(f"Error: {e}")
