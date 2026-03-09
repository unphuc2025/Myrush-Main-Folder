from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from database import get_db

router = APIRouter(
    prefix="/cms",
    tags=["User CMS Pages"]
)

@router.get("", response_model=schemas.CMSPageListResponse)
@router.get("/", response_model=schemas.CMSPageListResponse)
def get_public_cms_pages(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(models.CMSPage).filter(models.CMSPage.is_active == True)
    total = query.count()
    items = query.order_by(models.CMSPage.created_at.desc()).offset(skip).limit(limit).all()
    
    page = (skip // limit) + 1 if limit else 1
    pages = (total // limit) + (1 if total % limit else 0) if limit else 1
    
    return schemas.CMSPageListResponse(items=items, total=total, page=page, pages=pages)

@router.get("/{slug}", response_model=schemas.CMSPageResponse)
def get_public_cms_page(slug: str, db: Session = Depends(get_db)):
    page = db.query(models.CMSPage).filter(models.CMSPage.slug == slug, models.CMSPage.is_active == True).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page
