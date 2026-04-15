from database import SessionLocal
import models
import uuid

db = SessionLocal()

BRANCH_ID = "69b46e52-ca4e-4712-b02c-76c6ba4d4beb" # South United GVH
FOOTBALL_ID = "91eca5ba-7d72-4db3-93bb-0b14f1c7b15e"
BOXCRICKET_ID = "55b67f44-205a-4f9f-9490-a4ab1e717fed"

# 1. Create Frisbee if missing
frisbee = db.query(models.GameType).filter(models.GameType.name == "Frisbee").first()
if not frisbee:
    print("Creating Frisbee GameType...")
    frisbee = models.GameType(id=str(uuid.uuid4()), name="Frisbee", short_code="FRSB")
    db.add(frisbee)
    db.flush()

# 2. Find or Create the Master Court
master = db.query(models.Court).filter(
    models.Court.branch_id == BRANCH_ID,
    models.Court.name.like("%South United GVH%")
).first()

if master:
    print(f"Updating master court {master.name}...")
    master.name = "Main Turf (Football / Box Cricket / Frisbee)"
    master.logic_type = "divisible"
    master.total_zones = 1
    master.price_per_hour = 3500
    master.is_active = True
else:
    print("Creating NEW master court...")
    master = models.Court(
        branch_id=BRANCH_ID,
        game_type_id=FOOTBALL_ID, # Default to Football type
        name="Main Turf (Football / Box Cricket / Frisbee)",
        logic_type="divisible",
        total_zones=1,
        price_per_hour=3500,
        is_active=True
    )
    db.add(master)
    db.flush()

# 3. Handle Slices (Recreate all for 1 Zone)
db.query(models.SportSlice).filter(models.SportSlice.court_id == master.id).delete()

# Slices for 1 Zone (Mask = 1)
db.add(models.SportSlice(court_id=master.id, sport_id=FOOTBALL_ID, name="Football (5 a side)", mask=1, price_per_hour=3500))
db.add(models.SportSlice(court_id=master.id, sport_id=BOXCRICKET_ID, name="Boxcricket (5 a side)", mask=1, price_per_hour=3500))
db.add(models.SportSlice(court_id=master.id, sport_id=frisbee.id, name="Frisbee (5 a side)", mask=1, price_per_hour=3500))

# 4. Hide other fragments at this branch
fragments = db.query(models.Court).filter(
    models.Court.branch_id == BRANCH_ID,
    models.Court.id != master.id
).all()
for f in fragments:
    f.is_active = False

db.commit()
print("South United GVH fully restored and unified!")
