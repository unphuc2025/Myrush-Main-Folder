from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
import models, schemas
from database import get_db
from dependencies import require_super_admin
from utils import s3_utils
import os
import shutil
from datetime import datetime

router = APIRouter(
    prefix="/settings",
    tags=["Site Settings"]
)

UPLOAD_DIR = "uploads/settings"

@router.get("", response_model=schemas.SiteSettingResponse)
def get_site_settings(db: Session = Depends(get_db)):
    settings = db.query(models.SiteSetting).first()
    if not settings:
        # Create default settings if not found
        settings = models.SiteSetting(
            email="admin@myrush.in",
            contact_number="",
            address="",
            copyright_text=f"© {datetime.now().year} RUSH Pitch Booking. All Rights Reserved"
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("", response_model=schemas.SiteSettingResponse, dependencies=[Depends(require_super_admin)])
async def update_site_settings(
    email: str = Form(...),
    contact_number: str = Form(...),
    address: str = Form(...),
    copyright_text: str = Form(...),
    site_logo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    settings = db.query(models.SiteSetting).first()
    
    if not settings:
        settings = models.SiteSetting(
            email=email,
            contact_number=contact_number,
            address=address,
            copyright_text=copyright_text
        )
        db.add(settings)
    else:
        settings.email = email
        settings.contact_number = contact_number
        settings.address = address
        settings.copyright_text = copyright_text

    if site_logo:
        try:
            url = await s3_utils.upload_file_to_s3(site_logo, folder="settings")
            settings.site_logo = url
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload logo: {str(e)}")

    db.commit()
    db.refresh(settings)
    return settings
