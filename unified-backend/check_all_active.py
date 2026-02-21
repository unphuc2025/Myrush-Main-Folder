from database import SessionLocal
from sqlalchemy import text
import json
import datetime

db = SessionLocal()
try:
    today = datetime.datetime.now().strftime("%A").lower()
    branches = db.execute(text("SELECT id, name, opening_hours FROM admin_branches WHERE is_active = true")).fetchall()
    
    active_count = 0
    print(f"Checking for {today}...")
    for b in branches:
        oh = b.opening_hours
        if oh and isinstance(oh, dict):
            day_config = oh.get(today, {})
            if day_config.get('isActive'):
                print(f"ID: {b.id} | Name: {b.name} is ACTIVE")
                active_count += 1
            else:
                pass
    
    print(f"\nTotal branches active for {today}: {active_count}")

finally:
    db.close()
