import models
import database
from sqlalchemy.orm import Session

db: Session = database.SessionLocal()
try:
    venue = db.query(models.Branch).filter(models.Branch.name.ilike('%Kengeri%')).first()
    if venue:
        print(f"Venue: {venue.name}, ID: {venue.id}")
        courts = db.query(models.Court).filter(models.Court.branch_id == venue.id).all()
        print(f"Total Courts: {len(courts)}")
        for i, c in enumerate(courts):
            print(f"Court {i+1}: {c.name} (ID: {c.id}, SG: {c.shared_group_id})")
    else:
        print("Venue not found")
finally:
    db.close()
