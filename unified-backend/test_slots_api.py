import requests
import json

# Test the venue slots endpoint
venue_id = "59f712a2-4db3-93bb-0b14f1c7b15e"  # Your venue ID
date = "2026-02-13"
game_type = "Box Cricket"

url = f"http://localhost:8000/api/user/venues/{venue_id}/slots?date={date}&game_type={game_type}"

print(f"Testing endpoint: {url}")
response = requests.get(url)

if response.status_code == 200:
    data = response.json()
    print(f"\nResponse ({len(data.get('slots', []))} slots):")
    print(json.dumps(data, indent=2))
    
    # Check if court_name is in the slots
    if data.get('slots'):
        print("\n=== Checking court_name field ===")
        for i, slot in enumerate(data['slots'][:3]):  # Check first 3 slots
            print(f"Slot {i+1}: {slot.get('display_time')} - Court: '{slot.get('court_name', 'MISSING')}'")
else:
    print(f"Error: {response.status_code}")
    print(response.text)
