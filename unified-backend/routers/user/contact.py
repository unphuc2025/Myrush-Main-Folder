from fastapi import APIRouter, HTTPException, status, Request
from schemas import ContactFormSubmission
from utils.email_sender import send_contact_email
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/submit", status_code=status.HTTP_201_CREATED)
async def submit_contact_form(data: ContactFormSubmission):
    """
    Handle generic contact form submissions from the frontend.
    Supported form_types: 'landing', 'academy_trial', 'arena', 'corporate', 'pickleball'
    """
    try:
        # Send the customized email notification
        email_sent = send_contact_email(data.model_dump())
        
        if not email_sent:
            logger.warning(f"Failed to send email for contact form submission: {data.form_type}")
            # We still return success to the user so they aren't blocked, 
            # but in a production environment you might queue this or handle differently.
            
        success_messages = {
            'landing': 'Thank you! We have received your inquiry and will be in touch soon.',
            'academy_trial': 'Your trial class request has been received! Our team will contact you shortly.',
            'arena': 'Thanks for reaching out! We will get back to you about Rush Arena.',
            'corporate': 'Thank you for your interest! A corporate sales representative will contact you soon.',
            'pickleball': 'Thanks! We will contact you with more info about Pickleball.'
        }
        
        message = success_messages.get(data.form_type, "Thank you! Your submission has been received.")

        return {
            "success": True, 
            "message": message
        }
        
    except Exception as e:
        logger.error(f"Error processing contact form submission: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request."
        )
