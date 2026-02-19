from fastapi import APIRouter, Depends, HTTPException
from dependencies import PermissionChecker
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db
import uuid

router = APIRouter(
    prefix="/cities",
    tags=["cities"]
)

@router.get("", response_model=List[schemas.City], dependencies=[Depends(PermissionChecker(["City Management", "Reports and analytics", "Transactions And Earnings", "Manage Bookings"], "view"))])
@router.get("/", response_model=List[schemas.City], dependencies=[Depends(PermissionChecker(["City Management", "Reports and analytics", "Transactions And Earnings", "Manage Bookings"], "view"))])
def get_all_cities(db: Session = Depends(get_db)):
    """Get all cities"""
    cities = db.query(models.City).all()
    return cities

@router.get("/{city_id}", response_model=schemas.City, dependencies=[Depends(PermissionChecker("City Management", "view"))])
def get_city(city_id: str, db: Session = Depends(get_db)):
    """Get a specific city by ID"""
    city = db.query(models.City).filter(models.City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    return city

@router.post("", response_model=schemas.City, dependencies=[Depends(PermissionChecker("City Management", "add"))])
@router.post("/", response_model=schemas.City, dependencies=[Depends(PermissionChecker("City Management", "add"))])
def create_city(city: schemas.CityCreate, db: Session = Depends(get_db)):
    """Create a new city"""
    # Check if city with same name already exists
    existing = db.query(models.City).filter(models.City.name == city.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="City with this name already exists")

    db_city = models.City(**city.model_dump())
    db.add(db_city)
    db.commit()
    db.refresh(db_city)
    return db_city

@router.put("/{city_id}", response_model=schemas.City, dependencies=[Depends(PermissionChecker("City Management", "edit"))])
def update_city(city_id: str, city: schemas.CityCreate, db: Session = Depends(get_db)):
    """Update a city"""
    db_city = db.query(models.City).filter(models.City.id == city_id).first()
    if not db_city:
        raise HTTPException(status_code=404, detail="City not found")

    for key, value in city.model_dump().items():
        setattr(db_city, key, value)

    db.commit()
    db.refresh(db_city)
    return db_city

@router.patch("/{city_id}/toggle", response_model=schemas.City, dependencies=[Depends(PermissionChecker("City Management", "edit"))])
def toggle_city_status(city_id: str, db: Session = Depends(get_db)):
    """Toggle city active status"""
    db_city = db.query(models.City).filter(models.City.id == city_id).first()
    if not db_city:
        raise HTTPException(status_code=404, detail="City not found")
    
    db_city.is_active = not db_city.is_active
    db.commit()
    db.refresh(db_city)
    return db_city

@router.delete("/{city_id}", dependencies=[Depends(PermissionChecker("City Management", "delete"))])
def delete_city(city_id: str, db: Session = Depends(get_db)):
    """Delete a city"""
    db_city = db.query(models.City).filter(models.City.id == city_id).first()
    if not db_city:
        raise HTTPException(status_code=404, detail="City not found")
    
    db.delete(db_city)
    db.commit()
    return {"message": "City deleted successfully"}
