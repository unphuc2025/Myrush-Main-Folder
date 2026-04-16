import psycopg2
import os
from dotenv import load_dotenv

# Load env from unified-backend
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in .env")
        return

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Check if column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='admin_court_blocks' AND column_name='blocked_capacity';
        """)
        exists = cursor.fetchone()
        
        if not exists:
            print("Adding blocked_capacity column to admin_court_blocks...")
            cursor.execute("ALTER TABLE admin_court_blocks ADD COLUMN blocked_capacity INTEGER")
            conn.commit()
            print("Successfully added blocked_capacity column.")
        else:
            print("Column blocked_capacity already exists.")
            
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    migrate()
