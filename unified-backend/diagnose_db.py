import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Add parent directory to path to import database and models
sys.path.append(os.getcwd())

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def diagnose():
    if not DATABASE_URL:
        print("DATABASE_URL not found in .env")
        return

    print(f"Connecting to database: {DATABASE_URL.split('@')[-1]}")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("\n--- Checking 'profiles' table schema ---")
        try:
            result = conn.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'profiles'
            """))
            columns = result.fetchall()
            if not columns:
                print("Table 'profiles' does not exist!")
            else:
                print("Columns in 'profiles' table:")
                for col in columns:
                    print(f"  - {col[0]} ({col[1]})")
        except Exception as e:
            print(f"Error checking profiles table: {e}")

        print("\n--- Checking 'booking' table schema ---")
        try:
            result = conn.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'booking'
            """))
            columns = result.fetchall()
            if not columns:
                print("Table 'booking' does not exist!")
            else:
                print("Columns in 'booking' table:")
                for col in columns:
                    print(f"  - {col[0]} ({col[1]})")
        except Exception as e:
            print(f"Error checking booking table: {e}")

if __name__ == "__main__":
    diagnose()
