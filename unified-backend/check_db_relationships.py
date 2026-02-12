from database import SessionLocal
from models import Branch, GameType

def check_db_relationships():
    db = SessionLocal()
    try:
        branches = db.query(Branch).all()
        print(f"Found {len(branches)} branches.")
        for b in branches:
            print(f"Branch: {b.name} (ID: {b.id})")
            print(f"  Game Types: {[gt.name for gt in b.game_types]}")
    finally:
        db.close()

if __name__ == "__main__":
    check_db_relationships()
