import models
import database
from sqlalchemy.orm import Session

db: Session = database.SessionLocal()
try:
    # Use a more specific query for Kengeri
    venue = db.query(models.Branch).filter(models.Branch.name.ilike('%Kengeri%')).first()
    if venue:
        print(f"Venue: {venue.name}, ID: {venue.id}")
        courts = db.query(models.Court).filter(models.Court.branch_id == venue.id).all()
        print(f"Found {len(courts)} courts.")
        for c in courts:
            print(f"--- COURT START ---")
            print(f"Name: {c.name}")
            print(f"ID: {c.id}")
            print(f"SharedGroupID: {c.shared_group_id}")
            print(f"LogicType: {c.logic_type}")
            print(f"--- COURT END ---")
    else:
        print("Venue not found")
finally:
    db.close()
