from database import SessionLocal
import models

db = SessionLocal()
b = db.query(models.Branch).filter(models.Branch.name.like('%Rajajinagar%')).first()
print(f"Branch: {b.name} ({b.id})")
courts = db.query(models.Court).filter(models.Court.branch_id == b.id).all()
for c in courts:
    print(f"Court: {c.name} (Logic: {c.logic_type}, Active: {c.is_active})")
    slices = db.query(models.SportSlice).filter(models.SportSlice.court_id == c.id).all()
    for s in slices:
        print(f"  Slice: {s.name}, Price: {s.price_per_hour}")
