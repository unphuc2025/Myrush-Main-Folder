import razorpay
import os
from dotenv import load_dotenv

# Load .env from current directory
load_dotenv()

KEY_ID = os.getenv("RAZORPAY_KEY_ID")
KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

print(f"Checking Razorpay Keys...")
print(f"Key ID: {KEY_ID}")
# print(f"Key Secret: {KEY_SECRET}") # Keep secret hidden

if not KEY_ID or not KEY_SECRET:
    print("❌ Error: Keys not found in .env")
    exit(1)

try:
    client = razorpay.Client(auth=(KEY_ID, KEY_SECRET))
    
    print("Attempting to create a test order...")
    data = {
        "amount": 50000, # 500 INR
        "currency": "INR",
        "receipt": "test_receipt_1",
        "notes": {
            "type": "verification_test"
        }
    }
    
    order = client.order.create(data=data)
    
    print("✅ Success! Order created.")
    print(f"Order ID: {order['id']}")
    print(f"Status: {order['status']}")
    
except Exception as e:
    print(f"❌ Failed to create order: {e}")
    exit(1)
