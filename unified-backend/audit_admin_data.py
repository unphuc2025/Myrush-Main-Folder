from database import SessionLocal
from sqlalchemy import text
import json

db = SessionLocal()
try:
    with open('audit_output.txt', 'w', encoding='utf-8') as f:
        f.write("--- BRANCHES ---\n")
        branches = db.execute(text("SELECT id, name, opening_hours, is_active FROM admin_branches LIMIT 10")).fetchall()
        for b in branches:
            oh = b.opening_hours
            oh_str = json.dumps(oh) if isinstance(oh, (dict, list)) else str(oh)
            f.write(f"ID: {b.id} | Name: {b.name} | Active: {b.is_active}\n")
            f.write(f"  Opening Hours (Type: {type(oh)}): {oh_str}\n")
            f.write("-" * 20 + "\n")

        f.write("\n--- COURTS ---\n")
        courts = db.execute(text("SELECT id, name, branch_id, is_active FROM admin_courts LIMIT 10")).fetchall()
        for c in courts:
            f.write(f"ID: {c.id} | Name: {c.name} | Branch: {c.branch_id} | Active: {c.is_active}\n")
    print("Audit complete, check audit_output.txt")
finally:
    db.close()
