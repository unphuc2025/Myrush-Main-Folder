from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Annotated, List
import schemas, crud, models, database
from dependencies import get_current_user

router = APIRouter(
    prefix="/bookings",
    tags=["bookings"],
)

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
        print(f"[BOOKINGS API] Booking data: court_id={booking.court_id}, date={booking.booking_date}, price_per_hour={booking.price_per_hour}, players={booking.number_of_players}")
        print("===========================================")

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
