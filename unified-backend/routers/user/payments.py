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

from utils.booking_utils import get_booked_hours, safe_parse_hour

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
    Check if any of the requested slots are already booked OR blocked by admin OR outside venue hours.
    """
    if not requested_slots:
        return
        
    from utils.booking_utils import generate_allowed_slots_map, safe_parse_hour, get_booked_hours

    # 1. Generate Authoritative Allowed Slots (Venue Hours + Pricing + Admin Blocks)
    allowed_slots_map = generate_allowed_slots_map(db, court_id, booking_date)
    
    if not allowed_slots_map:
        raise HTTPException(status_code=400, detail="The venue is closed or not configured for this date.")

    # 2. Fetch Active Bookings to find occupied slots
    active_bookings = db.query(models.Booking).filter(
        models.Booking.court_id == court_id,
        models.Booking.booking_date == booking_date,
        models.Booking.status != 'cancelled'
    ).all()
    
    booked_times = get_booked_hours(active_bookings)

    # 3. Validate requested slots
    for slot in requested_slots:
        time_str = slot.get('start_time') or slot.get('time')
        if not time_str: continue
        
        h = safe_parse_hour(time_str)
        norm_start = f"{h:02d}:00"
        
        if norm_start not in allowed_slots_map:
            raise HTTPException(status_code=400, detail=f"Slot {time_str} is not in the venue's operating hours.")
        
        server_slot = allowed_slots_map[norm_start]
        if server_slot['is_blocked']:
            raise HTTPException(status_code=400, detail=f"Slot {time_str} has been blocked by Admin.")
            
        if h in booked_times:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Slot {time_str} is already booked.")

def calculate_authoritative_price(db: Session, court_id: str, booking_date: date, requested_slots: List[Dict[str, Any]], number_of_players: int) -> float:
    """
    Calculate the total price based on unified slot generation engine.
    Logic: Sum(Slot Prices) * Number of Players
    """
    from utils.booking_utils import generate_allowed_slots_map, safe_parse_hour

    # 1. Generate Slots Map to get correct prices
    allowed_slots_map = generate_allowed_slots_map(db, court_id, booking_date)
    
    total_slot_price = 0.0
    for slot in requested_slots:
        slot_time_str = slot.get('time') or slot.get('start_time')
        if not slot_time_str: continue
        
        h = safe_parse_hour(slot_time_str)
        norm_start = f"{h:02d}:00"
        
        # Use price from map if available, else default (though validation should have caught it)
        if norm_start in allowed_slots_map:
            total_slot_price += float(allowed_slots_map[norm_start]['price'])
        else:
            print(f"[PAYMENTS ERROR] Slot {norm_start} not found in allowed map during price calc.")
            # Fallback to court base price if absolutely necessary
            court = db.query(models.Court).filter(models.Court.id == court_id).first()
            if court:
                total_slot_price += float(court.price_per_hour)

    # 2. Multiply by Players
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
    print(f"[PAYMENTS DEBUG] Creating order for user {current_user.id}, court {booking_details.court_id}, date {booking_details.booking_date}")
    print(f"[PAYMENTS DEBUG] Provided slots: {booking_details.time_slots}")
    try:
        verify_slot_availability(db, booking_details.court_id, booking_details.booking_date, booking_details.time_slots)
    except HTTPException as e:
        print(f"[PAYMENTS DEBUG] Availability check failed: {e.detail}")
        raise e
    except Exception as e:
        print(f"[PAYMENTS DEBUG] Unexpected availability error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Availability error: {str(e)}")
    
    # 2. Price Calculation
    try:
        server_base_price = calculate_authoritative_price(
            db, 
            booking_details.court_id, 
            booking_details.booking_date, 
            booking_details.time_slots, 
            booking_details.number_of_players or 2
        )
        print(f"[PAYMENTS DEBUG] Calculated Base Price: {server_base_price}")
    except Exception as e:
        print(f"[PAYMENTS DEBUG] Price calculation failed: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Price calculation failed: {str(e)}")
    
    # Platform Fee (Hardcoded for now matching frontend)
    PLATFORM_FEE = 0.0 
    
    # 3. Coupon Validation
    discount_amount = 0.0
    if booking_details.coupon_code:
        print(f"[PAYMENTS DEBUG] Validating coupon: {booking_details.coupon_code}")
        try:
            discount_amount = validate_authoritative_coupon(
                db, 
                booking_details.coupon_code, 
                server_base_price,
                str(current_user.id)
            )
        except HTTPException as e:
            print(f"[PAYMENTS DEBUG] Coupon validation failed: {e.detail}")
            raise e
        except Exception as e:
            print(f"[PAYMENTS DEBUG] Unexpected coupon error: {e}")
            raise HTTPException(status_code=400, detail=f"Coupon error: {str(e)}")
        
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
