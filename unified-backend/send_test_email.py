import os
import sys
from dotenv import load_dotenv

# Add current directory to path so we can import utils
sys.path.append(os.getcwd())

# Mock the environment variable BEFORE importing the module if it reads at top level, 
# but email_sender reads inside the function, so we are good.
os.environ["ACADEMY_ADMIN_EMAIL"] = "apparao@vriksha.ai"

from utils.email_sender import send_academy_application_email

def test_email():
    print("Attempting to send test email to apparao@vriksha.ai...")
    
    test_data = {
        "athlete_name": "Test Athlete",
        "age_group": "U-18",
        "contact_email": "test@example.com",
        "phone_number": "1234567890",
        "preferred_sport": "Football",
        "experience_level": "Intermediate"
    }
    
    success = send_academy_application_email(test_data)
    
    if success:
        print("✅ Email sent successfully!")
    else:
        print("❌ Failed to send email. Check logs.")

if __name__ == "__main__":
    test_email()
