from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from database import get_db
import uuid
import os
import shutil
from pathlib import Path
from utils import s3_utils

router = APIRouter(
    prefix="/venues",
    tags=["venues"]
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads/venues")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.get("")
@router.get("/")
def get_all_venues(game_type: str = None, db: Session = Depends(get_db)):
    """Get all venues, optionally filtered by game_type"""
    query = db.query(models.AdminVenue)
    if game_type:
        query = query.filter(models.AdminVenue.game_type == game_type)
    return query.all()

@router.get("/{venue_id}")
def get_venue(venue_id: str, db: Session = Depends(get_db)):
    """Get a specific venue by ID"""
    venue = db.query(models.AdminVenue).filter(models.AdminVenue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    return venue

@router.post("")
@router.post("/")
async def create_venue(
    game_type: str = Form(...),
    court_name: Optional[str] = Form(None),
    location: str = Form(...),
    prices: str = Form(...),
    description: str = Form(...),
    photos: List[UploadFile] = File(None),
    videos: List[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Create a new venue"""
    
    # Handle photo uploads
    photo_urls = []
    if photos:
        for photo in photos:
            if photo.filename:
                try:
                    url = await s3_utils.upload_file_to_s3(photo, folder="venues/photos")
                    photo_urls.append(url)
                except Exception as e:
                    print(f"Error uploading photo: {e}")
                    # Continue or abort? For now continue
                    pass

    # Handle video uploads
    video_urls = []
    if videos:
        for video in videos:
            if video.filename:
                try:
                    url = await s3_utils.upload_file_to_s3(video, folder="venues/videos")
                    video_urls.append(url)
                except Exception as e:
                    print(f"Error uploading video: {e}")
                    pass

    db_venue = models.AdminVenue(
        game_type=game_type,
        court_name=court_name,
        location=location,
        prices=prices,
        description=description,
        photos=photo_urls,
        videos=video_urls
    )
    db.add(db_venue)
    db.commit()
    db.refresh(db_venue)
    return db_venue

@router.put("/{venue_id}")
async def update_venue(
    venue_id: str,
    game_type: str = Form(...),
    court_name: Optional[str] = Form(None),
    location: str = Form(...),
    prices: str = Form(...),
    description: str = Form(...),
    photos: List[UploadFile] = File(None),
    videos: List[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Update a venue"""
    db_venue = db.query(models.AdminVenue).filter(models.AdminVenue.id == venue_id).first()
    if not db_venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    current_photos = db_venue.photos or []
    if photos:
        for photo in photos:
            if photo.filename:
                try:
                    url = await s3_utils.upload_file_to_s3(photo, folder="venues/photos")
                    current_photos.append(url)
                except Exception as e:
                    print(f"Error uploading photo: {e}")

    current_videos = db_venue.videos or []
    if videos:
        for video in videos:
            if video.filename:
                try:
                    url = await s3_utils.upload_file_to_s3(video, folder="venues/videos")
                    current_videos.append(url)
                except Exception as e:
                    print(f"Error uploading video: {e}")

    db_venue.game_type = game_type
    db_venue.court_name = court_name
    db_venue.location = location
    db_venue.prices = prices
    db_venue.description = description
    db_venue.photos = current_photos
    db_venue.videos = current_videos
    
    db.commit()
    db.refresh(db_venue)
    return db_venue

@router.delete("/{venue_id}")
def delete_venue(venue_id: str, db: Session = Depends(get_db)):
    """Delete a venue"""
    db_venue = db.query(models.AdminVenue).filter(models.AdminVenue.id == venue_id).first()
    if not db_venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    # Optional: Delete files from disk
    if db_venue.photos:
        for photo_url in db_venue.photos:
            try:
                file_path = Path(photo_url.lstrip('/'))
                if file_path.exists():
                    file_path.unlink()
            except Exception:
                pass # Ignore errors during file deletion

    if db_venue.videos:
        for video_url in db_venue.videos:
            try:
                file_path = Path(video_url.lstrip('/'))
                if file_path.exists():
                    file_path.unlink()
            except Exception:
                pass

    db.delete(db_venue)
    db.commit()
    return {"message": "Venue deleted successfully"}
