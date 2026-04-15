import requests
import json

BASE_URL = "http://localhost:8000"

def test_admin_login():
    print("Testing Admin Login...")
    login_payload = {
        "mobile": "9505049225",
        "password": "Admin"
    }
    response = requests.post(f"{BASE_URL}/api/admin/auth/admins/login", json=login_payload)
    if response.status_code == 200:
        data = response.json()
        token = data.get("data", {}).get("token") or data.get("token")
        print(f"Admin Token: {token}")
        return token
    else:
        print(f"Admin Login Failed: {response.status_code} - {response.text}")
        return None

def test_user_login():
    print("Testing User Login...")
    # Step 1: Send OTP (Dev mode fixed 12345)
    send_payload = {"phone_number": "+919916299183"}
    requests.post(f"{BASE_URL}/api/user/auth/send-otp", json=send_payload)
    
    # Step 2: Verify OTP
    verify_payload = {
        "phone_number": "+919916299183",
        "otp_code": "12345"
    }
    response = requests.post(f"{BASE_URL}/api/user/auth/verify-otp", json=verify_payload)
    if response.status_code == 200:
        data = response.json()
        token = data.get("data", {}).get("access_token") or data.get("access_token")
        print(f"User Token: {token}")
        return token
    else:
        print(f"User Login Failed: {response.status_code} - {response.text}")
        return None

if __name__ == "__main__":
    admin_token = test_admin_login()
    user_token = test_user_login()
