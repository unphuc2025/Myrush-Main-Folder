from database import SessionLocal
import models
import uuid
import traceback

db = SessionLocal()

BRANCH_ID = uuid.UUID("040c9924-32c0-44eb-9d7f-ac7888d057e5")
FOOTBALL_ID = uuid.UUID("91eca5ba-7d72-4db3-93bb-0b14f1c7b15e")
BOXCRICKET_ID = uuid.UUID("55b67f44-205a-4f9f-9490-a4ab1e717fed")

try:
    # 1. Update Hours (6AM - 11PM)
    branch = db.query(models.Branch).filter(models.Branch.id == BRANCH_ID).first()
    if branch:
        hours = {
            day: {"open": "06:00", "close": "23:00", "isActive": True}
            for day in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        }
        branch.opening_hours = hours
        print(f"Updated hours for {branch.name}")

    # 2. Reconstruct Master Court
    # Find any active master court first
    master = db.query(models.Court).filter(
        models.Court.branch_id == BRANCH_ID,
        models.Court.is_active == True
    ).first()
    
    if not master:
        # Repurpose any existing court (even inactive)
        master = db.query(models.Court).filter(models.Court.branch_id == BRANCH_ID).first()

    if not master:
        print("Creating NEW master court...")
        master = models.Court(
            id=uuid.uuid4(),
            branch_id=BRANCH_ID,
            game_type_id=FOOTBALL_ID,
            name="Main Turf (Football / Box Cricket)",
            logic_type="divisible",
            total_zones=1,
            price_per_hour=1400,
            is_active=True
        )
        db.add(master)
        db.flush()
    else:
        print(f"Updating legacy court {master.name}...")
        master.name = "Main Turf (Football / Box Cricket)"
        master.logic_type = "divisible"
        master.total_zones = 1
        master.price_per_hour = 1400
        master.is_active = True

    # 3. Handle Slices
    db.query(models.SportSlice).filter(models.SportSlice.court_id == master.id).delete()
    db.add(models.SportSlice(court_id=master.id, sport_id=FOOTBALL_ID, name="Football (5 a side)", mask=1, price_per_hour=1400))
    db.add(models.SportSlice(court_id=master.id, sport_id=BOXCRICKET_ID, name="Boxcricket (5 a side)", mask=1, price_per_hour=1400))

    # 4. Hide all other courts at this branch
    others = db.query(models.Court).filter(
        models.Court.branch_id == BRANCH_ID,
        models.Court.id != master.id
    ).all()
    for o in others:
        o.is_active = False

    db.commit()
    print("Grid Game setup restored successfully!")

except Exception as e:
    db.rollback()
    print(f"ERROR occured: {str(e)}")
    traceback.print_exc()
finally:
    db.close()
