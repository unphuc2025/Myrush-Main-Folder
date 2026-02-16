import requests

# Test the branches endpoint
url = "http://localhost:8000/api/user/venues/branches?city=Hyderabad"

print(f"Testing: {url}")
try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Success! Got {len(data)} branches")
        print(data)
    else:
        print(f"Error Response:")
        print(response.text)
except Exception as e:
    print(f"Exception: {e}")
