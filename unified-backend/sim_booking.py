import requests
from datetime import datetime
import json

base_url = "http://localhost:8000/api/user"

# Let's try to simulate the multi order checkout and then the booking confirmation
# Wait, we need auth token. 
# We can bypass auth or we can just run the internal python code locally in the backend to capture the exact exception trace.

import sys
sys.path.append(".")
from database import SessionLocal
import models
from utils import booking_utils
from datetime import date, time
import crud
import schemas

def run_simulation():
    db = SessionLocal()
    # Find any user
    user = db.query(models.User).filter(models.User.email == "test@example.com").first()
    if not user:
        user = db.query(models.User).first()
        
    try:
        booking_date = date.today()
        # "BoxCricket" at Cooke Town
        court = db.query(models.Court).filter(models.Court.id == "84df147f-18bd-409c-a5a5-d08f61acf51f").first()
        if not court:
            print("Court not found")
            return

        # Simulate Booking 1: Turf 2 (mask 2)
        print("Creating Turf 2 booking...")
        b1 = schemas.BookingCreate(
            court_id=str(court.id),
            booking_date=booking_date,
            time_slots=[{"time": "10:00", "price": 500}],
            slice_mask=2,
            number_of_players=1,
            razorpay_order_id="test_order_123"
        )
        # Assuming we need to mock slot_ids to pass atomic check
        # Let's find a valid slot
        slots = db.query(models.Slot).filter(models.Slot.court_id == court.id, models.Slot.slot_date == booking_date, models.Slot.start_time == time(10, 0)).all()
        if slots:
            b1.slot_ids = [str(slots[0].id)]
            print(f"Using slot {slots[0].id} for Turf 2")
            
        try:
            res1 = crud.create_booking(db, b1, str(user.id))
            print(f"Success! Booking 1 ID: {res1.id}")
        except Exception as e:
            print(f"Failed Turf 2: {e}")
            import traceback
            traceback.print_exc()

        # Simulate Booking 2: Turf 3+4 (mask 12)
        print("Creating Turf 3+4 booking...")
        b2 = schemas.BookingCreate(
            court_id=str(court.id),
            booking_date=booking_date,
            time_slots=[{"time": "10:00", "price": 1000}],
            slice_mask=12,
            number_of_players=1,
            razorpay_order_id="test_order_123"
        )
        if slots:
            b2.slot_ids = [str(slots[0].id)]
            print(f"Using slot {slots[0].id} for Turf 3+4")
            
        try:
            res2 = crud.create_booking(db, b2, str(user.id))
            print(f"Success! Booking 2 ID: {res2.id}")
        except Exception as e:
            print(f"Failed Turf 3+4: {e}")
            import traceback
            traceback.print_exc()

    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        # Rollback so we don't pollute the db
        db.rollback()
        db.close()

if __name__ == "__main__":
    run_simulation()
