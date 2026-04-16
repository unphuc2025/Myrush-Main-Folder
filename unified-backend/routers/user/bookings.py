from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Annotated, List
import schemas, crud, models, database
from dependencies import get_current_user
from utils.notification_helpers import notify_booking_event
from datetime import datetime

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
    background_tasks: BackgroundTasks,
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
                
                # Robustly get notes, handling cases where it might be explicit null
                notes = fetch_order.get('notes') or {}
                num_courts = int(notes.get('num_courts', 1))

                # Calculate what the frontend is asking us to confirm for THIS specific booking component
                total_from_frontend = float(booking.original_amount or 0) - float(booking.discount_amount or 0)
                expected_paise = int(total_from_frontend * 100)
                
                # If it's a multi-court order, the total Razorpay amount will be the sum of all courts.
                # Only strictly validate amount exactly if it's a single court order.
                if num_courts == 1 and fetch_order['amount'] != expected_paise:
                     print(f"[FRAUD ALERT] Amount mismatch! Razorpay Order was for {fetch_order['amount']} but single booking payload claims {expected_paise}")
                     raise HTTPException(status_code=400, detail="Amount mismatch. Payment verification failed due to security policies.")
                # ---------------------------------
                
                booking.payment_status = "paid" # Mark as paid
                
            except razorpay.errors.SignatureVerificationError:
                print("[BOOKINGS API] Payment Signature Verification Failed")
                background_tasks.add_task(
                    notify_booking_event, 
                    event_type="payment_failed", 
                    booking_id=booking.razorpay_order_id, # Fallback ID
                    user_id=str(current_user.id)
                )
                
                raise HTTPException(status_code=400, detail="Payment verification failed")
            except HTTPException as hexp:
                raise hexp
            except Exception as e:
                print(f"[BOOKINGS API] Payment Verification Error: {e}")
                background_tasks.add_task(
                    notify_booking_event, 
                    event_type="payment_error", 
                    booking_id=booking.razorpay_order_id, 
                    user_id=str(current_user.id)
                )
                
                raise HTTPException(status_code=400, detail=f"Payment verification error: {str(e)}")
        else:
             print("[BOOKINGS API] No payment ID provided - assuming legacy/pay-at-venue flow")
             # Use default pending status
             
        # --- NEW: CHECK FOR EXISTING PENDING BOOKING ---
        existing_booking = None
        if booking.razorpay_order_id:
            existing_booking = db.query(models.Booking).filter(
                models.Booking.razorpay_order_id == booking.razorpay_order_id,
                models.Booking.user_id == current_user.id,
                models.Booking.court_id == booking.court_id
            ).first()
            
        if existing_booking:
            print(f"[BOOKINGS API] Found existing PENDING booking {existing_booking.id}. Updating to PAID.")
            # Update the existing record
            existing_booking.payment_status = booking.payment_status or "paid"
            existing_booking.payment_id = booking.razorpay_payment_id
            existing_booking.razorpay_signature = booking.razorpay_signature
            existing_booking.status = "confirmed"
            existing_booking.updated_at = datetime.utcnow()

            # --- SYNC AMOUNTS ON CONFIRMATION ---
            if booking.coupon_code:
                existing_booking.coupon_code = booking.coupon_code
            if booking.discount_amount is not None:
                existing_booking.discount_amount = booking.discount_amount
            if booking.total_amount:
                 existing_booking.total_amount = booking.total_amount
            if booking.original_amount:
                 existing_booking.original_amount = booking.original_amount
            
            db.commit()
            db.refresh(existing_booking)

            background_tasks.add_task(
                notify_booking_event,
                event_type="booking_confirmed",
                booking_id=str(existing_booking.id),
                user_id=str(existing_booking.user_id)
            )

            result = existing_booking
        else:
            # Fallback for flows where order wasn't pre-persisted
            result = crud.create_booking(db=db, booking=booking, user_id=current_user.id)
            background_tasks.add_task(
                notify_booking_event,
                event_type="booking_confirmed",
                booking_id=str(result.id),
                user_id=str(result.user_id)
            )
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
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db),
):
    result = crud.cancel_booking(db=db, booking_id=booking_id, user_id=current_user.id)
    background_tasks.add_task(
        notify_booking_event,
        event_type="booking_cancelled",
        booking_id=str(result.id),
        user_id=str(result.user_id)
    )
    return result
