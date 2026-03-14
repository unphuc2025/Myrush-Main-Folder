from database import SessionLocal
import models

def fix():
    db = SessionLocal()
    try:
        branch = db.query(models.Branch).filter(models.Branch.name.ilike("%Rajajinagar%")).first()
        if not branch:
            print("Branch Rajajinagar not found")
            return
        
        # 1. Shared Group
        group = db.query(models.SharedGroup).filter(models.SharedGroup.branch_id == branch.id).first()
        if not group:
            group = models.SharedGroup(name="Rajajinagar Main Turf", branch_id=branch.id)
            db.add(group)
            db.commit()
            db.refresh(group)
        
        # 2. Update Courts
        courts = db.query(models.Court).filter(models.Court.branch_id == branch.id).all()
        for c in courts:
            c.logic_type = "shared"
            c.shared_group_id = group.id
            if "Football" in c.name:
                c.name = "Football (6-a-side)"
            if "Boxcricket" in c.name or "Cricket" in c.name:
                c.name = "Box Cricket"
        
        db.commit()
        print(f"Rajajinagar courts updated to 'shared' in group '{group.name}'")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix()
