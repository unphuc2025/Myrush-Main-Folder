import requests
import json

def verify():
    court_id = "59f712a2-4db3-93bb-0b14f1c7b15e"
    date = "2026-02-22"
    url = f"http://localhost:8000/api/user/courts/{court_id}/available-slots?date={date}"
    
    print(f"Requesting URL: {url}")
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        slots = data.get('slots', [])
        print(f"Success! Found {len(slots)} slots.")
        
        # Check if 09:00 is in the available slots
        found_09 = False
        for s in slots:
            if s['time'] == "09:00":
                found_09 = True
                print(f"BAD: Slot 09:00 is STILL SHOWING UP as available: {s}")
        
        if not found_09:
            print("GOOD: Slot 09:00 is NOT in the available list.")
            
    else:
        print(f"FAILED with Status {response.status_code}")
        print("Response Body:")
        print(response.text)

if __name__ == "__main__":
    verify()
