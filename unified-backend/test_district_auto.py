import sys
import os
import unittest
from datetime import datetime, timedelta
import uuid

# Add the current directory to path
sys.path.append(os.getcwd())

from sqlalchemy.orm import Session
from database import SessionLocal
import models
from services.integrations.district_adapter import DistrictAdapter
import schemas_district

class TestDistrictIntegration(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()
        # Find a test branch that actually has courts
        self.court = self.db.query(models.Court).filter(models.Court.is_active == True).first()
        self.branch = self.court.branch
        self.sport = self.court.game_type
        
        print(f"\n[SETUP] Using Branch: {self.branch.name} (ID: {self.branch.id})")
        print(f"[SETUP] Using Court: {self.court.name} (ID: {self.court.id})")
        print(f"[SETUP] Using Sport: {self.sport.name} (ID: {self.sport.id})")
        
        # Inject temporary availability for testing
        from sqlalchemy.orm.attributes import flag_modified
        
        self.original_conditions = self.court.price_conditions
        self.test_date = (datetime.utcnow() + timedelta(days=2)).strftime('%d-%m-%Y')
        
        test_condition = {
            'id': f'test-recurring-{uuid.uuid4().hex[:6]}',
            'type': 'recurring',
            'days': ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
            'slotFrom': '05:00',
            'slotTo': '23:00',
            'price': '100.00'
        }
        
        if not self.court.price_conditions:
            self.court.price_conditions = [test_condition]
        else:
            self.court.price_conditions.append(test_condition)
        
        flag_modified(self.court, "price_conditions")
        self.db.commit()
        self.db.refresh(self.court)
        
        # Ensure we have a partner record for the UUID foreign key
        partner = self.db.query(models.Partner).filter(models.Partner.name == "District").first()
        if not partner:
            partner = models.Partner(
                name="District",
                api_key="test-key",
                webhook_url="http://test.local",
                is_active=True
            )
            self.db.add(partner)
            self.db.commit()
            self.db.refresh(partner)
        
        self.partner = partner
        self.adapter = DistrictAdapter(self.db, str(partner.id), skip_notifications=True)

    def tearDown(self):
        # Restore original conditions
        self.court.price_conditions = self.original_conditions
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(self.court, "price_conditions")
        self.db.commit()
        self.db.close()

    def test_district_end_to_end(self):
        print(f"\n[1] Testing Availability (ISO Format) for {self.branch.name}...")
        
        response = self.adapter.check_availability(
            facility_name=self.branch.name,
            sport_name=self.sport.name,
            booking_date_str=self.test_date
        )
        self.assertTrue(len(response["slot_data"]) > 0, "No slots found!")
        first_slot = response["slot_data"][0]
        self.assertIn("slotNumber", first_slot)
        self.assertIn("slot_time", first_slot)
        # Check ISO format (e.g., '05:00 - 05:30')
        self.assertTrue("-" in first_slot["slot_time"])
        self.assertTrue(":" in first_slot["slot_time"])
        
        first_court = first_slot["courts"][0]
        self.assertIn("courtNumber", first_court)
        self.assertIn("capacity", first_court)
        self.assertIn("available", first_court)
        
        print(f"✅ Availability OK. First Slot: {first_slot['slot_time']}, Court 0 Mapping: {first_court['court_name']}")

        print("\n[2] Testing Batch Booking & Detailed Response...")
        payload = schemas_district.DistrictBatchBookingRequest(
            id="unique-id",
            apiKey="api-key",
            facilityName=self.branch.name,
            sportName=self.sport.name,
            userName="Auto Test Bot",
            userPhone="9999999999",
            slots=[
                schemas_district.DistrictSlotRule(
                    date=self.test_date,
                    slotNumber=20, # 10:00
                    courtNumber=0 
                ),
                schemas_district.DistrictSlotRule(
                    date=self.test_date,
                    slotNumber=21, # 10:30
                    courtNumber=0 
                )
            ]
        )
        
        batch_id_to_use = f"test-batch-{uuid.uuid4().hex[:6]}"
        book_resp = self.adapter.make_batch_booking(payload, batch_id=batch_id_to_use)
        self.assertIn("bookings", book_resp)
        self.assertEqual(len(book_resp["bookings"]), 2)
        b_detail = book_resp["bookings"][0]
        self.assertEqual(b_detail["slotNumber"], 20)
        self.assertEqual(b_detail["facilityName"], self.branch.name)
        
        batch_id = book_resp["batchBookingId"]
        booking_id = b_detail["bookingId"]
        print(f"✅ Booking Success. Booking ID: {booking_id}")
        
        print(f"\n[3] Testing Booking Status (Individual ID)...")
        status_resp = self.adapter.get_booking_status(booking_id)
        self.assertEqual(status_resp["bookingId"], booking_id)
        self.assertEqual(status_resp["status"], "confirmed")
        print(f"✅ Status API OK. Status: {status_resp['status']}")

        print(f"\n[4] Testing Booking History (Facility Reconciliation)...")
        history_resp = self.adapter.get_booking_history(self.branch.name, self.test_date)
        self.assertTrue(history_resp["totalBookings"] >= 1)
        print(f"✅ History API OK. Total for {self.test_date}: {history_resp['totalBookings']}")

        print(f"\n[5] Testing Facility Discovery...")
        discovery_resp = self.adapter.get_facilities()
        self.assertTrue(len(discovery_resp) > 0)
        # Find current branch
        branch_info = next((b for b in discovery_resp if b["facilityName"] == self.branch.name), None)
        self.assertIsNotNone(branch_info)
        self.assertIn(self.sport.name, branch_info["sports"])
        print(f"✅ Discovery API OK. Found facility {self.branch.name} with sport {self.sport.name}")

        print(f"\n[6] Testing Cancellation for {booking_id}...")
        cancel_resp = self.adapter.cancel_booking(self.branch.name, booking_id)
        self.assertTrue(cancel_resp["cancellation_allowed"])
        self.assertEqual(cancel_resp["totalBookingsCancelled"], 1)
        print("✅ Cancellation OK.")

    def test_type_a_webhook(self):
        print(f"\n[7] Testing Type A (Recurring) Webhook Payload...")
        from services.integrations.orchestrator import IntegrationOrchestrator
        
        IntegrationOrchestrator.notify_recurring_change(
            db=self.db,
            court_id=str(self.court.id),
            day=1, # Monday
            slot_start=10.0, # 10:00
            action='update',
            price=150.0
        )
        
        outbox = self.db.query(models.OutboxEvent).filter(
            models.OutboxEvent.partner_id == self.partner.id
        ).order_by(models.OutboxEvent.created_at.desc()).first()
        
        if not outbox:
            # Print some debug info
            all_events = self.db.query(models.OutboxEvent).all()
            print(f"[DEBUG] Total Outbox Events: {len(all_events)}")
            for e in all_events:
                print(f"[DEBUG] Event Partner: {e.partner_id}, Expected: {self.partner.id}")
            self.assertIsNotNone(outbox, "Outbox event not found!")

        self.assertEqual(outbox.payload['action'], 'update')
        print(f"✅ Type A Webhook OK.")

if __name__ == "__main__":
    unittest.main()
