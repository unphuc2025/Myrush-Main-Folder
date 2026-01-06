from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.get("", response_model=List[schemas.User])
@router.get("/", response_model=List[schemas.User])
def get_users(db: Session = Depends(get_db)):
    """Get all users for admin selection"""
    users = db.query(models.User).all()
    return users
