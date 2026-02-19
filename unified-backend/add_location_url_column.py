import sys
import os
from sqlalchemy import text

# Add current directory to path so we can import 'database'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from database import engine
except ImportError:
    print("Error: Could not import 'database'. Make sure you are running this script from the 'unified-backend' directory.")
    sys.exit(1)

def add_columns():
    print(f"Connecting to database...")
    try:
        with engine.connect() as conn:
            print("Checking/Adding location_url column to admin_branches table...")
            
            # Add location_url
            try:
                # PostgreSQL 9.6+ supports IF NOT EXISTS on ADD COLUMN
                conn.execute(text("ALTER TABLE admin_branches ADD COLUMN IF NOT EXISTS location_url TEXT;"))
                print("✅ Added/Verified location_url")
            except Exception as e:
                print(f"⚠️ Error adding location_url: {e}")
            
            conn.commit()
            print("🎉 Database migration completed successfully.")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")

if __name__ == "__main__":
    add_columns()
