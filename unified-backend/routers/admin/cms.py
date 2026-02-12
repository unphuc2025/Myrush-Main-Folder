from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from database import get_db
from dependencies import require_super_admin, PermissionChecker

router = APIRouter(
    prefix="/cms",
    tags=["CMS Pages"]
)

@router.get("/", response_model=schemas.CMSPageListResponse, dependencies=[Depends(PermissionChecker("CMS Pages", "view"))])
def get_cms_pages(
    skip: int = 0, 
    limit: int = 20, 
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.CMSPage)
    
    if search:
        query = query.filter(models.CMSPage.title.ilike(f"%{search}%"))
    
    total = query.count()
    items = query.order_by(models.CMSPage.created_at.desc()).offset(skip).limit(limit).all()
    
    page = (skip // limit) + 1 if limit else 1
    pages = (total // limit) + (1 if total % limit else 0) if limit else 1
    
    return schemas.CMSPageListResponse(items=items, total=total, page=page, pages=pages)

@router.get("/{slug}", response_model=schemas.CMSPageResponse, dependencies=[Depends(PermissionChecker("CMS Pages", "view"))])
def get_cms_page(slug: str, db: Session = Depends(get_db)):
    page = db.query(models.CMSPage).filter(models.CMSPage.slug == slug).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@router.post("/", response_model=schemas.CMSPageResponse, dependencies=[Depends(PermissionChecker("CMS Pages", "add"))])
def create_cms_page(page: schemas.CMSPageCreate, db: Session = Depends(get_db)):
    # Check if slug exists
    if db.query(models.CMSPage).filter(models.CMSPage.slug == page.slug).first():
        raise HTTPException(status_code=400, detail="Slug already exists")
    
    db_page = models.CMSPage(
        title=page.title,
        slug=page.slug,
        content=page.content,
        is_active=page.is_active
    )
    db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page

@router.put("/{page_id}", response_model=schemas.CMSPageResponse, dependencies=[Depends(require_super_admin)])
def update_cms_page(page_id: str, page_update: schemas.CMSPageUpdate, db: Session = Depends(get_db)):
    db_page = db.query(models.CMSPage).filter(models.CMSPage.id == page_id).first()
    if not db_page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    if page_update.title is not None:
        db_page.title = page_update.title
    if page_update.slug is not None:
        # Check uniqueness if slug changes
        if page_update.slug != db_page.slug:
            if db.query(models.CMSPage).filter(models.CMSPage.slug == page_update.slug).first():
                raise HTTPException(status_code=400, detail="Slug already exists")
        db_page.slug = page_update.slug
    if page_update.content is not None:
        db_page.content = page_update.content
    if page_update.is_active is not None:
        db_page.is_active = page_update.is_active
        
    db.commit()
    db.refresh(db_page)
    return db_page

@router.delete("/{page_id}", dependencies=[Depends(require_super_admin)])
def delete_cms_page(page_id: str, db: Session = Depends(get_db)):
    db_page = db.query(models.CMSPage).filter(models.CMSPage.id == page_id).first()
    if not db_page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    db.delete(db_page)
    db.commit()
    return {"detail": "Page deleted"}
