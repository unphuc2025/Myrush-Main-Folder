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
    Check if any of the requested slots are already booked.
    """
    if not requested_slots:
        return
        
    # Get all bookings for this court and date
    bookings = db.query(models.Booking).filter(
        models.Booking.court_id == court_id,
        models.Booking.booking_date == booking_date,
        models.Booking.status != 'cancelled'
    ).all()
    
    booked_times = set()
    for booking in bookings:
        if booking.time_slots and isinstance(booking.time_slots, list):
            for slot in booking.time_slots:
                if isinstance(slot, dict) and 'time' in slot:
                    booked_times.add(slot['time']) # Format HH:MM
                elif isinstance(slot, dict) and 'start_time' in slot:
                     booked_times.add(slot['start_time'])

    for slot in requested_slots:
        start_time = slot.get('time') or slot.get('start_time')
        if start_time in booked_times:
             raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Slot {start_time} is already booked."
            )

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

def validate_authoritative_coupon(db: Session, coupon_code: str, total_amount: float) -> float:
    """
    Validate coupon and return discount amount.
    """
    if not coupon_code:
        return 0.0
        
    coupon = db.query(models.Coupon).filter(
        models.Coupon.code == coupon_code,
        models.Coupon.is_active == True,
        models.Coupon.start_date <= datetime.utcnow(),
        models.Coupon.end_date >= datetime.utcnow()
    ).first()
    
    if not coupon:
        # Invalid coupon - you might verify if we throw error or just ignore. 
        # For security, throw error to verify intent.
        raise HTTPException(status_code=400, detail="Invalid or expired coupon code")
        
    if coupon.min_order_value and total_amount < float(coupon.min_order_value):
         raise HTTPException(status_code=400, detail=f"Order value must be at least {coupon.min_order_value}")
         
    discount = 0.0
    if coupon.discount_type == 'percentage':
        discount = (total_amount * float(coupon.discount_value)) / 100
        if coupon.max_discount:
            discount = min(discount, float(coupon.max_discount))
    else:
        discount = float(coupon.discount_value)
        
    return discount

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
        discount_amount = validate_authoritative_coupon(db, booking_details.coupon_code, server_base_price)
        
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
