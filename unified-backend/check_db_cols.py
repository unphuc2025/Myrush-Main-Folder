import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def check_columns(table_name):
    print(f"--- Columns for {table_name} ---")
    query = text(f"""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = '{table_name}'
        ORDER BY ordinal_position
    """)
    with engine.connect() as conn:
        res = conn.execute(query)
        for row in res:
            print(row)

if __name__ == "__main__":
    check_columns("admin_court_units")
    check_columns("admin_division_modes")
