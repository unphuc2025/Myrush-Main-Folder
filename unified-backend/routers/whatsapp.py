from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
import logging
import json
from utils.exotel_whatsapp import exotel_client

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/webhook/whatsapp",
    tags=["WhatsApp Webhook"]
)

@router.post("")
async def receive_whatsapp_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Endpoint to receive incoming WhatsApp messages and status updates from Exotel.
    """
    try:
        payload = await request.json()
        logger.info(f"Received WhatsApp Webhook: {json.dumps(payload)}")
        
        # Identify the type of event
        # Exotel structure might vary, this is a generic handler based on common patterns
        if 'messages' in payload:
            for message in payload['messages']:
                # Handle incoming message
                sender = message.get('from')
                content = message.get('text', {}).get('body')
                message_type = message.get('type')
                
                logger.info(f"Incoming Message from {sender}: {content}")
                
                # --- AUTO-REPLY LOGIC (Simple) ---
                # In a real app, you would pass this to a service/chatbot engine
                if message_type == 'text':
                    response_text = f"Hello! We received your message: '{content}'. This is an automated reply."
                    exotel_client.send_message(sender, response_text)
                    
        elif 'statuses' in payload:
            for status in payload['statuses']:
                # Handle delivery status (sent, delivered, read)
                msg_id = status.get('id')
                state = status.get('status')
                logger.info(f"Message {msg_id} status update: {state}")
                
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        # Start responding 200 OK to Exotel so they valid retrying? 
        # Actually usually you should return 200 even on error to stop retries if it's a logic error.
        return {"status": "error", "detail": str(e)}

@router.get("/test-send")
def test_send_whatsapp(to_number: str, message: str):
    """
    Dev endpoint to manually trigger a message
    """
    response = exotel_client.send_message(to_number, message)
    return {"response": response}
