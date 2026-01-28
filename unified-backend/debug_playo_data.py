
import database
import models
from sqlalchemy.orm import Session

def check_data():
    db: Session = next(database.get_db())
    print("--- Checking Venues (Branches) ---")
    venues = db.query(models.Branch).all()
    if not venues:
        print("No venues found in the database.")
    else:
        for venue in venues:
            print(f"Venue ID: {venue.id}, Name: {venue.name}")

    print("\n--- Checking Courts ---")
    courts = db.query(models.Court).all()
    if not courts:
        print("No courts found in the database.")
    else:
        for court in courts:
            print(f"Court ID: {court.id}, Name: {court.name}, Branch ID: {court.branch_id}")

    print("\n--- Checking Game Types ---")
    game_types = db.query(models.GameType).all()
    if not game_types:
        print("No game types found in the database.")
    else:
        for game_type in game_types:
            print(f"Game Type ID: {game_type.id}, Name: {game_type.name}")


if __name__ == "__main__":
    check_data()
