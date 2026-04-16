import os
import json
import hmac
import hashlib
import uuid
from datetime import datetime, date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch, MagicMock

# Import the main FastAPI app and database components
try:
    from main import app
    from database import SessionLocal, get_db
    import models
    import crud
    import schemas
except ImportError as e:
    print(f"Error importing modules: {e}")
    print("Ensure you are running this script from the 'unified-backend' directory.")
    exit(1)

# Initialize TestClient
client = TestClient(app)

def generate_razorpay_signature(secret, body_str):
    """Generate SHA256 HMAC signature for Razorpay webhook"""
    return hmac.new(
        secret.encode('utf-8'),
        body_str.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

def test_payment_flow():
    db = SessionLocal()
    
    # 1. SETUP: Find or Create a Test User and Court
    user = db.query(models.User).first()
    if not user:
        print("❌ No user found in database. Please run the server and create a user first.")
        return

    branch = db.query(models.Branch).first()
    court = db.query(models.Court).first()
    if not court or not branch:
        print("❌ No court/branch found in database.")
        return

    print(f"--- Starting Payment Flow Test ---")
    print(f"Target User: {user.email} ({user.id})")
    print(f"Target Court: {court.name} (ID: {court.id})")

    # 2. CREATE PENDING BOOKING
    # Generate a unique Razorpay Order ID for this test
    test_order_id = f"order_test_{uuid.uuid4().hex[:8]}"
    
    # Calculate Authoritative Price to avoid 'Price mismatch' error
    from utils.booking_utils import generate_allowed_slots_map
    from routers.user.payments import calculate_authoritative_price
    
    # Use a date within 30 days (limit) but far enough to avoid most conflicts
    booking_date = date.today() + timedelta(days=25)
    
    # Try a very early or very late slot to avoid overlaps
    import random
    start_hour = random.randint(6, 21) 
    temp_slots = [
        {"time": f"{start_hour:02d}:00"}, 
        {"time": f"{start_hour:02d}:30"}
    ]
    
    try:
        authoritative_total = calculate_authoritative_price(
            db, str(court.id), booking_date, temp_slots, 1, None
        )
        print(f"Authoritative price calculated: {authoritative_total}")
    except Exception as e:
        print(f"Warning: Could not calculate authoritative price via helper: {e}. Falling back to 1500.")
        authoritative_total = 1500.0
        for s in temp_slots: s['price'] = 750.0

    booking_in = schemas.BookingCreate(
        branch_id=str(branch.id),
        court_id=str(court.id),
        booking_date=booking_date,
        start_time="10:00",
        duration_minutes=60,
        time_slots=temp_slots,
        number_of_players=1,
        payment_status="pending",
        razorpay_order_id=test_order_id,
        original_amount=authoritative_total,
        total_amount=authoritative_total
    )

    print(f"Step 1: Creating 'pending' booking for order {test_order_id}...")
    try:
        booking = crud.create_booking(db, booking_in, str(user.id))
        db.commit()
        db.refresh(booking)
        print(f"✅ Booking created successfully. ID: {booking.id}, Status: {booking.payment_status}")
    except Exception as e:
        print(f"❌ Failed to create booking: {e}")
        return

    # 3. CONSTRUCT WEBHOOK PAYLOAD (payment.captured)
    test_payment_id = f"pay_test_{uuid.uuid4().hex[:8]}"
    webhook_payload = {
        "entity": "event",
        "account_id": "acc_DummyAccount",
        "event": "payment.captured",
        "contains": ["payment"],
        "payload": {
            "payment": {
                "entity": {
                    "id": test_payment_id,
                    "entity": "payment",
                    "amount": int(authoritative_total * 100),
                    "currency": "INR",
                    "status": "captured",
                    "order_id": test_order_id,
                    "invoice_id": None,
                    "international": False,
                    "method": "card",
                    "amount_refunded": 0,
                    "refund_status": None,
                    "captured": True,
                    "description": "Test Payment",
                    "card_id": "card_DummyCard",
                    "bank": None,
                    "wallet": None,
                    "vpa": None,
                    "email": user.email,
                    "contact": user.phone_number or "9999999999",
                    "notes": {
                        "internal_order_id": str(booking.id)
                    },
                    "fee": 0,
                    "tax": 0,
                    "error_code": None,
                    "error_description": None,
                    "created_at": int(datetime.now().timestamp())
                }
            }
        },
        "created_at": int(datetime.now().timestamp())
    }

    body_str = json.dumps(webhook_payload)
    webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET")
    
    if not webhook_secret:
        print("❌ RAZORPAY_WEBHOOK_SECRET not found in .env. Test cannot proceed.")
        return

    signature = generate_razorpay_signature(webhook_secret, body_str)
    print(f"Step 2: Simulating Webhook POST to /payments/webhook...")
    print(f"Generated x-razorpay-signature: {signature[:10]}...")

    # 4. SEND WEBHOOK REQUEST WITH MOCKED VRIKSHA
    # We mock requests.post to simulate Vriksha success
    with patch("requests.post") as mock_post:
        # Mock Vriksha returning 200 OK
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        headers = {
            "x-razorpay-signature": signature,
            "Content-Type": "application/json",
            "X-Razorpay-Event-Id": "evt_DummyEventID"
        }

        response = client.post("/api/user/payments/webhook", content=body_str, headers=headers)
        
        print(f"Webhook response status: {response.status_code}")
        print(f"Webhook response body: {response.json()}")

        if response.status_code != 200:
            print(f"❌ Webhook call failed!")
            return

    # 5. VERIFY DB STATE
    db.refresh(booking)
    print(f"Step 3: Verifying database state for Booking {booking.id}...")
    print(f"New Booking Status: {booking.payment_status}")
    print(f"Payment ID stored: {booking.payment_id}")
    print(f"Signature stored: {booking.razorpay_signature is not None}")

    if booking.payment_status == "paid":
        print("\n🏆 TEST SUCCESS: End-to-end payment flow (Order -> Webhook -> Verification -> Vriksha -> DB Update) is functional!")
    else:
        print("\n❌ TEST FAILED: Booking status did not update to 'paid'.")

    # 6. CLEANUP (Optional)
    # db.delete(booking)
    # db.commit()
    # print("Cleaned up test booking.")
    
    db.close()

if __name__ == "__main__":
    test_payment_flow()
