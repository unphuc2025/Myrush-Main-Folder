from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text, and_, or_
from typing import Annotated, List, Dict, Any
import razorpay
import os
import hmac
import hashlib
import json
from datetime import datetime, time, date

from database import get_db
from dependencies import get_current_user
import models
import schemas
import crud
from utils.coupon_utils import validate_coupon_strictly

router = APIRouter(
    prefix="/payments",
    tags=["payments"],
)

# Initialize Razorpay Client
# Ensure these are set in your .env file
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

def verify_slot_availability(db: Session, court_id: str, booking_date: date, requested_slots: List[Dict[str, Any]]):
    """
    Check if any of the requested slots are already booked OR blocked by admin.
    """
    if not requested_slots:
        return
        
    # 1. Fetch Court Config (Opening Hours & Unavailability)
    court_query = text("""
        SELECT price_conditions, unavailability_slots, branch_id
        FROM admin_courts WHERE id = :court_id AND is_active = true
    """)
    court_res = db.execute(court_query, {"court_id": court_id}).first()
    if not court_res:
        raise HTTPException(status_code=404, detail="Court not found")
        
    def safe_json(val):
        if isinstance(val, str):
            try: return json.loads(val)
            except: return []
        return val or []

    un_slots = safe_json(court_res._mapping.get('unavailability_slots'))
    
    # Check Admin Blocking (Unavailability)
    day_short = booking_date.strftime("%a").lower()
    date_str = str(booking_date)
    
    disabled_hours = set()
    for un in un_slots:
        if isinstance(un, dict):
            match = False
            if date_str in (un.get('dates') or []): match = True
            if day_short in [d.lower()[:3] for d in (un.get('days') or [])]: match = True
            if match:
                for t in (un.get('times') or []):
                    try: disabled_hours.add(int(t.split(':')[0]))
                    except: pass

    # 2. Get existing bookings
    bookings = db.query(models.Booking).filter(
        models.Booking.court_id == court_id,
        models.Booking.booking_date == booking_date,
        models.Booking.status != 'cancelled'
    ).all()
    
    booked_times = set()
    for b in bookings:
        if b.time_slots and isinstance(b.time_slots, list):
            for slot in b.time_slots:
                if isinstance(slot, dict):
                    t_str = slot.get('time') or slot.get('start_time')
                    if t_str: booked_times.add(int(t_str.split(':')[0]))

    # 3. Validate requested slots
    for slot in requested_slots:
        time_str = slot.get('time') or slot.get('start_time')
        if not time_str: continue
        try:
            h = int(time_str.split(':')[0])
            if h in disabled_hours:
                raise HTTPException(status_code=400, detail=f"Slot {time_str} has been blocked by Admin.")
            if h in booked_times:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Slot {time_str} is already booked.")
        except ValueError: pass

def calculate_authoritative_price(db: Session, court_id: str, booking_date: date, requested_slots: List[Dict[str, Any]], number_of_players: int) -> float:
    """
    Calculate the total price based on DB configuration.
    Logic: Sum(Slot Prices) * Number of Players
    """
    # 1. Fetch Court Pricing Config
    court = db.query(models.Court).filter(models.Court.id == court_id).first()
    if not court:
        raise HTTPException(status_code=404, detail="Court not found")
        
    price_per_hour = float(court.price_per_hour)
    timing_config = court.price_conditions or []
    
    # 2. Determine price for each requested slot
    total_slot_price = 0.0
    
    day_of_week = booking_date.strftime("%A").lower()[:3] # mon, tue
    date_str = booking_date.strftime("%Y-%m-%d")

    for slot in requested_slots:
        slot_time_str = slot.get('time') or slot.get('start_time') # "07:00"
        try:
            slot_hour = int(slot_time_str.split(':')[0])
        except:
             raise HTTPException(status_code=400, detail=f"Invalid slot time format: {slot_time_str}")

        # Default price
        current_slot_price = price_per_hour
        
        # Check specific pricing rules (Date specific > Day specific)
        rule_found = False
        
        # Priority 1: Date specific
        if isinstance(timing_config, list):
             for config in timing_config:
                if 'dates' in config and date_str in config['dates']:
                    start_h = int(config.get('slotFrom', '00:00').split(':')[0])
                    end_h = int(config.get('slotTo', '23:00').split(':')[0])
                    if start_h <= slot_hour < end_h:
                         current_slot_price = float(config.get('price', price_per_hour))
                         rule_found = True
                         break
        
        # Priority 2: Day specific
        if not rule_found and isinstance(timing_config, list):
            for config in timing_config:
                if 'days' in config and isinstance(config['days'], list):
                    days = [d.lower()[:3] for d in config['days']]
                    if day_of_week in days:
                        start_h = int(config.get('slotFrom', '00:00').split(':')[0])
                        end_h = int(config.get('slotTo', '23:00').split(':')[0])
                        if start_h <= slot_hour < end_h:
                             current_slot_price = float(config.get('price', price_per_hour))
                             rule_found = True
                             break
        
        total_slot_price += current_slot_price

    # 3. Multiply by Players
    # Logic from frontend: (Total Slots Price) * Players
    # Validate player count
    if number_of_players < 1:
        number_of_players = 1
        
    final_base_price = total_slot_price * number_of_players
    return final_base_price

