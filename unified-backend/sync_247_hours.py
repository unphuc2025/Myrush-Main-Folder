from database import SessionLocal
import models
import json

db = SessionLocal()

# Load sheet data to find 24/7 branches
with open('sheet_data.json', 'r', encoding='utf-8') as f:
    sheet_data = json.load(f)

# 24/7 JSON format
full_hours = {
    day: {"open": "00:00", "close": "23:59", "isActive": True}
    for day in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
}

for row in sheet_data:
    branch_name_raw = row[1]
    timings_str = row[6]
    
    if "24/7" in str(timings_str):
        # Find the branch in DB
        branch = db.query(models.Branch).filter(models.Branch.name.ilike(f"%{branch_name_raw.strip()}%")).first()
        if branch:
            print(f"Setting 24/7 hours for {branch.name}...")
            branch.opening_hours = full_hours
        else:
            # Try a fuzzy match if name differs slightly
            cleaned_name = branch_name_raw.split('-')[0].strip()
            branch = db.query(models.Branch).filter(models.Branch.name.ilike(f"%{cleaned_name}%")).first()
            if branch:
                print(f"Setting 24/7 hours for {branch.name} (fuzzy match)...")
                branch.opening_hours = full_hours

db.commit()
print("24/7 hours synchronization completed!")
