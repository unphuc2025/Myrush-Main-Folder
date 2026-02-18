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
        print(f"[BOOKINGS API] 🔥 RECEIVED CREATE BOOKING REQUEST")
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
                print("[BOOKINGS API] ✅ Payment Signature Verified")
                booking.payment_status = "paid" # Mark as paid
                
                # Optional: Fetch order from Razorpay to verify amount match?
                # For now, signature verification confirms payment for THAT order ID.
                # Use server-side validation during order creation to ensure amount was correct.
                
            except razorpay.errors.SignatureVerificationError:
                print("[BOOKINGS API] ❌ Payment Signature Verification Failed")
                raise HTTPException(status_code=400, detail="Payment verification failed")
            except Exception as e:
                print(f"[BOOKINGS API] ❌ Payment Verification Error: {e}")
                raise HTTPException(status_code=400, detail="Payment verification error")
        else:
             print("[BOOKINGS API] ⚠️ No payment ID provided - assuming legacy/pay-at-venue flow")
             # Use default pending status
             
        result = crud.create_booking(db=db, booking=booking, user_id=current_user.id)
        
        print(f"[BOOKINGS API] ✅ BOOKING CREATED SUCCESSFULLY: ID={result.id}, Total=₹{result.total_amount}")
        return result

    except Exception as e:
        print("===========================================")
        print(f"[BOOKINGS API] ❌ CRITICAL ERROR CREATING BOOKING")
        print(f"[BOOKINGS API] Error: {e}")
        print(f"[BOOKINGS API] Booking details: {booking.dict()}")
        print(f"[BOOKINGS API] Current user: {current_user.id}")
        import traceback
        traceback.print_exc()
        print("===========================================")

        # Return specific error response instead of generic 500
        from fastapi import HTTPException
        raise HTTPException(
            status_code=400,
            detail=f"Booking creation failed: {str(e)}"
        )

@router.get("/", response_model=List[schemas.BookingResponse])
def get_bookings(
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(database.get_db),
):
    return crud.get_bookings(db=db, user_id=current_user.id)
