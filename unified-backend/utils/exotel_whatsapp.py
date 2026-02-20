import os
import requests
import json
import logging
from fastapi import HTTPException
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ExotelWhatsAppClient:
    def __init__(self):
        self.api_key = os.getenv("EXOTEL_API_KEY")
        self.api_token = os.getenv("EXOTEL_API_TOKEN")
        self.account_sid = os.getenv("EXOTEL_ACCOUNT_SID")
        self.subdomain = os.getenv("EXOTEL_SUBDOMAIN")
        self.whatsapp_number = os.getenv("EXOTEL_WHATSAPP_NUMBER")
        
        if not all([self.api_key, self.api_token, self.account_sid, self.subdomain]):
            logger.warning("Exotel credentials not fully configured. WhatsApp features will be disabled.")
            self.is_configured = False
        else:
            self.is_configured = True
            
        self.base_url = f"https://{self.subdomain}/v2/accounts/{self.account_sid}/messages"

    def send_message(self, to_number: str, message_body: str):
        """
        Sends a free-form WhatsApp message (only within 24-hour window).
        """
        if not self.is_configured:
            logger.error("Exotel not configured. Cannot send message.")
            return False

        try:
            # Basic cleaning of phone number (remove + or spaces)
            to_number = to_number.replace("+", "").replace(" ", "").strip()
            
            payload = {
                "custom_data": "1234",  # Optional tracking ID
                "status_callback": "https://your-domain.com/api/webhook/whatsapp/status", # Update this with real domain
                "whatsapp": {
                    "to": to_number,
                    "type": "text",
                    "text": {
                        "body": message_body
                    }
                }
            }
            
            headers = {
                'Content-Type': 'application/json'
            }
            
            # Auth is handled via Basic Auth (API Key, API Token)
            response = requests.post(
                self.base_url, 
                auth=(self.api_key, self.api_token), 
                json=payload
            )
            
            if response.status_code in [200, 201]:
                logger.info(f"WhatsApp message sent to {to_number}")
                return response.json()
            else:
                logger.error(f"Failed to send WhatsApp message. Status: {response.status_code}, Response: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error sending WhatsApp message: {str(e)}")
            return None

    def send_template_message(self, to_number: str, template_name: str, template_params: list, language: str = "en"):
        """
        Sends a WhatsApp Template Message (HSM).
        """
        if not self.is_configured:
            return False

        try:
             # Basic cleaning of phone number
            to_number = to_number.replace("+", "").replace(" ", "").strip()
            
            payload = {
                "whatsapp": {
                    "to": to_number,
                    "type": "template",
                    "template": {
                        "name": template_name,
                        "language": {
                            "code": language,
                            "policy": "deterministic"
                        },
                        "components": [
                            {
                                "type": "body",
                                "parameters": template_params 
                                # Params format: [{"type": "text", "text": "Value1"}, ...]
                            }
                        ]
                    }
                }
            }
            
            response = requests.post(
                self.base_url, 
                auth=(self.api_key, self.api_token), 
                json=payload
            )
             
            if response.status_code in [200, 201]:
                logger.info(f"WhatsApp template sent to {to_number}")
                return response.json()
            else:
                logger.error(f"Failed to send template. Status: {response.status_code}, Response: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error sending WhatsApp template: {str(e)}")
            return None

# Global instance
exotel_client = ExotelWhatsAppClient()
