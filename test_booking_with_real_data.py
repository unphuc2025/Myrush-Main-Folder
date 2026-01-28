#!/usr/bin/env python3
"""
Test Playo Booking Create API with real venue and court IDs from database
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'unified-backend'))

from fastapi.testclient import TestClient
from main import app
from datetime import datetime, timedelta
import uuid

# Create test client
client = TestClient(app)

def test_booking_with_real_data():
    """Test booking creation with actual venue and court IDs from database"""
    
    print("🧪 Testing Playo Booking Create API with Real Data")
    print("=" * 60)
    
    # Use the new API key we generated
    api_key = "EbierqVPTUEOx7xAOsQCOQIESs1Cvs2wVJ7a3qnfUzI"
    
    # Use actual venue and court IDs from database
    venue_id = "2e85dcd9-fa65-4e1d-917f-739f84785e91"  # Rush Arena GT World Mall
    court_id = "840c12cc-7a5e-4229-a01b-af74d848951c"  # Rush Arena GT World Mall (cricket)
    
    # Test with future date to ensure slot is available
    future_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    
    # Test request with real data
    test_request = {
        "venueId": venue_id,
        "userName": "Test User",
        "userMobile": "9876543210",
        "userEmail": "test@example.com",
        "bookings": [
            {
                "date": future_date,  # Use future date
                "courtId": court_id,
                "startTime": "10:00:00",
                "endTime": "11:00:00",
                "playoOrderId": f"playo-order-{uuid.uuid4().hex[:8]}",
                "price": 200.00,  # Price matches court price
                "paidAtPlayo": 200.00,
                "numTickets": 2
            }
        ]
    }
    
    print(f"📅 Using date: {future_date}")
    print(f"🏢 Venue ID: {venue_id}")
    print(f"🎾 Court ID: {court_id}")
    print(f"🔑 API Key: {api_key}")
    print()
    
    response = client.post(
        "/api/playo/booking/create",
        headers={"X-API-Key": api_key},
        json=test_request
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get("requestStatus") == 1:
            print("✅ Booking creation SUCCESSFUL!")
            print(f"   📋 Booking IDs: {data.get('bookingIds', [])}")
            return True
        else:
            print(f"❌ Booking creation failed: {data.get('message', 'Unknown error')}")
            return False
    else:
        print(f"❌ HTTP Error: {response.status_code}")
        return False

def test_multiple_bookings():
    """Test multiple bookings in one request"""
    
    print("\n🧪 Testing Multiple Bookings")
    print("=" * 40)
    
    api_key = "EbierqVPTUEOx7xAOsQCOQIESs1Cvs2wVJ7a3qnfUzI"
    venue_id = "2e85dcd9-fa65-4e1d-917f-739f84785e91"
    court_id = "840c12cc-7a5e-4229-a01b-af74d848951c"
    
    future_date = (datetime.now() + timedelta(days=2)).strftime('%Y-%m-%d')
    
    test_request = {
        "venueId": venue_id,
        "userName": "Test User",
        "userMobile": "9876543210",
        "userEmail": "test@example.com",
        "bookings": [
            {
                "date": future_date,
                "courtId": court_id,
                "startTime": "10:00:00",
                "endTime": "11:00:00",
                "playoOrderId": f"playo-order-{uuid.uuid4().hex[:8]}",
                "price": 200.00,
                "paidAtPlayo": 200.00,
                "numTickets": 2
            },
            {
                "date": future_date,
                "courtId": court_id,
                "startTime": "14:00:00",
                "endTime": "15:00:00",
                "playoOrderId": f"playo-order-{uuid.uuid4().hex[:8]}",
                "price": 200.00,
                "paidAtPlayo": 200.00,
                "numTickets": 1
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
    
    if response.status_code == 200:
        data = response.json()
        if data.get("requestStatus") == 1:
            print("✅ Multiple booking creation SUCCESSFUL!")
            return True
        else:
            print(f"❌ Multiple booking creation failed: {data.get('message', 'Unknown error')}")
            return False
    else:
        print(f"❌ HTTP Error: {response.status_code}")
        return False

if __name__ == "__main__":
    success1 = test_booking_with_real_data()
    success2 = test_multiple_bookings()
    
    print("\n" + "=" * 60)
    if success1 and success2:
        print("🎉 ALL TESTS PASSED! Booking creation is working correctly.")
    else:
        print("❌ Some tests failed. Check the error messages above.")
    
    print("\n📋 Summary:")
    print("   - Use venue ID: 2e85dcd9-fa65-4e1d-917f-739f84785e91")
    print("   - Use court ID: 840c12cc-7a5e-4229-a01b-af74d848951c")
    print("   - Use API Key: EbierqVPTUEOx7xAOsQCOQIESs1Cvs2wVJ7a3qnfUzI")
    print("   - Use future dates for testing")
    print("   - Use court price: 200.00")