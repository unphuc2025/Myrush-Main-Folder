from database import SessionLocal
import models
import json

db = SessionLocal()

courts = db.query(models.Court).all()
data = []

for c in courts:
    branch = db.query(models.Branch).filter(models.Branch.id == c.branch_id).first()
    game_type = db.query(models.GameType).filter(models.GameType.id == c.game_type_id).first()
    
    data.append({
        "court_id": str(c.id),
        "court_name": c.name,
        "branch_name": branch.name if branch else "Unknown",
        "game_type_name": game_type.name if game_type else "Unknown",
        "current_total_zones": c.total_zones,
        "current_logic_type": c.logic_type
    })

print(json.dumps(data, indent=2))
