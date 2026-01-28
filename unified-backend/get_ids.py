from database import SessionLocal
import models
try:
    db = SessionLocal()
    branch = db.query(models.Branch).first()
    if branch:
        print(f"Venue ID: {branch.id}")
    else:
        print("No branches found")
    
    game_type = db.query(models.GameType).first()
    if game_type:
        print(f"Sport ID: {game_type.id}")
    else:
        print("No game types found")
except Exception as e:
    print(f"Error: {e}")
