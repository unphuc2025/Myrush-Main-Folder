import requests
import json

BASE_URL = "http://localhost:8000/api/admin"

def test_search(query):
    print(f"\nSearching for: '{query}'")
    try:
        # Note: We might need a token if the endpoint is protected.
        # But for this test, let's see if we can get a response or an auth error.
        # If it's an auth error, it at least confirms the route exists.
        response = requests.get(f"{BASE_URL}/courts?search={query}")
        if response.status_code == 200:
            data = response.json()
            items = data.get('items', [])
            print(f"Found {len(items)} items.")
            for item in items:
                print(f" - Court: {item.get('name')}, Branch: {item.get('branch', {}).get('name')}")
        else:
            print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    # Test 1: Search by Branch Name
    test_search("Railways")
    # Test 2: Search by Court Name
    test_search("Football")
    # Test 3: Search by City (if possible)
    test_search("Bangalore")
