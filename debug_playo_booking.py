#!/usr/bin/env python3
"""
Debug script to identify issues with Playo Booking Create API
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'unified-backend'))

from fastapi.testclient import TestClient
from main import app
from datetime import datetime, timedelta
import uuid
from decimal import Decimal

# Create test client
client = TestClient(app)

def debug_booking_creation():
    """Debug the Playo Booking Create API with detailed error messages"""
    
    print("🔍 Debugging Playo Booking Create API")
    print("=" * 50)
    
    # Test with valid API key and realistic data
    print("\n1. Testing with valid API key and realistic data...")
    
    # Use the generated API key
    api_key = "xM2iS_yJBBZxExSIj1rjvl02FFAUOHYl9IgXBBxUkmU"
    
    # Test request with realistic data
    test_request = {
        "venueId": "123e4567-e89b-12d3-a456-426614174000",  # Sample UUID
        "userName": "Test User",
        "userMobile": "9876543210",
        "userEmail": "test@example.com",
        "bookings": [
            {
                "date": "2023-12-25",
                "courtId": "123e4567-e89b-12d3-a456-426614174001",
                "startTime": "10:00:00",
                "endTime": "11:00:00",
                "playoOrderId": "playo-order-12345",
                "price": 500.00,
                "paidAtPlayo": 500.00,
                "numTickets": 2
            }
        ]
    }
    
    response = client.post(
        "/api/playo/booking/create",
        headers={"X-API-Key": api_key},
        json=test_request
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Analyze the response
    if response.status_code == 200:
        print("✅ Booking creation successful!")
        return
    
    if response.status_code == 401:
        print("❌ Authentication failed - check API key")
        return
    
    if response.status_code == 400:
        print("❌ Bad request - check data format")
        return
    
    # If we get here, it's likely a 500 error or the booking creation failed
    data = response.json()
    
    if data.get("requestStatus") == 0:
        message = data.get("message", "Unknown error")
        print(f"❌ Booking creation failed with message: {message}")
        
        # Try to identify the specific issue
        if "Invalid venueId format" in message:
            print("   → Issue: venueId is not a valid UUID")
            print("   → Solution: Use a valid UUID format like: 123e4567-e89b-12d3-a456-426614174000")
            
        elif "Venue not found" in message:
            print("   → Issue: The venueId doesn't exist in the database")
            print("   → Solution: Use a valid venueId from your database")
            
        elif "Court not found" in message:
            print("   → Issue: The courtId doesn't exist or doesn't belong to the venue")
            print("   → Solution: Use a valid courtId that belongs to the specified venue")
            
        elif "Slot not available" in message:
            print("   → Issue: The requested time slot is already booked")
            print("   → Solution: Try a different time slot or date")
            
        elif "Invalid date format" in message:
            print("   → Issue: Date format is incorrect")
            print("   → Solution: Use YYYY-MM-DD format (e.g., 2023-12-25)")
            
        elif "Invalid time format" in message:
            print("   → Issue: Time format is incorrect")
            print("   → Solution: Use HH:MM:SS format (e.g., 10:00:00)")
            
        elif "Invalid price values" in message:
            print("   → Issue: Price or paidAtPlayo values are invalid")
            print("   → Solution: Ensure price > 0 and paidAtPlayo >= 0")
            
        else:
            print("   → Issue: Unknown error")
            print("   → Solution: Check server logs for more details")
    
    print("\n2. Testing with different scenarios...")
    
    # Test 1: Invalid venueId
    print("\n   Testing with invalid venueId...")
    test_request["venueId"] = "invalid-uuid"
    response = client.post(
        "/api/playo/booking/create",
        headers={"X-API-Key": api_key},
        json=test_request
    )
    print(f"   Status: {response.status_code}, Message: {response.json().get('message', 'No message')}")
    
    # Test 2: Invalid courtId
    print("\n   Testing with invalid courtId...")
    test_request["venueId"] = "123e4567-e89b-12d3-a456-426614174000"
    test_request["bookings"][0]["courtId"] = "invalid-uuid"
    response = client.post(
        "/api/playo/booking/create",
        headers={"X-API-Key": api_key},
        json=test_request
    )
    print(f"   Status: {response.status_code}, Message: {response.json().get('message', 'No message')}")
    
    # Test 3: Invalid date
    print("\n   Testing with invalid date...")
    test_request["bookings"][0]["courtId"] = "123e4567-e89b-12d3-a456-426614174001"
    test_request["bookings"][0]["date"] = "25-12-2023"
    response = client.post(
        "/api/playo/booking/create",
        headers={"X-API-Key": api_key},
        json=test_request
    )
    print(f"   Status: {response.status_code}, Message: {response.json().get('message', 'No message')}")
    
    # Test 4: Invalid time
    print("\n   Testing with invalid time...")
    test_request["bookings"][0]["date"] = "2023-12-25"
    test_request["bookings"][0]["startTime"] = "10:00 AM"
    response = client.post(
        "/api/playo/booking/create",
        headers={"X-API-Key": api_key},
        json=test_request
    )
    print(f"   Status: {response.status_code}, Message: {response.json().get('message', 'No message')}")
    
    # Test 5: Invalid price
    print("\n   Testing with invalid price...")
    test_request["bookings"][0]["startTime"] = "10:00:00"
    test_request["bookings"][0]["price"] = -100
    response = client.post(
        "/api/playo/booking/create",
        headers={"X-API-Key": api_key},
        json=test_request
    )
    print(f"   Status: {response.status_code}, Message: {response.json().get('message', 'No message')}")
    
    print("\n3. Summary:")
    print("   To fix booking creation failures:")
    print("   1. Ensure you have valid venueId and courtId from your database")
    print("   2. Use correct date format: YYYY-MM-DD")
    print("   3. Use correct time format: HH:MM:SS")
    print("   4. Ensure price > 0 and paidAtPlayo >= 0")
    print("   5. Ensure the requested time slot is available")
    print("   6. Use the correct X-API-Key")

if __name__ == "__main__":
    debug_booking_creation()