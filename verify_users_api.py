import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/admin/auth"
ADMIN_LOGIN_URL = f"{BASE_URL}/admins/login"
USERS_URL = f"{BASE_URL}/users"

# Use existing admin credentials
ADMIN_EMAIL = "superadmin@example.com"
ADMIN_PASSWORD = "password123"

def login():
    try:
        response = requests.post(ADMIN_LOGIN_URL, json={"unique_id": "9876543210", "password": "password123"})
        if response.status_code == 200:
            return response.json().get("access_token")
        else:
             print(f"Login failed: {response.text}")
             # try create if not exists or assume token if needed
             return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def verify_users_pagination(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Test Default Pagination
    print("\nTesting Default Pagination...")
    resp = requests.get(USERS_URL, headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        print(f"Success! Keys: {data.keys()}")
        print(f"Total: {data.get('total')}, Page: {data.get('page')}")
        if 'items' in data and 'total' in data:
            print("Response structure matches schema.")
        else:
            print("Response structure MISMATCH.")
    else:
        print(f"Failed: {resp.status_code} - {resp.text}")

    # 2. Test Custom Limit
    print("\nTesting limit=1...")
    resp = requests.get(f"{USERS_URL}?limit=1", headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        print(f"Items count: {len(data.get('items'))}")
        if len(data.get('items')) <= 1:
            print("Limit 1 worked.")
        else:
            print("Limit 1 FAILED.")

    # 3. Test Search (assuming some user exists, e.g. search for 'a')
    print("\nTesting Search 'a'...")
    resp = requests.get(f"{USERS_URL}?search=a", headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        print(f"Search 'a' Total found: {data.get('total')}")
    else:
        print(f"Search Failed: {resp.status_code}")

if __name__ == "__main__":
    # Note: Login might fail if I don't have exact credentials. 
    # But I can try to use a known mobile from previous logs if "9876543210" fails.
    # From previous logs, I created a super admin with mobile "9876543210" and password "password123"
    token = login()
    if token:
        verify_users_pagination(token)
    else:
        print("Cannot verify without token.")
