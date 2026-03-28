import os
import sys
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

sys.path.append(os.getcwd())
load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:YOUR_PASSWORD@db.vqglejkydwtopmllymuf.supabase.co:5432/MYRUSH?sslmode=require"
)

engine = create_engine(SQLALCHEMY_DATABASE_URL)

def verify():
    inspector = inspect(engine)
    tables = ["admin_court_units", "admin_division_modes", "admin_courts"]
    for table_name in tables:
        if table_name in inspector.get_table_names():
            columns = [c["name"] for c in inspector.get_columns(table_name)]
            print(f"Table {table_name}: {columns}")
        else:
            print(f"Table {table_name} NOT FOUND")

if __name__ == "__main__":
    verify()
