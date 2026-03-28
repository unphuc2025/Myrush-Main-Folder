import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import models

# Add current directory to path to import models
sys.path.append(os.getcwd())

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_cooke_town_courts():
    db = SessionLocal()
    try:
        venue = db.query(models.Branch).filter(models.Branch.name.ilike('%Cooke Town%')).first()
        if not venue:
            print("Venue not found")
            return
        
        print(f"Venue: {venue.name} ({venue.id})")
        courts = db.query(models.Court).filter(models.Court.branch_id == venue.id).all()
        for court in courts:
            print(f"\nCourt: {court.name}")
            print(f"  Logic Type: {court.logic_type}")
            print(f"  ID: {court.id}")
            
            # Check for units if divisible
            if court.logic_type == 'divisible':
                units = db.query(models.CourtUnit).filter(models.CourtUnit.court_id == court.id).all()
                print(f"  Units: {[u.name for u in units]}")
                modes = db.query(models.DivisionMode).filter(models.DivisionMode.court_id == court.id).all()
                for mode in modes:
                    mode_units = db.query(models.CourtUnit).secondary("admin_division_mode_units").filter(models.DivisionMode.id == mode.id).all() # This might be wrong syntax
                    # Re-querying correctly
                    # mode_units is available via relationship if defined correctly in models.py
                    print(f"  Mode: {mode.name}")

    finally:
        db.close()

if __name__ == "__main__":
    get_cooke_town_courts()
