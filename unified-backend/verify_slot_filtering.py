import requests
import json
import uuid

# Configuration
BASE_URL = "http://localhost:8000/api/user"
# Note: These IDs should exist in your local/dev database
VENUE_ID = "59f712a2-4db3-93bb-0b14f1c7b15e" 
DATE = "2026-02-22"

def test_slots():
    url = f"{BASE_URL}/courts/{VENUE_ID}/available-slots?date={DATE}"
    print(f"Testing: {url}")
    
    try:
        response = requests.get(url)
        if response.status_code != 200:
            print(f"FAILED: Status {response.status_code}")
            print(response.text)
            return

        data = response.json()
        slots = data.get('slots', [])
        print(f"Found {len(slots)} available slots.")
        
        for slot in slots[:5]:
            print(f" - {slot['display_time']} (Available: {slot['available']})")

        print("\nVerification Suggestion:")
        print("1. Book a slot manually in the web app.")
        print("2. Run this script again and verify that the booked hour is missing from the list.")
        
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_slots()
