from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
import json

# Load env vars
load_dotenv()

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL not found in .env")
    exit(1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    with open("debug_output.txt", "w", encoding="utf-8") as f:
        # 1. Check Admin Branches (Opening Hours)
        f.write("\n" + "="*80 + "\n")
        f.write(f" {'ADMIN BRANCHES (Opening Hours)'.center(80, '=')} \n")
        f.write("="*80 + "\n\n")
        
        try:
            branches = db.execute(text("SELECT id, name, opening_hours FROM admin_branches WHERE is_active = true")).fetchall()
            for b in branches:
                row = dict(b._mapping)
                f.write(f"ID: {row['id']}\n")
                f.write(f"Name: {row['name']}\n")
                f.write(f"Opening Hours: {json.dumps(row['opening_hours'], indent=2) if row['opening_hours'] else 'None'}\n")
                f.write("-" * 40 + "\n")
        except Exception as e:
            f.write(f"Error fetching branches: {e}\n")

        # 2. Check Admin Courts (Prices & Conditions)
        f.write("\n" + "="*80 + "\n")
        f.write(f" {'ADMIN COURTS (Prices, Conditions, Unavailability)'.center(80, '=')} \n")
        f.write("="*80 + "\n\n")
        
        try:
            courts = db.execute(text("""
                SELECT 
                    ac.id, 
                    ac.name,
                    ab.name as branch_name,
                    agt.name as game_type,
                    ac.price_per_hour,
                    ac.price_conditions,
                    ac.unavailability_slots
                FROM admin_courts ac
                LEFT JOIN admin_branches ab ON ac.branch_id = ab.id
                LEFT JOIN admin_game_types agt ON ac.game_type_id = agt.id
                WHERE ac.is_active = true
            """)).fetchall()
            
            for c in courts:
                row = dict(c._mapping)
                f.write(f"ID: {row['id']}\n")
                f.write(f"Branch: {row['branch_name']}\n")
                f.write(f"Court: {row['name']} ({row['game_type']})\n")
                f.write(f"Base Price: {row['price_per_hour']}\n")
                f.write(f"Price Conditions: {json.dumps(row['price_conditions'], indent=2) if row['price_conditions'] else 'None'}\n")
                f.write(f"Unavailability: {json.dumps(row['unavailability_slots'], indent=2) if row['unavailability_slots'] else 'None'}\n")
                f.write("-" * 40 + "\n")
        except Exception as e:
            f.write(f"Error fetching courts: {e}\n")

finally:
    db.close()
