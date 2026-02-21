import models
import database
from sqlalchemy import text

def create_favorites_table():
    engine = database.engine
    try:
        print("Checking for user_favorite_courts table...")
        with engine.connect() as conn:
            result = conn.execute(text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_favorite_courts')"))
            exists = result.scalar()
            if not exists:
                print("Creating user_favorite_courts table...")
                models.Base.metadata.create_all(bind=engine, tables=[models.UserFavoriteCourt.__table__])
                conn.commit()
                print("Table created successfully.")
            else:
                print("Table user_favorite_courts already exists.")
    except Exception as e:
        print(f"Error checking/creating table: {e}")

if __name__ == "__main__":
    create_favorites_table()
