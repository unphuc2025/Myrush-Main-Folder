import sys
import os
import traceback
from database import SessionLocal
import models
from utils import booking_utils
from datetime import date, time
import crud
import schemas

def run_simulation():
    db = SessionLocal()
    with open("sim_error.txt", "w", encoding="utf-8") as f:
        # Find any user
        user = db.query(models.User).filter(models.User.email == "test@example.com").first()
        if not user:
            user = db.query(models.User).first()
            
        try:
            booking_date = date.today()
            court = db.query(models.Court).filter(models.Court.id == "84df147f-18bd-409c-a5a5-d08f61acf51f").first()
            if not court:
                f.write("Court not found\n")
                return

            f.write("Creating Turf 2 booking...\n")
            try:
                b1 = schemas.BookingCreate(
                    court_id=str(court.id),
                    booking_date=booking_date,
                    time_slots=[{"time": "10:00", "price": 500}],
                    slice_mask=2,
                    number_of_players=1,
                    razorpay_order_id="test_order_123"
                )
                
                slots = db.query(models.Slot).filter(models.Slot.court_id == court.id, models.Slot.slot_date == booking_date, models.Slot.start_time == time(10, 0)).all()
                if slots:
                    b1.slot_ids = [str(slots[0].id)]
                    f.write(f"Using slot {slots[0].id} for Turf 2\n")
                
                res1 = crud.create_booking(db, b1, str(user.id))
                f.write(f"Success! Booking 1 ID: {res1.id}\n")
            except Exception as e:
                f.write(f"Failed Turf 2:\n{traceback.format_exc()}\n")

        except Exception as e:
            f.write(f"Outer Error:\n{traceback.format_exc()}\n")
        finally:
            db.rollback()
            db.close()

if __name__ == "__main__":
    run_simulation()
