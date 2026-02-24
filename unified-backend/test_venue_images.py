import requests
import json

BASE_URL = "http://localhost:8000/api/user"

def test_get_venues():
    try:
        response = requests.get(f"{BASE_URL}/venues/")
        if response.status_code == 200:
            venues = response.json()
            if venues:
                print(f"Found {len(venues)} venues.")
                first_venue = venues[0]
                print(f"Venue: {first_venue.get('court_name')}")
                print(f"Photos: {first_venue.get('photos')}")
                
                # Check a specific venue if id is known
                v_id = first_venue.get('id')
                v_res = requests.get(f"{BASE_URL}/venues/{v_id}")
                if v_res.status_code == 200:
                    v_data = v_res.json()
                    print(f"Specific Venue Photos: {v_data.get('photos')}")
            else:
                print("No venues found.")
        else:
            print(f"Error fetching venues: {response.status_code}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_get_venues()
