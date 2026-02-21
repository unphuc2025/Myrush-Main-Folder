from database import SessionLocal
from sqlalchemy import text
import json
import datetime

db = SessionLocal()
try:
    branch_id = 'a55d225c-3818-4a8d-82b5-605033040353'
    row = db.execute(text(f"SELECT opening_hours FROM admin_branches WHERE id = '{branch_id}'")).first()
    oh = row.opening_hours if row else {}
    
    today = datetime.datetime.now().strftime("%A").lower()
    day_conf = oh.get(today)
    
    print(f"Today is {today}")
    print(f"Branch Opening Hours for {today}: {day_conf}")
    print(f"isActive type: {type(day_conf.get('isActive')) if day_conf else 'N/A'}")
    print(f"isActive value: {day_conf.get('isActive') if day_conf else 'N/A'}")

finally:
    db.close()
