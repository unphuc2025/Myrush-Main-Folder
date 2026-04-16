from database import SessionLocal
import models
import uuid
import traceback

db = SessionLocal()

BRANCH_ID = "4a3708bd-5d29-4b61-ac5c-87f1b737cb49" # Omega Circuit
FOOTBALL_ID = "91eca5ba-7d72-4db3-93bb-0b14f1c7b15e"
BOXCRICKET_ID = "55b67f44-205a-4f9f-9490-a4ab1e717fed"
BASKETBALL_ID = uuid.UUID("7381ba5f-352e-4679-8376-fe63ea3960fb")
PICKLEBALL_ID = uuid.UUID("f7ae86cc-fe9b-458b-84cf-fd0f62331253")
VOLLEYBALL_ID = uuid.UUID("c4828b2f-e53b-4f32-a4cf-7ed93a3bd857")
CRICKET_NETS_ID = uuid.UUID("7e2f60ba-bea4-45c0-8da9-53c316de52bc")

FT_TURF = uuid.UUID("6ae2ad07-a83c-4055-adbe-f118808e4ce2")
FT_COURT = uuid.UUID("6b94382b-6471-4c37-a82d-7fdb0b85d2d3")
FT_NETS = uuid.UUID("c445f8b2-e669-4970-b155-717d5fc8e00e")

# 1. Ensure 24/7 Hours
branch = db.query(models.Branch).get(BRANCH_ID)
hours = {
    day: {"open": "00:00", "close": "23:59", "isActive": True}
    for day in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
}
branch.opening_hours = hours

def clean_and_create(sport_id, name, logic, zones=1, price=1800):
    # Hide existing active courts for this sport at this branch
    db.query(models.Court).filter(
        models.Court.branch_id == BRANCH_ID,
        models.Court.game_type_id == sport_id
    ).update({"is_active": False})
    
    # Create new unified court
    c = models.Court(
        branch_id=BRANCH_ID,
        game_type_id=sport_id,
        name=name,
        logic_type=logic,
        total_zones=zones,
        price_per_hour=price,
        is_active=True
    )
    db.add(c)
    db.flush()
    
    # Add Slices if divisible
    if logic == "divisible" and zones > 1:
        for i in range(zones):
            db.add(models.SportSlice(
                court_id=c.id,
                sport_id=sport_id,
                name=f"Unit {i+1}",
                mask=(1 << i),
                price_per_hour=price
            ))
    print(f"Created {name} setup.")

try:
    # 2. Reconstruct specific units
    # Turf (Football / Boxcricket)
    print("Setting up Turf...")
    turf = models.Court(
        id=uuid.uuid4(),
        branch_id=BRANCH_ID,
        game_type_id=FOOTBALL_ID,
        facility_type_id=FT_TURF,
        name="Main Turf (Football / Box Cricket)",
        logic_type="divisible",
        total_zones=1,
        price_per_hour=1800,
        is_active=True
    )
    db.add(turf)
    db.flush()
    db.add(models.SportSlice(court_id=turf.id, sport_id=FOOTBALL_ID, name="Football (6 a side)", mask=1, price_per_hour=1800))
    db.add(models.SportSlice(court_id=turf.id, sport_id=BOXCRICKET_ID, name="Boxcricket (6 a side)", mask=1, price_per_hour=1800))

    # Basketball / Pickleball
    print("Setting up Basketball/Pickleball...")
    bp_court = models.Court(
        id=uuid.uuid4(),
        branch_id=BRANCH_ID,
        game_type_id=BASKETBALL_ID,
        facility_type_id=FT_COURT,
        name="Multi-Sport Court (Basketball / Pickleball)",
        logic_type="divisible",
        total_zones=4,
        price_per_hour=800,
        is_active=True
    )
    db.add(bp_court)
    db.flush()
    db.add(models.SportSlice(court_id=bp_court.id, sport_id=PICKLEBALL_ID, name="Pickleball 1", mask=1, price_per_hour=800))
    db.add(models.SportSlice(court_id=bp_court.id, sport_id=PICKLEBALL_ID, name="Pickleball 2", mask=2, price_per_hour=800))
    db.add(models.SportSlice(court_id=bp_court.id, sport_id=PICKLEBALL_ID, name="Pickleball 3", mask=4, price_per_hour=800))
    db.add(models.SportSlice(court_id=bp_court.id, sport_id=BASKETBALL_ID, name="Basketball (Full Court)", mask=15, price_per_hour=800))

    # Volleyball
    print("Setting up Volleyball...")
    vb = models.Court(
        id=uuid.uuid4(),
        branch_id=BRANCH_ID,
        game_type_id=VOLLEYBALL_ID,
        facility_type_id=FT_COURT,
        name="Volleyball Court",
        logic_type="independent",
        total_zones=1,
        price_per_hour=800,
        is_active=True
    )
    db.add(vb)
    db.flush()

    # Nets
    print("Setting up Nets...")
    nets = models.Court(
        id=uuid.uuid4(),
        branch_id=BRANCH_ID,
        game_type_id=CRICKET_NETS_ID,
        facility_type_id=FT_NETS,
        name="Cricket Nets",
        logic_type="divisible",
        total_zones=3,
        price_per_hour=500,
        is_active=True
    )
    db.add(nets)
    db.flush()
    for i in range(3):
        db.add(models.SportSlice(court_id=nets.id, sport_id=CRICKET_NETS_ID, name=f"Net {i+1}", mask=(1 << i), price_per_hour=500))

    # 4. Hide all others
    new_ids = {turf.id, bp_court.id, vb.id, nets.id}
    all_c = db.query(models.Court).filter(models.Court.branch_id == BRANCH_ID).all()
    for c in all_c:
        if c.id not in new_ids:
            c.is_active = False

    db.commit()
    print("Omega Circuit Hyderabad fully restored!")

except Exception as e:
    db.rollback()
    with open('omega_error.txt', 'w') as f:
        f.write(f"ERROR: {str(e)}\n\n")
        f.write(traceback.format_exc())
    print("Error caught and written to omega_error.txt")

