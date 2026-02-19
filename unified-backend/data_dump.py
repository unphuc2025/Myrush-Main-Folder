from sqlalchemy import create_engine, text
import os, json
from dotenv import load_dotenv

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URL'))

def dump_data():
    with engine.connect() as conn:
        print("--- BRANCHES ---")
        branches = conn.execute(text('SELECT id, name, opening_hours FROM admin_branches')).fetchall()
        for b in branches:
            print(f"ID: {b.id}, Name: {b.name}")
            print(f"Opening Hours: {json.dumps(b.opening_hours, indent=2)}")
            print("-" * 20)
            
        print("\n--- COURTS ---")
        courts = conn.execute(text('SELECT id, name, branch_id, price_conditions FROM admin_courts')).fetchall()
        for c in courts:
            print(f"ID: {c.id}, Name: {c.name}, BranchID: {c.branch_id}")
            print(f"Price Conditions: {json.dumps(c.price_conditions, indent=2)}")
            print("-" * 20)

if __name__ == "__main__":
    dump_data()
