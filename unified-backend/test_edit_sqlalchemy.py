import sys
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import requests

db = SessionLocal()

admin = db.query(models.Admin).first()
print(f"Admin: {admin.id if admin else None}")

amenity = db.query(models.Amenity).first()
print(f"Amenity: {amenity.id if amenity else None}")

game = db.query(models.GameType).first()
print(f"GameType: {game.id if game else None}")

if admin and amenity:
    headers = {"Authorization": f"Bearer admin-token-{admin.id}"}
    print(f"Using headers: {headers}")
    
    res = requests.put(
        f"http://localhost:8000/api/admin/amenities/{amenity.id}", 
        data={"name": amenity.name + " Test"},
        headers=headers
    )
    print("Amenity PUT:", res.status_code, res.text)
    
    if game:
        res2 = requests.put(
            f"http://localhost:8000/api/admin/game-types/{game.id}",
            data={"name": game.name + " Test", "short_code": game.short_code},
            headers=headers
        )
        print("GameType PUT:", res2.status_code, res2.text)
