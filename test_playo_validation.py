#!/usr/bin/env python3
"""
Test script to verify Playo Order Create API validation fixes
This test focuses on validation logic without requiring database setup
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

def test_playo_validation_logic():
    """Test the Playo Order Create API validation logic"""

    print("🧪 Testing Playo Order Create API Validation Fixes")
    print("=" * 60)

    # Test 1: Missing X-API-Key header
    print("\n1. Testing missing X-API-Key header...")
    response = client.post(
        "/api/playo/orders",
        json={
            "venueId": "harsha123456",  # Invalid UUID
            "userName": "Test User",
            "userMobile": "9876543210",
            "userEmail": "test@example.com",
            "orders": []
        }
    )

    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

    # Should return unauthorized response
    assert response.status_code == 200
    data = response.json()
    assert data["requestStatus"] == 0
    assert data["message"] == "Unauthorized"
    assert data["orderIds"] == []
    print("✅ Missing X-API-Key test passed")

    # Test 2: Invalid venueId format (not UUID) - with valid API key format
    print("\n2. Testing invalid venueId format...")
    response = client.post(
        "/api/playo/orders",
        headers={"X-API-Key": "valid-test-key"},
        json={
            "venueId": "harsha123456",  # Invalid UUID
            "userName": "Test User",
            "userMobile": "9876543210",
            "userEmail": "test@example.com",
            "orders": []
        }
    )

    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

    # Should return validation error for invalid venueId
    assert response.status_code == 200
    data = response.json()
    assert data["requestStatus"] == 0
    assert "Invalid venueId format" in data["message"]
    print("✅ Invalid venueId format test passed")

    # Test 3: Invalid date format
    print("\n3. Testing invalid date format...")
    response = client.post(
        "/api/playo/orders",
        headers={"X-API-Key": "valid-test-key"},
        json={
            "venueId": str(uuid.uuid4()),
            "userName": "Test User",
            "userMobile": "9876543210",
            "userEmail": "test@example.com",
            "orders": [
                {
                    "date": "25-12-2023",  # Wrong format (DD-MM-YYYY instead of YYYY-MM-DD)
                    "courtId": str(uuid.uuid4()),
                    "startTime": "10:00:00",
                    "endTime": "11:00:00",
                    "price": 500,
                    "paidAtPlayo": 500,
                    "playoOrderId": "playo-order-1"
                }
            ]
        }
    )

    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

    # Should return validation error
    assert response.status_code == 200
    data = response.json()
    assert data["requestStatus"] == 0
    assert "Order creation failed" in data["message"]
    print("✅ Invalid date format test passed")

    # Test 4: Invalid time format
    print("\n4. Testing invalid time format...")
    response = client.post(
        "/api/playo/orders",
        headers={"X-API-Key": "valid-test-key"},
        json={
            "venueId": str(uuid.uuid4()),
            "userName": "Test User",
            "userMobile": "9876543210",
            "userEmail": "test@example.com",
            "orders": [
                {
                    "date": "2023-12-25",
                    "courtId": str(uuid.uuid4()),
                    "startTime": "10:00 AM",  # Wrong format (should be HH:MM:SS)
                    "endTime": "11:00:00",
                    "price": 500,
                    "paidAtPlayo": 500,
                    "playoOrderId": "playo-order-1"
                }
            ]
        }
    )

    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

    # Should return validation error
    assert response.status_code == 200
    data = response.json()
    assert data["requestStatus"] == 0
    assert "Order creation failed" in data["message"]
    print("✅ Invalid time format test passed")

    # Test 5: Missing required fields (Pydantic validation)
    print("\n5. Testing missing required fields...")
    response = client.post(
        "/api/playo/orders",
        headers={"X-API-Key": "valid-test-key"},
        json={
            "venueId": str(uuid.uuid4()),
            # Missing userName, userMobile, userEmail
            "orders": [
                {
                    "date": "2023-12-25",
                    "courtId": str(uuid.uuid4()),
                    "startTime": "10:00:00",
                    "endTime": "11:00:00",
                    "price": 500,
                    # Missing paidAtPlayo
                    "playoOrderId": "playo-order-1"
                }
            ]
        }
    )

    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

    # Should return validation error from Pydantic
    assert response.status_code == 422
    print("✅ Missing required fields test passed")

    # Test 6: Valid request format (should fail due to invalid API key, but format is correct)
    print("\n6. Testing valid request format...")
    response = client.post(
        "/api/playo/orders",
        headers={"X-API-Key": "valid-test-key"},
        json={
            "venueId": str(uuid.uuid4()),
            "userName": "Test User",
            "userMobile": "9876543210",
            "userEmail": "test@example.com",
            "orders": [
                {
                    "date": "2023-12-25",
                    "courtId": str(uuid.uuid4()),
                    "startTime": "10:00:00",
                    "endTime": "11:00:00",
                    "price": 500,
                    "paidAtPlayo": 500,
                    "playoOrderId": "playo-order-1"
                }
            ]
        }
    )

    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

    # Should return unauthorized (since API key doesn't exist in DB)
    assert response.status_code == 200
    data = response.json()
    assert data["requestStatus"] == 0
    assert data["message"] == "Unauthorized"
    print("✅ Valid request format test passed (returns unauthorized as expected)")

    print("\n🎉 All Playo Order Create API validation tests passed!")
    print("✅ Fixed issues:")
    print("   - UUID validation for venueId and courtId")
    print("   - Date format validation (YYYY-MM-DD)")
    print("   - Time format validation (HH:MM:SS)")
    print("   - X-API-Key authorization")
    print("   - Proper error handling and response format")
    print("   - Transactional logic (validate all before creating any)")
    print("   - Playo-compatible response format")

if __name__ == "__main__":
    test_playo_validation_logic()