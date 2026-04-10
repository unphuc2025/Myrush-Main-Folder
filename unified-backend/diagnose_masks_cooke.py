import sys
import os
from database import SessionLocal
import models
from sqlalchemy.orm import Session

def diagnose_courts():
    db = SessionLocal()
    try:
        # Search for Cooke Town branch
        branch = db.query(models.Branch).filter(models.Branch.name.ilike("%Cooke Town%")).first()
        if not branch:
            print("Cooke Town branch not found")
            # List all branches as fallback
            all_b = db.query(models.Branch).all()
            print("Available branches:")
            for b in all_b:
                print(f"  - {b.name}")
            return
            
        print(f"Branch: {branch.name} ({branch.id})")
        
        courts = db.query(models.Court).filter(models.Court.branch_id == branch.id).all()
        print(f"\nFound {len(courts)} courts:")
        for c in courts:
            print(f"  - Court: {c.name}")
            print(f"    ID: {c.id}")
            print(f"    Logic: {c.logic_type}")
            print(f"    Shared Group ID: {c.shared_group_id}")
            print(f"    Total Zones: {c.total_zones}")
            
            slices = db.query(models.SportSlice).filter(models.SportSlice.court_id == c.id).all()
            if slices:
                print(f"    Slices:")
                for s in slices:
                    print(f"      * {s.name}: Mask={s.mask}, SportID={s.sport_id}")
            
            zones = db.query(models.CourtZone).filter(models.CourtZone.court_id == c.id).all()
            if zones:
                print(f"    Zones: {', '.join([z.zone_name for z in zones] if hasattr(zones[0], 'zone_name') else [str(z.id) for z in zones])}")
            print("-" * 30)
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    diagnose_courts()
