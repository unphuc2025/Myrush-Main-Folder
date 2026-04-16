from database import SessionLocal
import models
import json

db = SessionLocal()

branches = db.query(models.Branch).all()
sports = db.query(models.GameType).all()

data = {
    "branches": [{"id": str(b.id), "name": b.name} for b in branches],
    "sports": [{"id": str(s.id), "name": s.name} for s in sports]
}

print(json.dumps(data, indent=2))
