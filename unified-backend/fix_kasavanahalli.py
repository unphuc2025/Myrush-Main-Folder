from database import SessionLocal
import models

db = SessionLocal()

BRANCH_ID = "f349e9f2-2678-442f-8c21-6e49cb097d4e" # Kasavanahalli
FOOTBALL_ID = "91eca5ba-7d72-4db3-93bb-0b14f1c7b15e"
BOXCRICKET_ID = "55b67f44-205a-4f9f-9490-a4ab1e717fed"

# 1. Update Hours (6AM - 10PM)
branch = db.query(models.Branch).get(BRANCH_ID)
hours = {
    day: {"open": "06:00", "close": "22:00", "isActive": True}
    for day in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
}
branch.opening_hours = hours

# 2. Find or Create the Master Court
master = db.query(models.Court).filter(
    models.Court.branch_id == BRANCH_ID
).order_by(models.Court.created_at).first()

if not master:
    print("Creating NEW master court for Kasavanahalli...")
    master = models.Court(
        branch_id=BRANCH_ID,
        game_type_id=FOOTBALL_ID,
        name="Main Turf (Football / Box Cricket)",
        logic_type="divisible",
        total_zones=1,
        price_per_hour=1800,
        is_active=True
    )
    db.add(master)
    db.flush()
else:
    print(f"Updating master court {master.name}...")
    master.name = "Main Turf (Football / Box Cricket)"
    master.logic_type = "divisible"
    master.total_zones = 1
    master.price_per_hour = 1800
    master.is_active = True

# 3. Handle Slices
db.query(models.SportSlice).filter(models.SportSlice.court_id == master.id).delete()

db.add(models.SportSlice(court_id=master.id, sport_id=FOOTBALL_ID, name="Football (5 a side)", mask=1, price_per_hour=1800))
db.add(models.SportSlice(court_id=master.id, sport_id=BOXCRICKET_ID, name="Boxcricket (5 a side)", mask=1, price_per_hour=1800))

# 4. Hide others
others = db.query(models.Court).filter(
    models.Court.branch_id == BRANCH_ID,
    models.Court.id != master.id
).all()
for o in others:
    o.is_active = False

db.commit()
print("Kasavanahalli fully restored!")
