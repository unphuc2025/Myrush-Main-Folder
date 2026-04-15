from database import SessionLocal
import models

db = SessionLocal()

# The master court
MASTER_ID = "8494fa95-f072-4ce4-97cb-4106b86d15fe" # Current "Football"
# The redundant active court
REDUNDANT_ID = db.query(models.Court).filter(
    models.Court.branch_id == "5a28925c-c412-4115-8e9d-657fb44fc04a",
    models.Court.name.like("%Boxcricket%"),
    models.Court.is_active == True
).first().id

# 1. Rename Master to be inclusive
master = db.query(models.Court).get(MASTER_ID)
master.name = "Main Turf (Football / Box Cricket)"

# 2. Hide redundant fragment
redundant = db.query(models.Court).get(REDUNDANT_ID)
redundant.is_active = False

db.commit()
print(f"Cooke Town consolidated: Hidden '{redundant.name}', Renamed Master to '{master.name}'")
