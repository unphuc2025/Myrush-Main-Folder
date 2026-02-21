from database import SessionLocal
from sqlalchemy import text
import json

db = SessionLocal()
try:
    branch_id = 'a55d225c-3818-4a8d-82b5-605033040353'
    res = db.execute(text(f"SELECT id, name, is_active, opening_hours FROM admin_branches WHERE id = '{branch_id}'")).first()
    if res:
        print(f"Branch: {res.name} | ID: {res.id}")
        print(f"Active: {res.is_active}")
        print(f"Opening Hours Type: {type(res.opening_hours)}")
        print(f"Opening Hours: {json.dumps(res.opening_hours)}")
        
        courts = db.execute(text(f"SELECT id, name, is_active FROM admin_courts WHERE branch_id = '{branch_id}'")).fetchall()
        print("\nCourts:")
        for c in courts:
            print(f"  - {c.name} | ID: {c.id} | Active: {c.is_active}")
    else:
        print("Branch not found")
finally:
    db.close()
