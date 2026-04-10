import sys
import os
from database import SessionLocal
import models
from sqlalchemy.orm import Session

def diagnose_courts():
    db = SessionLocal()
    with open("cooke_town_diag.txt", "w", encoding="utf-8") as f:
        try:
            # Search for Cooke Town branch
            branch = db.query(models.Branch).filter(models.Branch.name.ilike("%Cooke Town%")).first()
            if not branch:
                f.write("Cooke Town branch not found\n")
                return
                
            f.write(f"Branch: {branch.name} ({branch.id})\n")
            
            courts = db.query(models.Court).filter(models.Court.branch_id == branch.id).all()
            f.write(f"\nFound {len(courts)} courts:\n")
            for c in courts:
                f.write(f"  - Court: {c.name}\n")
                f.write(f"    ID: {c.id}\n")
                f.write(f"    Logic: {c.logic_type}\n")
                f.write(f"    Shared Group ID: {c.shared_group_id}\n")
                f.write(f"    Total Zones: {c.total_zones}\n")
                
                slices = db.query(models.SportSlice).filter(models.SportSlice.court_id == c.id).all()
                if slices:
                    f.write(f"    Slices:\n")
                    for s in slices:
                        f.write(f"      * {s.name}: Mask={s.mask}, SportID={s.sport_id}\n")
                
                zones = db.query(models.CourtZone).filter(models.CourtZone.court_id == c.id).all()
                if zones:
                    f.write(f"    Zones: {', '.join([z.zone_name for z in zones] if hasattr(zones[0], 'zone_name') else [str(z.id) for z in zones])}\n")
                f.write("-" * 30 + "\n")
                
        except Exception as e:
            f.write(f"Error: {e}\n")
            import traceback
            f.write(traceback.format_exc())
        finally:
            db.close()

if __name__ == "__main__":
    diagnose_courts()
