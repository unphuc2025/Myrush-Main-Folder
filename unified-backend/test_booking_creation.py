
import requests
import json
from datetime import date, timedelta

BASE_URL = "http://localhost:8000/api/user"
COURT_ID = "59f712a2-4db3-43bb-8b14-f1c7b15e" # From earlier logs
USER_ID = "1a2f082d-72a2-b281-0081-8b9cad0e1f20" # Dummy or real if known

def test_booking():
    booking_date = (date.today() + timedelta(days=1)).isoformat()
    
    payload = {
        "court_id": COURT_ID,
        "booking_date": booking_date,
        "time_slots": [
            {"start_time": "10:00", "price": 200, "display_time": "10:00 AM - 11:00 AM"}
        ],
        "number_of_players": 2,
        "original_amount": 400,
        "discount_amount": 0,
        "payment_status": "pending"
    }
    
    # We need a token if it's protected, but let's see if we get a 401 or 400 first
    print(f"Testing booking creation for {COURT_ID} on {booking_date}...")
    response = requests.post(f"{BASE_URL}/bookings/", json=payload)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")

if __name__ == "__main__":
    test_booking()
