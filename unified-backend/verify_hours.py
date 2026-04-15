from database import SessionLocal
import models

db = SessionLocal()
def check_hours(branch_keyword):
    b = db.query(models.Branch).filter(models.Branch.name.like(f"%{branch_keyword}%")).first()
    if b and b.opening_hours:
        mon = b.opening_hours.get('monday', {})
        print(f"{b.name}: {mon.get('open')} - {mon.get('close')} (Active: {mon.get('isActive')})")
    else:
        print(f"{branch_keyword}: No hours found.")

check_hours("South United")
check_hours("Cooke Town")
