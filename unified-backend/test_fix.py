import requests
import json

url = "http://localhost:8000/api/user/payments/create-order"
# I need a valid token to test this, but I can also just check if it gets past the price validation
# Wait, create-order requires auth. I'll use the user's mobile to get a token if possible 
# or just assume the code works based on logs if I can't easily get a token.

# Actually, I can check the logs of the server after I try to hit it.
# Even if it fails with 401 Unauthorized, it won't reach the 409 logic.
# But I can also try to find a token in the logs or db.

# Let's try to find a user in the DB to use.
payload = {
  "branch_id": "f4de87f7-dd91-4a74-beeb-8eeb9fb3f564",
  "court_id": "231a604e-9a33-4984-820f-3d32df1f23fe",
  "booking_date": "2026-04-15",
  "start_time": "10:00",
  "duration_minutes": 60,
  "time_slots": [
    {"time": "12:00"},
    {"time": "12:30"}
  ],
  "number_of_players": 1,
  "slice_mask": 0
}

# I'll just run this and see what the server log says.
try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
