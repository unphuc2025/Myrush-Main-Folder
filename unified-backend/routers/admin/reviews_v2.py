from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from database import get_db
import uuid
from datetime import datetime

router = APIRouter(
    prefix="/reviews",
    tags=["reviews"]
)

@router.get("", response_model=List[schemas.Review])
def get_all_reviews(db: Session = Depends(get_db)):
    # Use joinedload for User (valid relationship), but manual load for Court (disabled relationship)
    from sqlalchemy.orm import joinedload
    reviews = db.query(models.Review).options(
        joinedload(models.Review.user)
    ).all()
    
    # Manually fetch and attach courts to avoid ORM relationship issues
    if reviews:
        court_ids = {r.court_id for r in reviews if r.court_id}
        if court_ids:
            courts = db.query(models.Court).options(
                joinedload(models.Court.branch)
            ).filter(models.Court.id.in_(court_ids)).all()
            
            court_map = {c.id: c for c in courts}
            
            for r in reviews:
                # Attach court object dynamically
                if r.court_id in court_map:
                   r.court = court_map[r.court_id]
                   
    print(f"DEBUG_V2: Fetched {len(reviews)} reviews")
    return reviews


@router.put("/{review_id}/status")
def update_review_status(review_id: str, is_active: bool, db: Session = Depends(get_db)):
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    review.is_active = is_active
    db.commit()
    return {"message": "Review status updated"}
