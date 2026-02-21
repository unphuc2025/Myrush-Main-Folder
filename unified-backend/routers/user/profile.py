from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Annotated, List
import schemas, crud, models, database
from dependencies import get_current_user

router = APIRouter(
    prefix="/profile",
    tags=["profile"]
)

@router.get("/cities", response_model=List[schemas.CityResponse])
def get_cities(db: Session = Depends(database.get_db)):
    return crud.get_cities(db)

@router.get("/game-types", response_model=List[schemas.GameTypeResponse])
def get_game_types(db: Session = Depends(database.get_db)):
    return crud.get_game_types(db)

@router.get("/branches", response_model=List[schemas.BranchResponse])
def get_branches(city_id: str = None, db: Session = Depends(database.get_db)):
    """Get all branches, optionally filtered by city_id"""
    return crud.get_branches(db, city_id=city_id)

@router.post("/", response_model=schemas.ProfileResponse)
def create_or_update_profile(
    profile: schemas.ProfileCreate,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(database.get_db)
):
    return crud.create_or_update_profile(db=db, profile=profile, user_id=current_user.id)

@router.get("/", response_model=schemas.ProfileResponse)
def get_profile(
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(database.get_db)
):
    db_profile = crud.get_profile(db, user_id=current_user.id)
    if db_profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return db_profile

@router.get("/me", response_model=schemas.ProfileResponse)
def get_my_profile(
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(database.get_db)
):
    """Alias for / (get_profile) to match frontend expectation"""
    return get_profile(current_user, db)

@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(database.get_db)
):
    from utils.s3_utils import upload_file_to_s3
    
    # Upload to S3
    avatar_url = await upload_file_to_s3(file, folder="avatars")
    
    # Update User model
    current_user.avatar_url = avatar_url
    db.commit()
    db.refresh(current_user)
    
    return {"avatar_url": avatar_url, "message": "Avatar updated successfully"}
