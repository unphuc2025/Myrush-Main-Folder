import requests
import json

BASE_URL = "http://localhost:8000/api/chatbot"

def test_endpoint(endpoint):
    url = f"{BASE_URL}{endpoint}"
    print(f"Testing {url}...")
    try:
        response = requests.get(url)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Success: {data.get('success', False)}")
            if 'data' in data:
                print(f"Data keys: {list(data['data'].keys()) if isinstance(data['data'], dict) else 'List with ' + str(len(data['data'])) + ' items'}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")
    print("-" * 30)

print("Verifying Backend Chatbot Endpoints...")
test_endpoint("/knowledge/base")
test_endpoint("/knowledge/faqs")
test_endpoint("/knowledge/venues")
