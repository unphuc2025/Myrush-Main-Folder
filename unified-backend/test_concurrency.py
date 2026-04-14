"""
test_concurrency.py
===================
Tests that two simultaneous booking requests for the same slot are correctly
handled — only ONE succeeds, the other gets a 409 Conflict.

Usage:
    cd unified-backend
    venv\Scripts\python test_concurrency.py

Requirements:
    - Backend running on http://localhost:8000
    - A real court_id and valid user tokens (edit COURT_ID, USER_TOKEN_A, USER_TOKEN_B below)
    - The slot date and time must be an available, future slot at that court
"""

import threading
import requests
import json
from datetime import date, timedelta

# ============================================================
# CONFIGURE THESE BEFORE RUNNING
# ============================================================
BASE_URL = "http://localhost:8000/api/user"

# Two different user tokens (get them by logging in on the web app)
USER_TOKEN_A = "PASTE_USER_A_TOKEN_HERE"
USER_TOKEN_B = "PASTE_USER_B_TOKEN_HERE"

# A real court ID from your database
COURT_ID = "PASTE_COURT_ID_HERE"

# A future date with an available slot (format: YYYY-MM-DD)
BOOKING_DATE = str(date.today() + timedelta(days=2))

# A specific 30-minute slot to contest (must be a valid, unbooked time e.g. "18:00")
CONTEST_SLOT_TIME = "18:00"

# Slice mask (use 1 for a simple independent court, or the appropriate value)
SLICE_MASK = 1
# ============================================================

results = {}

def try_book(user_label: str, token: str):
    """Attempts to create a payment order for the contested slot."""
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    payload = {
        "court_id": COURT_ID,
        "booking_date": BOOKING_DATE,
        "start_time": CONTEST_SLOT_TIME,
        "duration_minutes": 60,
        "time_slots": [
            {"time": CONTEST_SLOT_TIME, "price": 500}
        ],
        "slot_ids": [],
        "number_of_players": 1,
        "original_amount": 500.0,
        "discount_amount": 0.0,
        "total_amount": 500.0,
        "slice_mask": SLICE_MASK,
        "payment_status": "pending"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/payments/create-order",
            headers=headers,
            json=payload,
            timeout=30
        )
        results[user_label] = {
            "status_code": response.status_code,
            "body": response.json()
        }
    except Exception as e:
        results[user_label] = {"status_code": "ERROR", "body": str(e)}


def run_test():
    print("=" * 60)
    print("DOUBLE BOOKING PREVENTION — CONCURRENCY TEST")
    print("=" * 60)
    print(f"Court ID  : {COURT_ID}")
    print(f"Date      : {BOOKING_DATE}")
    print(f"Slot      : {CONTEST_SLOT_TIME}")
    print(f"Mask      : {SLICE_MASK}")
    print()

    if "PASTE" in USER_TOKEN_A or "PASTE" in COURT_ID:
        print("❌ CONFIGURATION REQUIRED")
        print("   Please edit test_concurrency.py and fill in:")
        print("   - USER_TOKEN_A and USER_TOKEN_B (login to get these)")
        print("   - COURT_ID (from your admin panel)")
        print("   - BOOKING_DATE and CONTEST_SLOT_TIME")
        return

    # Fire both requests simultaneously using threads
    print("🚀 Firing two simultaneous booking requests...")
    thread_a = threading.Thread(target=try_book, args=("User_A", USER_TOKEN_A))
    thread_b = threading.Thread(target=try_book, args=("User_B", USER_TOKEN_B))

    thread_a.start()
    thread_b.start()
    thread_a.join()
    thread_b.join()

    # --- Evaluate Results ---
    print()
    print("RESULTS:")
    print("-" * 60)
    success_count = 0
    conflict_count = 0

    for label, result in results.items():
        code = result["status_code"]
        body = result["body"]
        
        if code == 200:
            success_count += 1
            status = "✅ SUCCESS (Razorpay order created)"
        elif code == 409:
            conflict_count += 1
            status = "🚫 BLOCKED (409 Conflict — as expected)"
        else:
            status = f"⚠️  UNEXPECTED (status={code})"
        
        print(f"  {label}: {status}")
        if code not in [200, 409]:
            print(f"    Body: {json.dumps(body, indent=4)}")

    print()
    print("VERDICT:")
    if success_count == 1 and conflict_count == 1:
        print("  ✅ PASS — Double booking correctly prevented!")
        print("     Exactly 1 user succeeded, 1 user was rejected with 409.")
    elif success_count == 2:
        print("  ❌ FAIL — DOUBLE BOOKING VULNERABILITY DETECTED!")
        print("     Both users got a 200. This means the fix is NOT working.")
    elif success_count == 0:
        print("  ⚠️  UNEXPECTED — Both requests failed.")
        print("     Check your configuration (tokens, court_id, slot time).")
    else:
        print(f"  ⚠️  UNEXPECTED result: {success_count} success, {conflict_count} conflict.")
    print("=" * 60)


if __name__ == "__main__":
    run_test()
