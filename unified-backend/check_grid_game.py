from database import SessionLocal
import models

db = SessionLocal()
b = db.query(models.Branch).filter(models.Branch.name.ilike('%Grid Game%')).first()
with open('grid_game_output.txt', 'w', encoding='utf-8') as f:
    f.write(f"Branch: {b.name} ({b.id})\n")
    courts = db.query(models.Court).filter(models.Court.branch_id == b.id).all()
    for c in courts:
        f.write(f"Court: {c.name} (Logic: {c.logic_type}, Active: {c.is_active})\n")
        slices = db.query(models.SportSlice).filter(models.SportSlice.court_id == c.id).all()
        for s in slices:
            f.write(f"  Slice: {s.name} (Sport: {s.sport.name}), Price: {s.price_per_hour}\n")
