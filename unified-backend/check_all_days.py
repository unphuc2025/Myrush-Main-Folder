from database import SessionLocal
from sqlalchemy import text
import json

db = SessionLocal()
try:
    days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    branches = db.execute(text("SELECT name, opening_hours FROM admin_branches WHERE is_active = true")).fetchall()
    
    print("Branch Activity Summary (isActive Count per Day):")
    counts = {d: 0 for d in days}
    for b in branches:
        oh = b.opening_hours
        if oh and isinstance(oh, dict):
            for d in days:
                if oh.get(d, {}).get('isActive'):
                    counts[d] += 1
    
    for d in days:
        print(f"{d.capitalize()}: {counts[d]} / {len(branches)} branches active")

finally:
    db.close()
