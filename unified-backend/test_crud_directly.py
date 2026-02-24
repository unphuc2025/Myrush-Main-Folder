
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os
from datetime import date, timedelta
import uuid

# Add current directory to path
sys.path.append(os.getcwd())

from database import SQLALCHEMY_DATABASE_URL
import models
import schemas
import crud

def test_direct_booking():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    # 1. Get a test user and court
    user = db.query(models.User).first()
    court = db.query(models.Court).first()
    
    if not user or not court:
        print("Missing user or court in DB")
        return

    print(f"Testing with User: {user.id}, Court: {court.id}")
    
    # 2. Prepare BookingCreate schema
    booking_date = (date.today() + timedelta(days=1))
    
    booking_data = schemas.BookingCreate(
        court_id=str(court.id),
        booking_date=booking_date,
        time_slots=[
            {"start_time": "10:00", "price": 200, "display_time": "10:00 AM - 11:00 AM"}
        ],
        number_of_players=2,
        original_amount=400.0,
        discount_amount=0.0,
        payment_status="pending"
    )
    
    # 3. Call create_booking
    try:
        print("\n--- CALLING create_booking ---")
        result = crud.create_booking(db, booking_data, str(user.id))
        print(f"\nSUCCESS! Booking ID: {result.id}")
    except Exception as e:
        print(f"\nFAILED with exception: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_direct_booking()
