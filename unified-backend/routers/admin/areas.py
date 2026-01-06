from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db
import uuid

router = APIRouter(
    prefix="/areas",
    tags=["areas"]
)

@router.get("", response_model=List[schemas.Area])
@router.get("/", response_model=List[schemas.Area])
def get_all_areas(city_id: str = None, db: Session = Depends(get_db)):
    """Get all areas, optionally filtered by city_id"""
    query = db.query(models.Area)
    if city_id:
        query = query.filter(models.Area.city_id == city_id)
    return query.all()

@router.get("/{area_id}", response_model=schemas.Area)
def get_area(area_id: str, db: Session = Depends(get_db)):
    """Get a specific area by ID"""
    area = db.query(models.Area).filter(models.Area.id == area_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    return area

@router.post("", response_model=schemas.Area)
@router.post("/", response_model=schemas.Area)
def create_area(area: schemas.AreaCreate, db: Session = Depends(get_db)):
    """Create a new area"""
    db_area = models.Area(**area.model_dump())
    db.add(db_area)
    db.commit()
    db.refresh(db_area)
    return db_area

@router.put("/{area_id}", response_model=schemas.Area)
def update_area(area_id: str, area: schemas.AreaCreate, db: Session = Depends(get_db)):
    """Update an area"""
    db_area = db.query(models.Area).filter(models.Area.id == area_id).first()
    if not db_area:
        raise HTTPException(status_code=404, detail="Area not found")

    for key, value in area.model_dump().items():
        setattr(db_area, key, value)

    db.commit()
    db.refresh(db_area)
    return db_area

@router.patch("/{area_id}/toggle", response_model=schemas.Area)
def toggle_area_status(area_id: str, db: Session = Depends(get_db)):
    """Toggle area active status"""
    db_area = db.query(models.Area).filter(models.Area.id == area_id).first()
    if not db_area:
        raise HTTPException(status_code=404, detail="Area not found")
    
    db_area.is_active = not db_area.is_active
    db.commit()
    db.refresh(db_area)
    return db_area

@router.delete("/{area_id}")
def delete_area(area_id: str, db: Session = Depends(get_db)):
    """Delete an area"""
    db_area = db.query(models.Area).filter(models.Area.id == area_id).first()
    if not db_area:
        raise HTTPException(status_code=404, detail="Area not found")
    
    db.delete(db_area)
    db.commit()
    return {"message": "Area deleted successfully"}
