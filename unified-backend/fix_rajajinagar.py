import uuid
from database import SessionLocal
import models

def fix_rajajinagar_data():
    db = SessionLocal()
    try:
        branch = db.query(models.Branch).filter(models.Branch.name.ilike("%Rajajinagar%")).first()
        if not branch:
            print("Branch not found")
            return
        
        branch_id = branch.id
        
        # 1. Ensure Shared Group exists
        group = db.query(models.SharedGroup).filter(models.SharedGroup.branch_id == branch_id, models.SharedGroup.name == "Rajajinagar Main Turf").first()
        if not group:
            group = models.SharedGroup(name="Rajajinagar Main Turf", branch_id=branch_id)
            db.add(group)
            db.commit()
            db.refresh(group)
        
        # 2. Get all court IDs for this branch
        court_ids = [c.id for c in db.query(models.Court).filter(models.Court.branch_id == branch_id).all()]
        
        # 3. Delete Bookings associated with these courts
        if court_ids:
            db.query(models.Booking).filter(models.Booking.court_id.in_(court_ids)).delete(synchronize_session=False)
        
        # 4. Delete existing courts for this branch
        db.query(models.Court).filter(models.Court.branch_id == branch_id).delete(synchronize_session=False)
        
        # 5. Add Football (Shared)
        fb_type = db.query(models.GameType).filter(models.GameType.name.ilike("%Football%")).first()
        fb_court = models.Court(
            name="Football (6-a-side)",
            branch_id=branch_id,
            game_type_id=fb_type.id,
            logic_type="shared",
            shared_group_id=group.id,
            price_per_hour=2000,
            is_active=True,
            price_conditions=[],
            unavailability_slots=[]
        )
        db.add(fb_court)
        
        # 6. Add Box Cricket (Shared)
        cricket_type = db.query(models.GameType).filter(models.GameType.name.ilike("%Cricket%")).first()
        cricket_court = models.Court(
            name="Box Cricket",
            branch_id=branch_id,
            game_type_id=cricket_type.id,
            logic_type="shared",
            shared_group_id=group.id,
            price_per_hour=2000,
            is_active=True,
            price_conditions=[],
            unavailability_slots=[]
        )
        db.add(cricket_court)
        
        db.commit()
        print(f"Cleanup complete for Rajajinagar (Branch ID: {branch_id})")
        print(f"Shared Group ID: {group.id}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_rajajinagar_data()
