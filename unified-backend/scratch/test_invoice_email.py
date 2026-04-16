import os
import sys
import logging
from dotenv import load_dotenv

# Setup paths
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging to see everything
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from database import SessionLocal
from utils.email_sender import send_booking_invoice_email

def test_invoice_email():
    db = SessionLocal()
    
    # Valid Booking ID found in DB
    booking_id = "60033793-6a85-4339-9c32-a58732f77f1d"
    
    # Using the email from .env recipients for a real test
    test_email = os.getenv("ERROR_ALERT_RECIPIENTS", "ajaypamarthi8@gmail.com").split(',')[0]
    
    print(f"--- RUNNING INVOICE EMAIL TEST ---")
    print(f"Booking ID: {booking_id}")
    print(f"Target Email: {test_email}")
    print(f"----------------------------------")
    
    success = send_booking_invoice_email(db, booking_id, test_email)
    
    if success:
        print("\nSUCCESS: The email was accepted by the SMTP server.")
    else:
        print("\nFAILURE: Check the logs above for the specific error.")

    db.close()

if __name__ == "__main__":
    test_invoice_email()
