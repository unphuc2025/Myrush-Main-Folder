from database import SessionLocal
import models
import uuid

db = SessionLocal()

BRANCH_ID = "77612592-1d59-4ac7-ab56-830a7878486d" 
BADMINTON_ID = "0251bb9f-d7e3-4983-b287-97156132c2f3"
SWIMMING_ID = "1426593e-2149-4e45-a895-b92c36e03f9a"
SQUASH_ID = "146bf1b9-7197-438b-85d4-63dc2add1f9d"
TT_ID = "4fec851c-18b2-431e-90cc-a99a81caa3eb"
CRICKET_NETS_ID = "7e2f60ba-bea4-45c0-8da9-53c316de52bc"

# 1. Update Hours (6AM - 10PM)
branch = db.query(models.Branch).filter(models.Branch.id == BRANCH_ID).first()
if branch:
    hours = {
        day: {"open": "06:00", "close": "22:00", "isActive": True}
        for day in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    }
    branch.opening_hours = hours

def clean_and_create(sport_id, name, logic, zones=1, cap=1, price=300):
    # Hide existing active courts for this sport at this branch
    courts = db.query(models.Court).filter(
        models.Court.branch_id == BRANCH_ID,
        models.Court.game_type_id == sport_id
    ).all()
    for c in courts:
        c.is_active = False
    
    # Create new unified court
    new_court = models.Court(
        branch_id=BRANCH_ID,
        game_type_id=sport_id,
        name=name,
        logic_type=logic,
        total_zones=zones,
        capacity_limit=cap,
        price_per_hour=price,
        is_active=True
    )
    db.add(new_court)
    db.flush()
    
    # Add Slices if divisible
    if logic == "divisible":
        for i in range(zones):
            db.add(models.SportSlice(
                court_id=new_court.id,
                sport_id=sport_id,
                name=f"Unit {i+1}",
                mask=(1 << i),
                price_per_hour=price
            ))
    print(f"Created {name} setup.")

# 2. Reconstruct all
clean_and_create(BADMINTON_ID, "Badminton", "divisible", zones=3)
clean_and_create(SWIMMING_ID, "Swimming Pool", "capacity", cap=20, price=300)
clean_and_create(SQUASH_ID, "Squash", "independent", price=300)
clean_and_create(TT_ID, "Table Tennis", "divisible", zones=2, price=300)
clean_and_create(CRICKET_NETS_ID, "Cricket Nets", "divisible", zones=3, price=300)

db.commit()
print("Hesaraghatta branch fully restored!")
