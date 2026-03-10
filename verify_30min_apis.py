import sys
import os
import unittest
from datetime import datetime, timedelta, time
import uuid
import json

# Add unified-backend to path
sys.path.append(os.path.join(os.getcwd(), 'unified-backend'))

from sqlalchemy.orm import Session
from database import SessionLocal
import models
from services.integrations.district_adapter import DistrictAdapter
import schemas_district
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

class Test30MinApiCompliance(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()
        # Find a real court for testing
        self.court = self.db.query(models.Court).filter(models.Court.is_active == True).first()
        self.branch = self.court.branch
        self.sport = self.court.game_type
        
        self.test_date = (datetime.utcnow() + timedelta(days=5)).strftime('%d-%m-%Y')
        self.iso_date = (datetime.utcnow() + timedelta(days=5)).strftime('%Y-%m-%d')
        
        # Ensure we have a partner record for District
        self.district_partner = self.db.query(models.Partner).filter(models.Partner.name == "District").first()
        if not self.district_partner:
            self.district_partner = models.Partner(name="District", api_key="dist-test-key", is_active=True)
            self.db.add(self.district_partner)
            self.db.commit()
            
        self.district_adapter = DistrictAdapter(self.db, str(self.district_partner.id), skip_notifications=True)
        
        # Ensure we have a Playo API Key
        import hashlib
        test_key = "playo-debug-key"
        test_hash = hashlib.sha256(test_key.encode()).hexdigest()
        
        self.playo_key_raw = test_key
        self.playo_key = self.db.query(models.PlayoAPIKey).filter(models.PlayoAPIKey.token_hash == test_hash).first()
        if not self.playo_key:
             self.playo_key = models.PlayoAPIKey(token_hash=test_hash, description="Test Partner", is_active=True)
             self.db.add(self.playo_key)
             self.db.commit()
             self.db.refresh(self.playo_key)

        # Aggressive cleanup for test date (all courts to be safe)
        test_date_obj = datetime.strptime(self.iso_date, '%Y-%m-%d').date()
        self.db.query(models.Booking).filter(
            models.Booking.booking_date == test_date_obj
        ).delete()
        self.db.query(models.PlayoOrder).filter(
            models.PlayoOrder.booking_date == test_date_obj
        ).delete()
        self.db.commit()
        
        print(f"   [SETUP] Using Court: {self.court.name} (ID: {self.court.id})")
        print(f"   [SETUP] Cleaned up all bookings/orders for {self.iso_date}")

    def tearDown(self):
        self.db.close()

    def test_1_district_availability_granularity(self):
        print("\n[DISTRICT] Verifying 30-min slot granularity...")
        response = self.district_adapter.check_availability(
            facility_name=self.branch.name,
            sport_name=self.sport.name,
            booking_date_str=self.test_date
        )
        # Should have up to 48 slots
        self.assertTrue(len(response["slot_data"]) > 0)
        
        # Check if slots are 30 mins apart (e.g. 10:00 - 10:30)
        first_slot = response["slot_data"][0]
        time_str = first_slot["slot_time"] # "08:00 - 08:30"
        print(f"   Sample slot: {time_str}")
        self.assertTrue(" - " in time_str)
        t1, t2 = time_str.split(" - ")
        h1, m1 = map(int, t1.split(":"))
        h2, m2 = map(int, t2.split(":"))
        diff = (h2*60 + m2) - (h1*60 + m1)
        self.assertEqual(diff, 30, f"Slot duration should be 30 mins, got {diff}")
        print("✅ District 30-min slots verified.")

    def test_2_district_1hr_minimum_enforcement(self):
        print("\n[DISTRICT] Verifying 1-hour minimum requirement...")
        
        # A. Try booking only 1 slot (30 mins)
        payload_fail = schemas_district.DistrictBatchBookingRequest(
            id=str(uuid.uuid4()),
            apiKey="test",
            facilityName=self.branch.name,
            sportName=self.sport.name,
            userName="Test", userPhone="1234567890",
            slots=[schemas_district.DistrictSlotRule(date=self.test_date, slotNumber=20, courtNumber=0)]
        )
        
        try:
            self.district_adapter.make_batch_booking(payload_fail, batch_id="fail-test")
            self.fail("Should have raised ValueError for 30-min booking")
        except ValueError as e:
            self.assertIn("Minimum booking duration is 1 hour", str(e))
            print("   Correctly rejected 30-min booking.")

        # B. Try booking 2 slots (1 hour)
        payload_pass = schemas_district.DistrictBatchBookingRequest(
            id=str(uuid.uuid4()),
            apiKey="test",
            facilityName=self.branch.name,
            sportName=self.sport.name,
            userName="Test", userPhone="1234567890",
            slots=[
                schemas_district.DistrictSlotRule(date=self.test_date, slotNumber=22, courtNumber=0),
                schemas_district.DistrictSlotRule(date=self.test_date, slotNumber=23, courtNumber=0)
            ]
        )
        resp = self.district_adapter.make_batch_booking(payload_pass, batch_id="pass-test")
        self.assertEqual(len(resp["bookings"]), 2)
        print("   Correctly accepted 1-hour booking.")
        print("✅ District 1-hour minimum verified.")

    def test_3_playo_1hr_minimum_enforcement(self):
        print("\n[PLAYO] Verifying 1-hour minimum requirement...")
        headers = {"X-API-Key": self.playo_key_raw}
        
        # A. Try order creation with 30 mins (1 slot)
        payload_fail = {
            "venueId": str(self.branch.id),
            "userName": "Playo User", "userMobile": "8888888888", "userEmail": "playo@test.com",
            "orders": [{
                "date": self.iso_date,
                "courtId": str(self.court.id),
                "startTime": "12:00:00",
                "endTime": "12:30:00",
                "playoOrderId": "p-fail-1",
                "price": 300, "paidAtPlayo": 300
            }]
        }
        
        resp = client.post("/api/playo/orders", headers=headers, json=payload_fail)
        self.assertEqual(resp.status_code, 200) # Playo returns 200 with requestStatus=0
        data = resp.json()
        self.assertEqual(data["requestStatus"], 0)
        self.assertIn("Minimum booking duration is 1 hour", data["message"])
        print("   Correctly rejected Playo 30-min order.")

        # B. Try order creation with 1 hour (2 slots or 1 block)
        payload_pass = {
            "venueId": str(self.branch.id),
            "userName": "Playo User", "userMobile": "8888888888", "userEmail": "playo@test.com",
            "orders": [{
                "date": self.iso_date,
                "courtId": str(self.court.id),
                "startTime": "14:00:00",
                "endTime": "15:00:00",
                "playoOrderId": "p-pass-1",
                "price": 600, "paidAtPlayo": 600
            }]
        }
        resp = client.post("/api/playo/orders", headers=headers, json=payload_pass)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["requestStatus"], 1, f"Failed: {data.get('message')}")
        print("   Correctly accepted Playo 1-hour order.")
        print("✅ Playo 1-hour minimum verified.")

if __name__ == "__main__":
    unittest.main()
