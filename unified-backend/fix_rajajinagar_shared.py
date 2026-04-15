from database import SessionLocal
import models

db = SessionLocal()

GROUP_ID = "a03958dc-6354-4172-ac05-ff2f6b2c3e8d" # Rajajinagar Main Turf
FOOTBALL_ID = "cdd873c0-331a-4ccd-ae9e-6d4e63200718"
BOXCRICKET_ID = "ba4e32d6-4171-460d-9b4f-69c2e8e0fdbd"

# 1. Update Football
fb = db.query(models.Court).filter(models.Court.id == FOOTBALL_ID).first()
if fb:
    fb.logic_type = "shared"
    fb.shared_group_id = GROUP_ID
    fb.price_per_hour = 2000
    fb.total_zones = 1
    # Remove SportSlices if any (Divisible logic residue)
    db.query(models.SportSlice).filter(models.SportSlice.court_id == fb.id).delete()

# 2. Update Box Cricket
bc = db.query(models.Court).filter(models.Court.id == BOXCRICKET_ID).first()
if bc:
    bc.logic_type = "shared"
    bc.shared_group_id = GROUP_ID
    bc.price_per_hour = 2000
    bc.total_zones = 1
    bc.is_active = True

db.commit()
print("Rajajinagar Shared Group setup completed successfully!")
