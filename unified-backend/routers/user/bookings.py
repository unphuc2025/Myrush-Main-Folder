from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Annotated, List
import schemas, crud, models, database
from dependencies import get_current_user

import os
import razorpay

router = APIRouter(
    prefix="/bookings",
    tags=["bookings"],
)

# Initialize Razorpay Client
client = razorpay.Client(auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET")))

@router.post("/", response_model=schemas.BookingResponse)
def create_booking(
    booking: schemas.BookingCreate,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(database.get_db)
):
    try:
        print("===========================================")
        print(f"[BOOKINGS API] RECEIVED CREATE BOOKING REQUEST")
        print(f"[BOOKINGS API] User: {current_user.id}")
        
        # Verify Payment if Razorpay details are present
        if booking.razorpay_payment_id:
            try:
                print(f"[BOOKINGS API] Verifying Razorpay Payment: {booking.razorpay_payment_id}")
                client.utility.verify_payment_signature({
                    'razorpay_order_id': booking.razorpay_order_id,
                    'razorpay_payment_id': booking.razorpay_payment_id,
                    'razorpay_signature': booking.razorpay_signature
                })
                print("[BOOKINGS API] Payment Signature Verified")
                
                # --- FRAUD CHECK: AMOUNT MATCH ---
                fetch_order = client.order.fetch(booking.razorpay_order_id)
                # Calculate what the frontend is asking us to confirm
                total_from_frontend = float(booking.original_amount or 0) - float(booking.discount_amount or 0)
                expected_paise = int(total_from_frontend * 100)
                
                if fetch_order['amount'] != expected_paise:
                     print(f"[FRAUD ALERT] Amount mismatch! Razorpay Order was for {fetch_order['amount']} but booking payload claims {expected_paise}")
                     raise HTTPException(status_code=400, detail="Amount mismatch. Payment verification failed due to security policies.")
                # ---------------------------------
                
                booking.payment_status = "paid" # Mark as paid
                
            except razorpay.errors.SignatureVerificationError:
                print("[BOOKINGS API] Payment Signature Verification Failed")
                raise HTTPException(status_code=400, detail="Payment verification failed")
            except Exception as e:
                print(f"[BOOKINGS API] Payment Verification Error: {e}")
                raise HTTPException(status_code=400, detail="Payment verification error")
        else:
             print("[BOOKINGS API] No payment ID provided - assuming legacy/pay-at-venue flow")
             # Use default pending status
             
        # --- NEW: CHECK FOR EXISTING PENDING BOOKING ---
        existing_booking = None
        if booking.razorpay_order_id:
            existing_booking = db.query(models.Booking).filter(
                models.Booking.razorpay_order_id == booking.razorpay_order_id,
                models.Booking.user_id == current_user.id
            ).first()
            
        if existing_booking:
            print(f"[BOOKINGS API] Found existing PENDING booking {existing_booking.id}. Updating to PAID.")
            # Update the existing record
            existing_booking.payment_status = booking.payment_status or "paid"
            existing_booking.payment_id = booking.razorpay_payment_id
            existing_booking.razorpay_signature = booking.razorpay_signature
            existing_booking.status = "confirmed"
            existing_booking.updated_at = database.datetime.utcnow()
            
            db.commit()
            db.refresh(existing_booking)
            result = existing_booking
        else:
            # Fallback for flows where order wasn't pre-persisted
            print("[BOOKINGS API] No existing pending booking found. Creating new record.")
            result = crud.create_booking(db=db, booking=booking, user_id=current_user.id)
        # -----------------------------------------------
        
        print("[BOOKINGS API] BOOKING PROCESSED SUCCESSFULLY")
        return result

    except HTTPException as he:
        # Re-raise HTTPExceptions as-is to preserve status code and detail
        raise he
    except Exception as e:
        print("===========================================")
        print("[BOOKINGS API] CRITICAL ERROR CREATING BOOKING")
        import traceback
        traceback.print_exc()
        print("===========================================")

        raise HTTPException(
            status_code=400,
            detail="Booking creation failed due to server error."
        )

@router.get("/", response_model=List[schemas.BookingResponse])
def get_bookings(
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(database.get_db),
):
    return crud.get_bookings(db=db, user_id=current_user.id)

@router.put("/{booking_id}/cancel", response_model=schemas.BookingResponse)
def cancel_booking(
    booking_id: str,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(database.get_db),
):
    return crud.cancel_booking(db=db, booking_id=booking_id, user_id=current_user.id)
