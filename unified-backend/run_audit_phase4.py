from database import SessionLocal
import models
import uuid
import json

db = SessionLocal()
branches = {
    "Railways": "bbdec863-c298-481a-a29b-b889207cf65d",
    "Malleshwaram": "06abcc0b-97ba-43ae-ab01-746f5b7fe527",
    "BCU": "cfc0df1c-07c9-486f-960e-6b15bb9e3bf5"
}

results = {}

for name, bid in branches.items():
    b = db.query(models.Branch).get(bid)
    if not b: continue
    
    results[name] = {
        "id": bid,
        "name": b.name,
        "hours": b.opening_hours,
        "courts": []
    }
    
    courts = db.query(models.Court).filter(models.Court.branch_id == bid).all()
    for c in courts:
        court_data = {
            "id": str(c.id),
            "name": c.name,
            "logic": c.logic_type,
            "active": c.is_active,
            "game_type": c.game_type.name if c.game_type else "None",
            "slices": []
        }
        slices = db.query(models.SportSlice).filter(models.SportSlice.court_id == c.id).all()
        for s in slices:
            court_data["slices"].append({
                "name": s.name,
                "sport": s.sport.name,
                "price": float(s.price_per_hour) if s.price_per_hour else 0
            })
        results[name]["courts"].append(court_data)

with open('phase4_audit.json', 'w') as f:
    json.dump(results, f, indent=2)

print("Audit complete! Saved to phase4_audit.json")
