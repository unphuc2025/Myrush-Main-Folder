from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from database import get_db
import uuid
import os
import shutil
from pathlib import Path

router = APIRouter(
    prefix="/game-types",
    tags=["game-types"]
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads/game_types")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.get("", response_model=List[schemas.GameType])
@router.get("/", response_model=List[schemas.GameType])
def get_all_game_types(db: Session = Depends(get_db)):
    """Get all game types"""
    return db.query(models.GameType).all()

@router.get("/{game_type_id}", response_model=schemas.GameType)
def get_game_type(game_type_id: str, db: Session = Depends(get_db)):
    """Get a specific game type by ID"""
    game_type = db.query(models.GameType).filter(models.GameType.id == game_type_id).first()
    if not game_type:
        raise HTTPException(status_code=404, detail="Game type not found")
    return game_type

@router.post("", response_model=schemas.GameType)
@router.post("/", response_model=schemas.GameType)
async def create_game_type(
    name: str = Form(...),
    short_code: str = Form(...),
    description: Optional[str] = Form(None),
    is_active: bool = Form(True),
    icon: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Create a new game type"""
    existing = db.query(models.GameType).filter(models.GameType.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Game type with this name already exists")

    # Handle file upload
    icon_url = None
    if icon:
        # Generate unique filename
        file_extension = os.path.splitext(icon.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename

        # Save file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(icon.file, buffer)

        icon_url = f"/uploads/game_types/{unique_filename}"

    db_game_type = models.GameType(
        name=name,
        short_code=short_code,
        description=description,
        icon_url=icon_url,
        is_active=is_active
    )
    db.add(db_game_type)
    db.commit()
    db.refresh(db_game_type)
    return db_game_type

@router.put("/{game_type_id}", response_model=schemas.GameType)
async def update_game_type(
    game_type_id: str,
    name: str = Form(...),
    short_code: str = Form(...),
    description: Optional[str] = Form(None),
    is_active: bool = Form(True),
    icon: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Update a game type"""
    db_game_type = db.query(models.GameType).filter(models.GameType.id == game_type_id).first()
    if not db_game_type:
        raise HTTPException(status_code=404, detail="Game type not found")

    # Handle file upload
    if icon:
        # Delete old file if it exists
        if db_game_type.icon_url:
            old_file_path = Path(db_game_type.icon_url.lstrip('/'))
            if old_file_path.exists():
                old_file_path.unlink()

        # Generate unique filename
        file_extension = os.path.splitext(icon.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename

        # Save file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(icon.file, buffer)

        db_game_type.icon_url = f"/uploads/game_types/{unique_filename}"

    # Update other fields
    db_game_type.name = name
    db_game_type.short_code = short_code
    db_game_type.description = description
    db_game_type.is_active = is_active

    db.commit()
    db.refresh(db_game_type)
    return db_game_type

@router.patch("/{game_type_id}/toggle", response_model=schemas.GameType)
def toggle_game_type_status(game_type_id: str, db: Session = Depends(get_db)):
    """Toggle game type active status"""
    db_game_type = db.query(models.GameType).filter(models.GameType.id == game_type_id).first()
    if not db_game_type:
        raise HTTPException(status_code=404, detail="Game type not found")
    
    db_game_type.is_active = not db_game_type.is_active
    db.commit()
    db.refresh(db_game_type)
    return db_game_type

@router.delete("/{game_type_id}")
def delete_game_type(game_type_id: str, db: Session = Depends(get_db)):
    """Delete a game type"""
    db_game_type = db.query(models.GameType).filter(models.GameType.id == game_type_id).first()
    if not db_game_type:
        raise HTTPException(status_code=404, detail="Game type not found")
    
    db.delete(db_game_type)
    db.commit()
    return {"message": "Game type deleted successfully"}
