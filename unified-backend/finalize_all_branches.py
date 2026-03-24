from database import SessionLocal
import models
import uuid

db = SessionLocal()

# Global IDs
FT_TURF = uuid.UUID("6ae2ad07-a83c-4055-adbe-f118808e4ce2")
FT_COURT = uuid.UUID("6b94382b-6471-4c37-a82d-7fdb0b85d2d3")
FT_NETS = uuid.UUID("c445f8b2-e669-4970-b155-717d5fc8e00e")

FOOTBALL_ID = uuid.UUID("91eca5ba-7d72-4db3-93bb-0b14f1c7b15e")
BOXCRICKET_ID = uuid.UUID("55b67f44-205a-4f9f-9490-a4ab1e717fed")
CRICKET_ID = uuid.UUID("3e04986f-1044-4883-a4c1-883b0c59d41b")
CRICKET_NETS_ID = uuid.UUID("7e2f60ba-bea4-45c0-8da9-53c316de52bc")
VOLLEYBALL_ID = uuid.UUID("c4828b2f-e53b-4f32-a4cf-7ed93a3bd857")
PICKLEBALL_ID = uuid.UUID("f7ae86cc-fe9b-458b-84cf-fd0f62331253")

def set_hours(bid, start="06:00", end="23:59"):
    branch = db.query(models.Branch).get(bid)
    if branch:
        branch.opening_hours = {
            day: {"open": start, "close": end, "isActive": True}
            for day in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        }

def cleanup_courts(bid, active_ids):
    all_c = db.query(models.Court).filter(models.Court.branch_id == bid).all()
    for c in all_c:
        if c.id not in active_ids:
            c.is_active = False

# --- 1. RAILWAYS ---
RID = uuid.UUID("bbdec863-c298-481a-a29b-b889207cf65d")
set_hours(RID, "06:00", "23:59")

# Turf (Football / Box Cricket)
rturf = models.Court(
    id=uuid.uuid4(), branch_id=RID, game_type_id=FOOTBALL_ID, facility_type_id=FT_TURF,
    name="Main Turf (Football / Box Cricket)", logic_type="divisible", total_zones=1,
    price_per_hour=1800, is_active=True
)
db.add(rturf)
db.flush()
db.add(models.SportSlice(court_id=rturf.id, sport_id=FOOTBALL_ID, name="Football (7 a side)", mask=1, price_per_hour=1800))
db.add(models.SportSlice(court_id=rturf.id, sport_id=BOXCRICKET_ID, name="Box Cricket (7 a side)", mask=1, price_per_hour=1800))

# Cricket 11 a side
rcricket = models.Court(
    id=uuid.uuid4(), branch_id=RID, game_type_id=CRICKET_ID, facility_type_id=FT_TURF,
    name="Cricket Ground (11 a side)", logic_type="independent", total_zones=1,
    price_per_hour=3000, is_active=True
)
db.add(rcricket)

# Nets
rnets = models.Court(
    id=uuid.uuid4(), branch_id=RID, game_type_id=CRICKET_NETS_ID, facility_type_id=FT_NETS,
    name="Cricket Nets", logic_type="divisible", total_zones=3,
    price_per_hour=500, is_active=True
)
db.add(rnets)
db.flush()
for i in range(3):
    db.add(models.SportSlice(court_id=rnets.id, sport_id=CRICKET_NETS_ID, name=f"Net {i+1}", mask=(1<<i), price_per_hour=500))

# Volleyball
rvb = models.Court(
    id=uuid.uuid4(), branch_id=RID, game_type_id=VOLLEYBALL_ID, facility_type_id=FT_COURT,
    name="Volleyball Court", logic_type="independent", total_zones=1,
    price_per_hour=800, is_active=True
)
db.add(rvb)

cleanup_courts(RID, {rturf.id, rcricket.id, rnets.id, rvb.id})

# --- 2. MALLESHWARAM ---
MID = uuid.UUID("06abcc0b-97ba-43ae-ab01-746f5b7fe527")
set_hours(MID, "06:00", "23:59")

# Re-use existing Pickleball master if found or create
mpb = db.query(models.Court).filter(models.Court.branch_id == MID, models.Court.game_type_id == PICKLEBALL_ID, models.Court.logic_type == "divisible").first()
if mpb:
    mpb.is_active = True
    mpb.price_per_hour = 1000
    print("Re-using Malleshwaram Pickleball")
else:
    mpb = models.Court(
        id=uuid.uuid4(), branch_id=MID, game_type_id=PICKLEBALL_ID, facility_type_id=FT_COURT,
        name="Pickleball Courts (1-4)", logic_type="divisible", total_zones=4,
        price_per_hour=1000, is_active=True
    )
    db.add(mpb)
    db.flush()
    for i in range(4):
        db.add(models.SportSlice(court_id=mpb.id, sport_id=PICKLEBALL_ID, name=f"Court {i+1}", mask=(1<<i), price_per_hour=1000))

# Turf (Football / Box Cricket)
mturf = models.Court(
    id=uuid.uuid4(), branch_id=MID, game_type_id=FOOTBALL_ID, facility_type_id=FT_TURF,
    name="Main Turf (Football / Box Cricket)", logic_type="divisible", total_zones=1,
    price_per_hour=2000, is_active=True
)
db.add(mturf)
db.flush()
db.add(models.SportSlice(court_id=mturf.id, sport_id=FOOTBALL_ID, name="Football (6 a side)", mask=1, price_per_hour=2000))
db.add(models.SportSlice(court_id=mturf.id, sport_id=FOOTBALL_ID, name="Football (7 a side)", mask=1, price_per_hour=3500))
db.add(models.SportSlice(court_id=mturf.id, sport_id=BOXCRICKET_ID, name="Box Cricket", mask=1, price_per_hour=2000))

cleanup_courts(MID, {mpb.id, mturf.id})

# --- 3. BCU ---
BID = uuid.UUID("cfc0df1c-07c9-486f-960e-6b15bb9e3bf5")
set_hours(BID, "06:00", "23:59")
# Pickleball already found active in audit, just ensure 4 zones logic
bpb = db.query(models.Court).filter(models.Court.branch_id == BID, models.Court.game_type_id == PICKLEBALL_ID, models.Court.logic_type == "divisible").first()
if bpb:
    bpb.name = "Pickleball Courts (1-4)"
    bpb.price_per_hour = 1000
    bpb.is_active = True
cleanup_courts(BID, {bpb.id} if bpb else set())

db.commit()
print("Phase 4 branches (Railways, Malleshwaram, BCU) fully restored!")
