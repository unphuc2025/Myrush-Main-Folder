import os
import sys
import uuid
from dotenv import load_dotenv

# Ensure we're in the right directory
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from database import SessionLocal
import models

load_dotenv()
db = SessionLocal()

branch = db.query(models.Branch).first()
if not branch:
    print("No branch found. Exiting.")
    sys.exit(1)

game_type = db.query(models.GameType).first()
if not game_type:
    print("No game type found. Exiting.")
    sys.exit(1)

try:
    new_court = models.Court(
        id=uuid.uuid4(),
        name="Dummy Divisible Court",
        branch_id=branch.id,
        game_type_id=game_type.id,
        price_per_hour=1000.0,
        is_active=True,
        logic_type="divisible",
        total_zones=4
    )
    db.add(new_court)
    db.commit()
    db.refresh(new_court)
    
    for i in range(4):
        zone = models.CourtZone(
            id=uuid.uuid4(),
            court_id=new_court.id,
            zone_index=i,
            zone_name=f"Zone {i+1}"
        )
        db.add(zone)
    
    slices_data = [
        {"name": "6-a-side (Turf A)", "mask": 1},
        {"name": "6-a-side (Turf B)", "mask": 2},
        {"name": "6-a-side (Turf C)", "mask": 4},
        {"name": "6-a-side (Turf D)", "mask": 8},
        {"name": "8-a-side (First Half)", "mask": 3},
        {"name": "8-a-side (Second Half)", "mask": 12},
        {"name": "10-a-side (Full Ground)", "mask": 15}
    ]
    
    for s in slices_data:
        sp_slice = models.SportSlice(
            id=uuid.uuid4(),
            court_id=new_court.id,
            sport_id=game_type.id,
            name=s["name"],
            mask=s["mask"]
        )
        db.add(sp_slice)
        
    db.commit()
    print("Successfully created Dummy Divisible Court!")
    
except Exception as e:
    db.rollback()
    print(f"Error creating dummy court: {e}")
finally:
    db.close()
