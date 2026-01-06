from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import schemas, crud, models, database
from dependencies import get_current_user

router = APIRouter(
    prefix="/reviews",
    tags=["reviews"],
)

@router.post("/", response_model=schemas.ReviewResponse)
def create_review(
    review: schemas.ReviewCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    try:
        print("===========================================")
        print(f"[REVIEWS API] 🔥 RECEIVED CREATE REVIEW REQUEST")
        print(f"[REVIEWS API] User: {current_user.id}")
        print(f"[REVIEWS API] Review data: booking_id={review.booking_id}, court_id={review.court_id}, rating={review.rating}")
        print("===========================================")

        result = crud.create_review(db=db, review=review, user_id=current_user.id)

        print(f"[REVIEWS API] ✅ REVIEW CREATED SUCCESSFULLY: ID={result.id}")
        return result

    except ValueError as e:
        print("===========================================")
        print(f"[REVIEWS API] ❌ VALIDATION ERROR: {e}")
        print("===========================================")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print("===========================================")
        print(f"[REVIEWS API] ❌ CRITICAL ERROR CREATING REVIEW")
        print(f"[REVIEWS API] Error: {e}")
        import traceback
        traceback.print_exc()
        print("===========================================")
        raise HTTPException(status_code=500, detail="Failed to create review")

@router.get("/user")
def get_user_reviews(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    return crud.get_user_reviews(db=db, user_id=current_user.id)

@router.get("/unreviewed-completed-bookings")
def get_unreviewed_completed_bookings(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    return crud.get_unreviewed_completed_bookings(db=db, user_id=current_user.id)

@router.get("/court/{court_id}", response_model=list[schemas.ReviewResponse])
def get_reviews_for_court(
    court_id: str,
    db: Session = Depends(database.get_db)
):
    return crud.get_reviews_for_court(db=db, court_id=court_id)

@router.get("/booking/{booking_id}/exists")
def check_if_booking_reviewed(
    booking_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    review = crud.has_user_reviewed_booking(db=db, user_id=current_user.id, booking_id=booking_id)
    if review:
        return {
            "has_reviewed": True,
            "review": {
                "id": review.id,
                "rating": review.rating,
                "review_text": review.review_text,
                "created_at": review.created_at
            }
        }
    return {"has_reviewed": False}
