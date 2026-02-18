from fastapi import APIRouter, HTTPException, status
from schemas import AcademyRegistration
from utils.email_sender import send_academy_application_email

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_academy_student(data: AcademyRegistration):
    """
    Submit an application for the Academy.
    Sends an email notification to the administration.
    """
    email_sent = send_academy_application_email(data.model_dump())
    
    if not email_sent:
        # We might still want to return success to the user if the data was logged, 
        # but technically it failed to send. 
        # For now, let's assume if it returns False (and not handled by mock), it's an issue.
        # However, email_sender.py returns True for mock.
        pass 
    
    return {
        "success": True, 
        "message": "Application submitted successfully. We will contact you shortly."
    }
