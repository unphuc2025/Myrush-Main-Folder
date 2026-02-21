import models
import database
from sqlalchemy import text

def migrate():
    engine = database.engine
    db = database.SessionLocal()
    try:
        print("Checking for latitude column...")
        with engine.connect() as conn:
            # Check if latitude exists
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='admin_branches' AND column_name='latitude'"))
            if not result.fetchone():
                print("Adding latitude column...")
                conn.execute(text("ALTER TABLE admin_branches ADD COLUMN latitude DECIMAL(10, 8)"))
                conn.commit()
            else:
                print("Latitude column already exists.")

            print("Checking for longitude column...")
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='admin_branches' AND column_name='longitude'"))
            if not result.fetchone():
                print("Adding longitude column...")
                conn.execute(text("ALTER TABLE admin_branches ADD COLUMN longitude DECIMAL(11, 8)"))
                conn.commit()
            else:
                print("Longitude column already exists.")
        
        print("Migration completed successfully.")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
