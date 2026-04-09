import sys
import traceback
from datetime import date
from database import SessionLocal
import models
import schemas
import crud
from routers.user import payments
from utils import booking_utils

def run_simulation():
    db = SessionLocal()
    with open("sim_multi_order.txt", "w", encoding="utf-8") as f:
        try:
            # Setup
            user = db.query(models.User).filter(models.User.email == "test@example.com").first()
            if not user:
                user = db.query(models.User).first()
                
            court_id = "84df147f-18bd-409c-a5a5-d08f61acf51f" # BoxCricket Cooke Town
            branch_id = "5a28925c-c412-4115-8e9d-657fb44fc04a" # Cooke Town Branch
            booking_date = date.today()
            time_slots = [{"time": "10:00"}, {"time": "10:30"}]
            slot_ids = []
            
            # Fetch a real slot_id just in case
            from datetime import time
            slots = db.query(models.Slot).filter(models.Slot.court_id == court_id, models.Slot.slot_date == booking_date, models.Slot.start_time.in_([time(10, 0), time(10, 30)])).all()
            if slots:
                slot_ids = [str(s.id) for s in slots]
                
            configs = [
                {"courtId": court_id, "sliceMask": 1, "branchId": branch_id}, # Turf 1 (Mask 1)
                {"courtId": court_id, "sliceMask": 12, "branchId": branch_id} # Turf 3+4 (Mask 12)
            ]
            
            f.write("Simulating pending booking persistence block...\n")
            
            # The total order would be Turf 1 (1000) + Turf 8 (2000) = 3000
            total_order_price = 3000 
            discount_amount = 0
            number_of_players = 1
            coupon_code = None
            
            start_time_val = "10:00"
            duration_mins = 60

            # This is roughly what payments.py does now:
            for cfg in configs:
                c_id = str(cfg.get("courtId", ""))
                s_mask = cfg.get("sliceMask", 0)
                
                # Fetch authoritative price
                court_total = 0.0
                court_specific_slots = []
                allowed_slots = booking_utils.generate_allowed_slots_map(db, c_id, booking_date)
                for slot in time_slots:
                    t_str = slot.get("time")
                    if t_str in allowed_slots:
                        s_info = allowed_slots[t_str]
                        slot_price = booking_utils.calculate_multi_slice_price(s_info, s_mask, float(s_info['price']))
                        slot_with_correct_price = {**slot, "price": slot_price}
                        court_specific_slots.append(slot_with_correct_price)
                        court_total += slot_price
                
                f.write(f"Calculated price for mask {s_mask}: {court_total}\n")

                booking_create = schemas.BookingCreate(
                    branch_id=str(cfg.get("branchId", "")),
                    court_id=c_id,
                    booking_date=booking_date,
                    start_time=start_time_val,
                    duration_minutes=duration_mins,
                    time_slots=court_specific_slots, # PASSING CORRECTED PRICES
                    slot_ids=slot_ids,
                    slice_mask=s_mask,
                    number_of_players=number_of_players,
                    payment_status="pending",
                    razorpay_order_id="fake_order_12345",
                    total_amount=court_total 
                )
                
                f.write(f"Attempting crud.create_booking for mask {s_mask} with total {court_total}...\n")
                try:
                    db_booking = crud.create_booking(db=db, booking=booking_create, user_id=str(user.id))
                    f.write(f"SUCCESS: Pending Multi-booking created: {db_booking.id}\n")
                    
                    # SIMULATE CONFIRMATION (RE-ENTRY)
                    f.write(f"SIMULATING CONFIRMATION for order {booking_create.razorpay_order_id}, mask {s_mask}...\n")
                    # In real confirmed flow, payment_status is 'paid'
                    booking_create.payment_status = "paid"
                    confirmed_booking = crud.create_booking(db=db, booking=booking_create, user_id=str(user.id))
                    f.write(f"SUCCESS: Confirmed Multi-booking re-entry: {confirmed_booking.id}\n")

                except Exception as inner_e:
                    f.write(f"FAILED inside loop:\n{traceback.format_exc()}\n")

        except Exception as e:
            f.write(f"Outer Error:\n{traceback.format_exc()}\n")
        finally:
            db.rollback()
            db.close()

if __name__ == "__main__":
    run_simulation()
