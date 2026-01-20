from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from database import get_db
from dependencies import require_super_admin

router = APIRouter(
    prefix="/faq",
    tags=["FAQ"]
)

@router.get("", response_model=schemas.FAQListResponse)
@router.get("/", response_model=schemas.FAQListResponse)
def get_faqs(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    total = db.query(models.FAQ).count()
    items = db.query(models.FAQ).offset(skip).limit(limit).all()
    page = (skip // limit) + 1 if limit else 1
    pages = (total // limit) + (1 if total % limit else 0) if limit else 1
    return schemas.FAQListResponse(items=items, total=total, page=page, pages=pages)

@router.get("/{faq_id}", response_model=schemas.FAQResponse)
def get_faq(faq_id: str, db: Session = Depends(get_db)):
    faq = db.query(models.FAQ).filter(models.FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return faq

@router.post("/", response_model=schemas.FAQResponse, dependencies=[Depends(require_super_admin)])
def create_faq(faq: schemas.FAQCreate, db: Session = Depends(get_db)):
    db_faq = models.FAQ(question=faq.question, answer=faq.answer, is_active=faq.is_active)
    db.add(db_faq)
    db.commit()
    db.refresh(db_faq)
    return db_faq

@router.put("/{faq_id}", response_model=schemas.FAQResponse, dependencies=[Depends(require_super_admin)])
def update_faq(faq_id: str, faq: schemas.FAQUpdate, db: Session = Depends(get_db)):
    db_faq = db.query(models.FAQ).filter(models.FAQ.id == faq_id).first()
    if not db_faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    if faq.question is not None:
        db_faq.question = faq.question
    if faq.answer is not None:
        db_faq.answer = faq.answer
    if faq.is_active is not None:
        db_faq.is_active = faq.is_active
    db.commit()
    db.refresh(db_faq)
    return db_faq

@router.delete("/{faq_id}", dependencies=[Depends(require_super_admin)])
def delete_faq(faq_id: str, db: Session = Depends(get_db)):
    db_faq = db.query(models.FAQ).filter(models.FAQ.id == faq_id).first()
    if not db_faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    db.delete(db_faq)
    db.commit()
    return {"detail": "FAQ deleted"}
