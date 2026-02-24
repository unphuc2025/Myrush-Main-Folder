import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import decimal
from datetime import date

# Add parent directory to path
sys.path.append(os.getcwd())

import models
import schemas
import crud
from database import get_db

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def test_booking_creation():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # 1. Get a test user and court
        user = db.query(models.User).first()
        court = db.query(models.Court).first()
        
        if not user or not court:
            print("No user or court found in DB to test with.")
            return

        print(f"Testing with User ID: {user.id}, Court ID: {court.id}")
        print(f"Court Name: {court.name}")
        print(f"Price Conditions: {court.price_conditions}")
        print(f"Unavailability: {court.unavailability_slots}")
        print(f"Base Price: {court.price_per_hour}")
        
        from datetime import date, timedelta

        ten_days_later = date.today() + timedelta(days=10)
        
        from routers.user.courts import get_available_slots
        slots_data = get_available_slots(str(court.id), ten_days_later.strftime("%Y-%m-%d"), db)
        print(f"DEBUG slots_data type: {type(slots_data)}")
        if isinstance(slots_data, list) and len(slots_data) > 0:
             print(f"DEBUG first slot: {slots_data[0]}")
        
        print(f"Available slots for {ten_days_later}:")
        for s in slots_data:
            if not s['is_booked']:
                print(f"  {s['start_time']} - {s['end_time']}: {s['price']}")
        
        valid_start = slots_data[0]['start_time']
        valid_price = float(slots_data[0]['price'])
        valid_end = slots_data[0]['end_time']
        
        print(f"\nChoosing slot: {valid_start} at price {valid_price}")

        booking_in = schemas.BookingCreate(
            user_id=str(user.id),
            court_id=str(court.id),
            booking_date=ten_days_later,
            start_time=valid_start,
            duration_minutes=60,
            number_of_players=2,
            time_slots=[{"time": valid_start, "start_time": valid_start, "end_time": valid_end, "price": valid_price}],
            total_amount=valid_price * 2, # 2 players
            original_amount=valid_price * 2,
            discount_amount=0.0,
            coupon_code=None,
            razorpay_payment_id="pay_test_123",
            razorpay_order_id="order_test_456",
            razorpay_signature="sig_test_789"
        )

        print("\nCalling crud.create_booking...")
        result = crud.create_booking(db, booking_in, str(user.id))
        print(f"SUCCESS! Booking created with ID: {result.id}")
        
        # Rollback so we don't actually create a junk booking
        db.rollback()
        print("Test completed and changes rolled back.")

    except Exception as e:
        print("\nFAILED with error:")
        print(e)
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_booking_creation()
