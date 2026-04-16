from database import SessionLocal
import models

db = SessionLocal()
b = db.query(models.Branch).filter(models.Branch.name.like('%South United%')).first()
with open('south_united_output.txt', 'w', encoding='utf-8') as f:
    f.write(f"Branch: {b.name} ({b.id})\n")
    courts = db.query(models.Court).filter(models.Court.branch_id == b.id).all()
    if not courts:
        f.write("No courts found at all for this branch ID.\n")
    for c in courts:
        f.write(f"Court: {c.name} (Logic: {c.logic_type}, Zones: {c.total_zones}, Active: {c.is_active})\n")
        slices = db.query(models.SportSlice).filter(models.SportSlice.court_id == c.id).all()
        for s in slices:
            f.write(f"  Slice: {s.name} (Sport: {s.sport.name}), Mask: {s.mask}, Price: {s.price_per_hour}\n")
