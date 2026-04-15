from database import SessionLocal
import models
import uuid

db = SessionLocal()

BRANCH_ID = "f349e9f2-2678-442f-8c21-6e49cb097d4e" # Kasavanahalli
CRICKET_NETS_SPORT_ID = "7e2f60ba-bea4-45c0-8da9-53c316de52bc"

# 1. Find the legacy Nets court
nets = db.query(models.Court).filter(
    models.Court.branch_id == BRANCH_ID,
    models.Court.name.ilike("%Cricket%Net%")
).first()

if not nets:
    print("Creating NEW Cricket Nets for Kasavanahalli...")
    nets = models.Court(
        branch_id=BRANCH_ID,
        game_type_id=CRICKET_NETS_SPORT_ID,
        name="Cricket Nets",
        logic_type="divisible",
        total_zones=2,
        price_per_hour=350,
        is_active=True
    )
    db.add(nets)
    db.flush()
else:
    print(f"Updating legacy Nets {nets.name}...")
    nets.name = "Cricket Nets"
    nets.logic_type = "divisible"
    nets.total_zones = 2
    nets.price_per_hour = 350
    nets.is_active = True

# 2. Add Slices for 2 Nets
db.query(models.SportSlice).filter(models.SportSlice.court_id == nets.id).delete()

db.add(models.SportSlice(court_id=nets.id, sport_id=CRICKET_NETS_SPORT_ID, name="Net 1", mask=1, price_per_hour=350))
db.add(models.SportSlice(court_id=nets.id, sport_id=CRICKET_NETS_SPORT_ID, name="Net 2", mask=2, price_per_hour=350))

db.commit()
print("Kasavanahalli Cricket Nets reactivated with 2 zones!")
