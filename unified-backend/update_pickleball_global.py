from database import SessionLocal
import models

db = SessionLocal()

# List of branches and their specific pickleball setup from the sheet
pickleball_configs = [
    {"branch_keyword": "Cooke Town", "zones": 4, "price": 1000},
    {"branch_keyword": "Malleshwaram", "zones": 4, "price": 1000},
    {"branch_keyword": "BCU", "zones": 4, "price": 1000},
    {"branch_keyword": "Chennai", "zones": 4, "price": 700}
]

PICKLEBALL_SPORT_ID = "f7ae86cc-fe9b-458b-84cf-fd0f62331253"

for config in pickleball_configs:
    branch = db.query(models.Branch).filter(models.Branch.name.like(f"%{config['branch_keyword']}%")).first()
    if not branch:
        print(f"Branch {config['branch_keyword']} not found!")
        continue

    # Find the active Pickleball court
    court = db.query(models.Court).filter(
        models.Court.branch_id == branch.id,
        models.Court.is_active == True,
        models.Court.game_type_id == PICKLEBALL_SPORT_ID
    ).first()

    if not court:
        print(f"No active Pickleball court found for {branch.name}. Creating one...")
        court = models.Court(
            branch_id=branch.id,
            game_type_id=PICKLEBALL_SPORT_ID,
            name=f"Pickleball - {config['branch_keyword']}",
            logic_type="divisible",
            total_zones=config["zones"],
            price_per_hour=config["price"],
            is_active=True
        )
        db.add(court)
        db.flush()
    else:
        print(f"Updating {court.name} at {branch.name}...")
        court.logic_type = "divisible"
        court.total_zones = config["zones"]
        court.price_per_hour = config["price"]

    # Clear and recreate slices for these zones
    db.query(models.SportSlice).filter(models.SportSlice.court_id == court.id).delete()
    
    for i in range(config["zones"]):
        db.add(models.SportSlice(
            court_id=court.id,
            sport_id=PICKLEBALL_SPORT_ID,
            name=f"Court {i+1}",
            mask=(1 << i),
            price_per_hour=config["price"]
        ))
    
    # Also add a "Full Booking" option if they want to book all 4? 
    # Usually for pickleball people book individual courts. 
    # But I'll stick to individual court slices as Court 1, 2, 3, 4.

db.commit()
print("Pickleball 4-Zone setup completed for all specified branches!")
