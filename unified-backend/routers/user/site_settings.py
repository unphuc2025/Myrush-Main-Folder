from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import models, schemas
from database import get_db

router = APIRouter(
    prefix="/settings",
    tags=["User Site Settings"]
)

@router.get("", response_model=schemas.SiteSettingResponse)
def get_site_settings(db: Session = Depends(get_db)):
    """Public endpoint to get site configuration (address, social links, etc)"""
    settings = db.query(models.SiteSetting).first()
    if not settings:
        return {
            "id": "00000000-0000-0000-0000-000000000000",
            "company_name": "Addrush Sports Private Limited",
            "email": "support@myrush.in",
            "contact_number": "",
            "address": "",
            "copyright_text": "",
            "instagram_url": "",
            "youtube_url": "",
            "linkedin_url": "",
            "site_logo": None
        }
    return settings