def validate_authoritative_coupon(db: Session, coupon_code: str, total_amount: float, user_id: str) -> float:
    """
    Validate coupon and return discount amount.
    """
    if not coupon_code:
        return 0.0
        
    result = validate_coupon_strictly(db, coupon_code, total_amount, user_id)
    
    if not result["valid"]:
        raise HTTPException(status_code=400, detail=result["message"])
        
    return result["discount_amount"]

@router.post("/create-order")
def create_payment_order(
    booking_details: schemas.BookingCreate,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Create a Razorpay order with strict server-side validation.
    """
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
         raise HTTPException(status_code=500, detail="Payment gateway not configured")

    # 1. Availability Check
    verify_slot_availability(db, booking_details.court_id, booking_details.booking_date, booking_details.time_slots)
    
    # 2. Price Calculation
    server_base_price = calculate_authoritative_price(
        db, 
        booking_details.court_id, 
        booking_details.booking_date, 
        booking_details.time_slots, 
        booking_details.number_of_players
    )
    
    # Platform Fee (Hardcoded for now matching frontend)
    PLATFORM_FEE = 20.0 
    
    # 3. Coupon Validation
    discount_amount = 0.0
    if booking_details.coupon_code:
        discount_amount = validate_authoritative_coupon(
            db, 
            booking_details.coupon_code, 
            server_base_price,
            str(current_user.id)
        )
        
    # 4. Final Total
    final_amount = (server_base_price + PLATFORM_FEE) - discount_amount
    final_amount = max(0, final_amount) # Never negative
    
    # GST Logic (Optional - assuming inclusive for now, but if we wanted to add it:)
    # gst_amount = final_amount * 0.18
    # final_amount += gst_amount
    
    # 5. Create Razorpay Order
    amount_in_paise = int(final_amount * 100)
    
    try:
        order_data = {
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": f"rcpt_{int(datetime.now().timestamp())}",
            "notes": {
                "user_id": str(current_user.id),
                "court_id": booking_details.court_id,
                "date": str(booking_details.booking_date)
            }
        }
        order = client.order.create(data=order_data)
        
        return {
            "id": order['id'],
            "amount": order['amount'],
            "currency": order['currency'],
            "key_id": RAZORPAY_KEY_ID, # Send key to frontend
            "server_calculated_amount": final_amount,
            "breakdown": {
                "base": server_base_price,
                "fee": PLATFORM_FEE,
                "discount": discount_amount
            }
        }
        
    except Exception as e:
        print(f"Razorpay Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create payment order")

@router.post("/verify")
def verify_payment(
    payment_data: dict,
    db: Session = Depends(get_db)
):
    """
    Verify Razorpay signature
    """
    try:
        order_id = payment_data.get('razorpay_order_id')
        payment_id = payment_data.get('razorpay_payment_id')
        signature = payment_data.get('razorpay_signature')
        
        if not all([order_id, payment_id, signature]):
             raise HTTPException(status_code=400, detail="Missing payment details")
             
        # Verify Signature
        client.utility.verify_payment_signature({
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        })
        
        return {"status": "success", "message": "Payment verified successfully"}
        
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Payment signature verification failed")
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# PAYMENT METHOD MANAGEMENT
# ============================================================================

@router.get("/methods", response_model=List[schemas.PaymentMethodResponse])
def get_user_payment_methods(
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """List all saved payment methods for the current user"""
    return crud.get_payment_methods(db, str(current_user.id))

@router.post("/methods", response_model=schemas.PaymentMethodResponse)
def add_user_payment_method(
    payment_method: schemas.PaymentMethodCreate,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Save a new payment method"""
    return crud.create_payment_method(db, payment_method, str(current_user.id))

@router.delete("/methods/{method_id}")
def delete_user_payment_method(
    method_id: str,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Delete a saved payment method"""
    success = crud.delete_payment_method(db, method_id, str(current_user.id))
    if not success:
        raise HTTPException(status_code=404, detail="Payment method not found or access denied")
    return {"status": "success", "message": "Payment method deleted"}

@router.post("/methods/{method_id}/default", response_model=schemas.PaymentMethodResponse)
def set_default_user_payment_method(
    method_id: str,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Set a payment method as default"""
    updated = crud.set_default_payment_method(db, method_id, str(current_user.id))
    if not updated:
        raise HTTPException(status_code=404, detail="Payment method not found")
    return updated
