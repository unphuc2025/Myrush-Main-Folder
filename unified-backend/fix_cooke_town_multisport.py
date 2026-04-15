from database import SessionLocal
import models

db = SessionLocal()

COOKE_TOWN_COURT_ID = "8494fa95-f072-4ce4-97cb-4106b86d15fe" # Football Master
FOOTBALL_SPORT_ID = "91eca5ba-7d72-4db3-93bb-0b14f1c7b15e"
BOXCRICKET_SPORT_ID = "55b67f44-205a-4f9f-9490-a4ab1e717fed"

# Define the slices to add for Boxcricket
box_slices = [
    {"name": "Boxcricket (Turf 1)", "mask": 1, "price": 2000},
    {"name": "Boxcricket (Turf 2)", "mask": 2, "price": 2000},
    {"name": "Boxcricket (Turf 3)", "mask": 4, "price": 2000},
    {"name": "Boxcricket (Turf 4)", "mask": 8, "price": 2000},
    {"name": "Boxcricket (Double - 1+2)", "mask": 3, "price": 3500},
    {"name": "Boxcricket (Double - 3+4)", "mask": 12, "price": 3500},
    {"name": "Boxcricket (Full Ground)", "mask": 15, "price": 6000}
]

# Add them
for bsl in box_slices:
    # Check if already exists to avoid duplicates
    exists = db.query(models.SportSlice).filter(
        models.SportSlice.court_id == COOKE_TOWN_COURT_ID,
        models.SportSlice.sport_id == BOXCRICKET_SPORT_ID,
        models.SportSlice.mask == bsl["mask"]
    ).first()
    
    if not exists:
        db.add(models.SportSlice(
            court_id=COOKE_TOWN_COURT_ID,
            sport_id=BOXCRICKET_SPORT_ID,
            name=bsl["name"],
            mask=bsl["mask"],
            price_per_hour=bsl["price"]
        ))

db.commit()
print("Cooke Town updated with Boxcricket slices!")
