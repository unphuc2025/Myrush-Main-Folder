import models, database
from sqlalchemy import text
import json

db = database.SessionLocal()
try:
    # Find Cooke Town Branch
    branch = db.query(models.Branch).filter(models.Branch.name.like("%Cooke Town%")).first()
    if not branch:
        print("Branch not found")
    else:
        print(f"Branch: {branch.name} ({branch.id})")
        courts = db.query(models.Court).filter(models.Court.branch_id == branch.id).all()
        for c in courts:
            print(f"\nCourt: {c.name} ({c.id})")
            print(f"  Logic: {c.logic_type}, Group: {c.shared_group_id}")
            # Check Slices
            slices = db.query(models.SportSlice).filter(models.SportSlice.court_id == c.id).all()
            if slices:
                for s in slices:
                    print(f"  - Slice: {s.name}, Mask: {s.mask}")
            else:
                print("  - No sport slices found")
finally:
    db.close()
