from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from database import get_db
from dependencies import PermissionChecker
import uuid
from datetime import datetime

router = APIRouter(
    prefix="/api/reviews",
    tags=["reviews"]
)

@router.get("", response_model=List[schemas.Review], dependencies=[Depends(PermissionChecker("Manage Review And Ratings", "view"))])
def get_all_reviews(db: Session = Depends(get_db)):
    # Use joinedload to fetch related data in a single query
    from sqlalchemy.orm import joinedload
    reviews = db.query(models.Review).options(
        joinedload(models.Review.user),
        joinedload(models.Review.court).joinedload(models.Court.branch)
    ).all()
    return reviews


@router.put("/{review_id}/status", dependencies=[Depends(PermissionChecker("Manage Review And Ratings", "edit"))])
def update_review_status(review_id: str, is_active: bool, db: Session = Depends(get_db)):
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    review.is_active = is_active
    db.commit()
    return {"message": "Review status updated"}
