import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_availability():
    print("Testing District Availability...")
    params = {
        "id": "unique-id",
        "apiKey": "api-key",
        "facilityName": "testHICAS", # We need to make sure this exists in DB
        "sportName": "basketBall",
        "date": "28-02-2026"
    }
    response = requests.get(f"{BASE_URL}/checkAvailability/", params=params)
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def test_booking():
    print("\nTesting District Booking...")
    payload = {
        "id": "unique-id",
        "apiKey": "api-key",
        "facilityName": "testHICAS",
        "sportName": "basketBall",
        "userName": "Test Bot",
        "userPhone": "9999999999",
        "slots": [
            {
                "date": "28-02-2026",
                "slotNumber": 10, # 5:00 AM
                "courtNumber": 0
            }
        ]
    }
    response = requests.post(f"{BASE_URL}/makeBatchBooking", json=payload)
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

if __name__ == "__main__":
    # Note: This requires the server to be running
    try:
        test_availability()
        # test_booking()
    except Exception as e:
        print(f"Error: {e}")
