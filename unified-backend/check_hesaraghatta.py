from database import SessionLocal
import models
import json

db = SessionLocal()
b = db.query(models.Branch).filter(models.Branch.name.ilike('%Hesaraghatta%')).first()
print(f"Branch: {b.name} ({b.id})\n")

mon = b.opening_hours.get('monday', {}) if b.opening_hours else {}
print(f"Timing: {mon.get('open')} - {mon.get('close')}")

courts = db.query(models.Court).filter(models.Court.branch_id == b.id, models.Court.is_active == True).all()
for c in courts:
    print(f"Court: {c.name} (Logic: {c.logic_type}, Zones: {c.total_zones}, Price: {c.price_per_hour})")
    slices = db.query(models.SportSlice).filter(models.SportSlice.court_id == c.id).all()
    for s in slices:
        print(f"  Slice: {s.name} (Sport: {s.sport.name}), Price: {s.price_per_hour}")

if not courts:
    print("NO ACTIVE COURTS FOUND!")
