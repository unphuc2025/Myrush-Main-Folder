from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database

router = APIRouter(
    prefix="/faq",
    tags=["FAQ"]
)

@router.get("/", response_model=schemas.FAQListResponse)
def get_faqs(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    """Fetch active FAQs for users"""
    query = db.query(models.FAQ).filter(models.FAQ.is_active == True)
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    
    # Simple pagination logic
    pages = (total // limit) + (1 if total % limit else 0) if limit else 1
    page = (skip // limit) + 1 if limit else 1
    
    return schemas.FAQListResponse(
        items=items,
        total=total,
        page=page,
        pages=pages
    )
