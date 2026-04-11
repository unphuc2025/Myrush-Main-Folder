"""
District Integration Test Script — Gateway Authenticated

Tests the District integration APIs through District's Gateway with
proper HMAC-SHA256 authentication headers.

Usage:
    1. Set DISTRICT_VENDOR_ID and DISTRICT_VENDOR_SECRET in .env
    2. Ensure District's Gateway is running on localhost:3000
    3. Run: python test_district_integration.py

Environment Variables Required:
    DISTRICT_VENDOR_ID     : Your vendor ID from District
    DISTRICT_VENDOR_SECRET : Your vendor secret from District
    DISTRICT_GATEWAY_URL   : Gateway base URL (default: http://localhost:3000)
"""

import json
import os
import sys
import logging

# Setup path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from services.integrations.gateway_client import DistrictGatewayClient

# Configure logging to see signature generation details
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)

# Gateway URL from env or default
GATEWAY_URL = os.getenv("DISTRICT_GATEWAY_URL", "http://localhost:3000")

# District API paths (through Gateway — includes the /api/api/ prefix)
ENDPOINTS = {
    "checkAvailability": f"{GATEWAY_URL}/api/api/checkAvailability/",
    "makeBatchBooking":  f"{GATEWAY_URL}/api/api/makeBatchBooking",
    "cancelBooking":     f"{GATEWAY_URL}/api/api/cancelBooking/",
    "booking":           f"{GATEWAY_URL}/api/api/booking",
    "bookings":          f"{GATEWAY_URL}/api/api/bookings",
    "facilities":        f"{GATEWAY_URL}/api/api/facilities",
}


from database import SessionLocal
import models

def create_client() -> DistrictGatewayClient:
    """Creates the gateway client using credentials loaded from the database"""
    db = SessionLocal()
    try:
        partner = db.query(models.Partner).filter(models.Partner.name == "District").first()
        if not partner:
            print("❌ Client initialization failed: District partner not found in database.")
            print("   Please run python seed_district_partner.py to seed the database.")
            sys.exit(1)
            
        client = DistrictGatewayClient(
            vendor_id=partner.unique_id,
            vendor_secret=partner.api_key_hash,
            # key_version continues to default to "1" internally if not passed
        )
        print(f"✅ Gateway client initialized (vendor: {client.vendor_id})")
        return client
    except Exception as e:
        print(f"❌ Client initialization failed: {e}")
        sys.exit(1)
    finally:
        db.close()


def test_availability(client: DistrictGatewayClient):
    """Tests GET /checkAvailability/ through Gateway"""
    print("\n" + "=" * 60)
    print("TEST: Check Availability")
    print("=" * 60)

    params = {
        "id": "unique-id",
        "apiKey": "api-key",
        "facilityName": "testHICAS",
        "sportName": "basketBall",
        "date": "28-02-2026",
    }

    url = ENDPOINTS["checkAvailability"]
    print(f"URL:    {url}")
    print(f"Params: {json.dumps(params, indent=2)}")
    print("-" * 40)

    response = client.get(url, params=params)

    print(f"Status: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception:
        print(f"Response: {response.text[:500]}")


def test_booking(client: DistrictGatewayClient):
    """Tests POST /makeBatchBooking through Gateway"""
    print("\n" + "=" * 60)
    print("TEST: Make Batch Booking")
    print("=" * 60)

    payload = {
        "id": "unique-id",
        "apiKey": "api-key",
        "facilityName": "testHICAS",
        "sportName": "basketBall",
        "userName": "Test Bot",
        "userPhone": "9999999999",
        "userEmail": "",
        "slots": [
            {
                "date": "28-02-2026",
                "slotNumber": 10,  # 5:00 AM
                "courtNumber": 0,
            },
            {
                "date": "28-02-2026",
                "slotNumber": 11,  # 5:30 AM
                "courtNumber": 0,
            },
        ],
    }

    url = ENDPOINTS["makeBatchBooking"]
    print(f"URL:     {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print("-" * 40)

    response = client.post(url, json_data=payload)

    print(f"Status: {response.status_code}")
    try:
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        return result.get("batchBookingId")
    except Exception:
        print(f"Response: {response.text[:500]}")
        return None


def test_cancellation(client: DistrictGatewayClient, batch_booking_id: str = None):
    """Tests POST /cancelBooking/ through Gateway"""
    print("\n" + "=" * 60)
    print("TEST: Cancel Booking")
    print("=" * 60)

    if not batch_booking_id:
        batch_booking_id = "test-batch-id"
        print(f"⚠️  No real batch ID provided, using placeholder: {batch_booking_id}")

    form_data = {
        "id": "unique-id",
        "apiKey": "api-key",
        "facilityName": "testHICAS",
        "bookingID": batch_booking_id,
    }

    url = ENDPOINTS["cancelBooking"]
    print(f"URL:      {url}")
    print(f"FormData: {json.dumps(form_data, indent=2)}")
    print("-" * 40)

    response = client.post(url, form_data=form_data)

    print(f"Status: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception:
        print(f"Response: {response.text[:500]}")


def test_facilities(client: DistrictGatewayClient):
    """Tests GET /facilities through Gateway"""
    print("\n" + "=" * 60)
    print("TEST: Discover Facilities")
    print("=" * 60)

    params = {
        "id": "unique-id",
        "apiKey": "api-key",
    }

    url = ENDPOINTS["facilities"]
    print(f"URL:    {url}")
    print("-" * 40)

    response = client.get(url, params=params)

    print(f"Status: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception:
        print(f"Response: {response.text[:500]}")


def test_booking_history(client: DistrictGatewayClient):
    """Tests GET /bookings through Gateway"""
    print("\n" + "=" * 60)
    print("TEST: Booking History")
    print("=" * 60)

    params = {
        "id": "unique-id",
        "apiKey": "api-key",
        "facilityName": "testHICAS",
        "date": "28-02-2026",
    }

    url = ENDPOINTS["bookings"]
    print(f"URL:    {url}")
    print("-" * 40)

    response = client.get(url, params=params)

    print(f"Status: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception:
        print(f"Response: {response.text[:500]}")


if __name__ == "__main__":
    print("=" * 60)
    print("DISTRICT INTEGRATION TEST — GATEWAY AUTHENTICATED")
    print("=" * 60)
    print(f"Gateway URL: {GATEWAY_URL}")
    print()

    client = create_client()

    try:
        # 1. Check availability
        test_availability(client)

        # 2. Discover facilities
        test_facilities(client)

        # 3. Booking history
        test_booking_history(client)

        # 4. Make a batch booking (uncomment when ready)
        # batch_id = test_booking(client)

        # 5. Cancel the booking (uncomment when ready)
        # if batch_id:
        #     test_cancellation(client, batch_id)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
