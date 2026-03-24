from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from database import get_db
from dependencies import PermissionChecker

router = APIRouter(
    prefix="/facilities",
    tags=["facilities"]
)

# Facility Types
@router.get("/types", response_model=List[schemas.FacilityType])
def get_facility_types(db: Session = Depends(get_db)):
    return db.query(models.FacilityType).all()

@router.post("/types", response_model=schemas.FacilityType)
def create_facility_type(data: schemas.FacilityTypeCreate, db: Session = Depends(get_db)):
    db_obj = models.FacilityType(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

# Shared Groups
@router.get("/shared-groups", response_model=List[schemas.SharedGroup])
def get_shared_groups(branch_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.SharedGroup)
    if branch_id:
        query = query.filter(models.SharedGroup.branch_id == branch_id)
    return query.all()

@router.post("/shared-groups", response_model=schemas.SharedGroup)
def create_shared_group(data: schemas.SharedGroupCreate, db: Session = Depends(get_db)):
    db_obj = models.SharedGroup(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

# Rental Items
@router.get("/rental-items", response_model=List[schemas.RentalItem])
def get_rental_items(db: Session = Depends(get_db)):
    return db.query(models.RentalItem).all()

@router.post("/rental-items", response_model=schemas.RentalItem)
def create_rental_item(data: schemas.RentalItemCreate, db: Session = Depends(get_db)):
    db_obj = models.RentalItem(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

# Units and Division Modes
@router.get("/{court_id}/units", response_model=List[schemas.CourtUnit])
def get_court_units(court_id: str, db: Session = Depends(get_db)):
    return db.query(models.CourtUnit).filter(models.CourtUnit.court_id == court_id).all()

@router.post("/{court_id}/units", response_model=schemas.CourtUnit)
def create_court_unit(court_id: str, data: schemas.CourtUnitCreate, db: Session = Depends(get_db)):
    db_obj = models.CourtUnit(**data.model_dump())
    db_obj.court_id = court_id
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/{court_id}/division-modes", response_model=List[schemas.DivisionMode])
def get_division_modes(court_id: str, db: Session = Depends(get_db)):
    return db.query(models.DivisionMode).filter(models.DivisionMode.court_id == court_id).all()

@router.post("/{court_id}/division-modes", response_model=schemas.DivisionMode)
def create_division_mode(court_id: str, data: schemas.DivisionModeCreate, db: Session = Depends(get_db)):
    db_obj = models.DivisionMode(court_id=court_id, name=data.name)
    db.add(db_obj)
    db.commit()
    
    # Associate units
    if data.unit_ids:
        units = db.query(models.CourtUnit).filter(models.CourtUnit.id.in_(data.unit_ids)).all()
        db_obj.units = units
        db.commit()
    
    db.refresh(db_obj)
    return db_obj
