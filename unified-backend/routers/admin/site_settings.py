from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
import models, schemas
from database import get_db
from dependencies import require_super_admin, PermissionChecker
from datetime import datetime
from utils import s3_utils

router = APIRouter(
    prefix="/settings",
    tags=["Site Settings"]
)

@router.get("", response_model=schemas.SiteSettingResponse, dependencies=[Depends(PermissionChecker("Settings", "view"))])
def get_site_settings(db: Session = Depends(get_db)):
    settings = db.query(models.SiteSetting).first()
    if not settings:
        settings = models.SiteSetting(
            company_name="Addrush Sports Private Limited",
            email="admin@myrush.in",
            contact_number="",
            address="",
            copyright_text=f"© {datetime.now().year} RUSH Pitch Booking. All Rights Reserved",
            instagram_url="",
            youtube_url="",
            linkedin_url=""
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("", response_model=schemas.SiteSettingResponse, dependencies=[Depends(PermissionChecker("Settings", "edit"))])
async def update_site_settings(
    company_name: Optional[str] = Form(None),
    email: str = Form(...),
    contact_number: str = Form(...),
    address: str = Form(...),
    copyright_text: str = Form(...),
    instagram_url: Optional[str] = Form(None),
    youtube_url: Optional[str] = Form(None),
    linkedin_url: Optional[str] = Form(None),
    site_logo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    settings = db.query(models.SiteSetting).first()
    
    if not settings:
        settings = models.SiteSetting(
            company_name=company_name,
            email=email,
            contact_number=contact_number,
            address=address,
            copyright_text=copyright_text,
            instagram_url=instagram_url,
            youtube_url=youtube_url,
            linkedin_url=linkedin_url
        )
        db.add(settings)
    else:
        settings.company_name = company_name
        settings.email = email
        settings.contact_number = contact_number
        settings.address = address
        settings.copyright_text = copyright_text
        settings.instagram_url = instagram_url
        settings.youtube_url = youtube_url
        settings.linkedin_url = linkedin_url

    if site_logo:
        try:
            url = await s3_utils.upload_file_to_s3(site_logo, folder="settings")
            settings.site_logo = url
        except Exception as e:
             raise HTTPException(status_code=500, detail=f"Failed to upload logo: {str(e)}")

    db.commit()
    db.refresh(settings)
    return settings
