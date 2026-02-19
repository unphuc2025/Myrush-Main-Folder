from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
import os
from dotenv import load_dotenv

load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def fetch_mapping():
    db = SessionLocal()
    try:
        # Get first branch
        branch = db.query(models.Branch).first()
        if not branch:
            print("No branches found")
            return

        print(f"Venue: {branch.name} ({branch.id})")
        
        # Get courts for this branch
        courts = db.query(models.Court).filter(models.Court.branch_id == branch.id).all()
        print("\nCourts:")
        for court in courts:
            print(f"- {court.name}: {court.id}")
            
        # Get unique game types for these courts
        game_type_ids = [c.game_type_id for c in courts]
        game_types = db.query(models.GameType).filter(models.GameType.id.in_(game_type_ids)).all()
        print("\nSports:")
        for gt in game_types:
            print(f"- {gt.name}: {gt.id}")
            
    finally:
        db.close()

if __name__ == "__main__":
    fetch_mapping()
