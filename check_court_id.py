import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'unified-backend'))
from database import SessionLocal
from sqlalchemy import text

def check_court():
    db = SessionLocal()
    court_id = 'a4844143-7552-48a3-bf62-c8f87a5f21a3'
    try:
        print(f"Checking for court ID: {court_id}")
        query = text("SELECT id, name FROM admin_courts WHERE id = :court_id")
        result = db.execute(query, {"court_id": court_id}).fetchone()
        
        if result:
            print(f"✅ Court found: {result[0]} - {result[1]}")
        else:
            print(f"❌ Court NOT found: {court_id}")
            
            print("\nAvailable courts:")
            validation_query = text("SELECT id, name FROM admin_courts LIMIT 5")
            courts = db.execute(validation_query).fetchall()
            for c in courts:
                print(f" - {c[0]}: {c[1]}")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_court()
