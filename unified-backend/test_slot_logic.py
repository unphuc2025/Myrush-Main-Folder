
import unittest
from unittest.mock import MagicMock, patch
from datetime import date, time
import json
import sys
import os

# Add current directory to path so we can import models and utils
sys.path.append(os.getcwd())

from utils.booking_utils import get_venue_hours, generate_allowed_slots_map, safe_parse_hour

class TestSlotLogic(unittest.TestCase):

    def test_safe_parse_hour(self):
        self.assertEqual(safe_parse_hour("08:00"), 8)
        self.assertEqual(safe_parse_hour("22:00"), 22)
        self.assertEqual(safe_parse_hour("10:00 PM"), 22)
        self.assertEqual(safe_parse_hour("12:00 AM"), 0)
        self.assertEqual(safe_parse_hour("12:00 PM"), 12)
        self.assertEqual(safe_parse_hour("23:59"), 23)

    def test_get_venue_hours_basic(self):
        opening_hours = {
            "monday": {"isActive": True, "startTime": "08:00", "endTime": "22:00"},
            "tuesday": {"isActive": True, "startTime": "06:00", "endTime": "23:00"},
            "wednesday": {"isActive": False}
        }
        
        # Monday (2026-02-23 is a Monday)
        d_mon = date(2026, 2, 23)
        self.assertEqual(get_venue_hours(opening_hours, d_mon), (8, 22))
        
        # Tuesday
        d_tue = date(2026, 2, 24)
        self.assertEqual(get_venue_hours(opening_hours, d_tue), (6, 23))
        
        # Wednesday (Closed)
        d_wed = date(2026, 2, 25)
        self.assertEqual(get_venue_hours(opening_hours, d_wed), (0, 0))

    def test_get_venue_hours_24h_variants(self):
        # 00:00 to 00:00 should be treated as 24h
        self.assertEqual(get_venue_hours({"monday": {"isActive": True, "startTime": "00:00", "endTime": "00:00"}}, date(2026, 2, 23)), (0, 24))
        # 12:00 AM to 12:00 AM variant
        self.assertEqual(get_venue_hours({"monday": {"isActive": True, "startTime": "12:00 AM", "endTime": "12:00 AM"}}, date(2026, 2, 23)), (0, 24))
        # Missing keys with isActive: True
        self.assertEqual(get_venue_hours({"monday": {"isActive": True}}, date(2026, 2, 23)), (0, 24))

    def test_get_venue_hours_nulls(self):
        # If keys are present but null
        opening_hours = {"monday": {"isActive": True, "startTime": None, "endTime": None}}
        self.assertEqual(get_venue_hours(opening_hours, date(2026, 2, 23)), (0, 24))

    def test_get_venue_hours_list_format(self):
        # Handle list format
        opening_hours = [{"day": "monday", "isActive": True, "startTime": "09:00", "endTime": "18:00"}]
        self.assertEqual(get_venue_hours(opening_hours, date(2026, 2, 23)), (9, 18))

    def test_get_venue_hours_string_bool(self):
        opening_hours = {"monday": {"isActive": "false"}}
        self.assertEqual(get_venue_hours(opening_hours, date(2026, 2, 23)), (0, 0))

    @patch('utils.booking_utils.get_now_ist')
    @patch('sqlalchemy.orm.Session')
    def test_validate_booking_rules_past_slot(self, mock_db, mock_now):
        from crud import validate_booking_rules
        from datetime import datetime
        
        # Set "Now" to 10:40 AM
        mock_now.return_value = datetime(2026, 2, 23, 10, 40)
        d_today = date(2026, 2, 23)
        
        # In STRICT ADMIN-DEFINED MODEL, we NO LONGER reject past slots automatically.
        # So both 09:00 and 10:00 should PASS validation here (availability check happens elsewhere)
        
        try:
            validate_booking_rules(mock_db, 'c1', d_today, time(9, 0), time(10, 0), 'u1')
            validate_booking_rules(mock_db, 'c1', d_today, time(10, 0), time(11, 0), 'u1')
        except Exception as e:
            self.fail(f"Past slots should now pass validation! Error: {e}")

    @patch('sqlalchemy.orm.Session')
    def test_validate_booking_rules_overlap(self, mock_db):
        from crud import validate_booking_rules
        import models
        
        # Mock an existing booking at 10:00
        mock_booking = MagicMock(spec=models.Booking)
        mock_booking.booking_date = date(2026, 2, 23)
        mock_booking.status = 'confirmed'
        mock_booking.time_slots = [{"start_time": "10:00", "end_time": "11:00"}]
        
        mock_db.query().filter().all.return_value = [mock_booking]
        
        # Try to book 10:00 (Should FAIL)
        from fastapi import HTTPException
        with self.assertRaises(HTTPException) as cm:
            validate_booking_rules(mock_db, 'c1', date(2026, 2, 23), time(10, 0), time(11, 0), 'u1')
        self.assertEqual(cm.exception.status_code, 409)

        # Try to book 11:00 (Should PASS)
        # We don't care about the return value for 11:00 since it won't be in the booked_hours
        try:
            validate_booking_rules(mock_db, 'c1', date(2026, 2, 23), time(11, 0), time(12, 0), 'u1')
        except Exception as e:
            self.fail(f"Adjacent slot should pass! Error: {e}")

    @patch('sqlalchemy.orm.Session')
    def test_generate_allowed_slots_map_strict(self, mock_db):
        import models
        from utils.booking_utils import generate_allowed_slots_map
        
        # 1. Setup Mock Court with Rules
        mock_court = MagicMock(spec=models.Court)
        mock_court.id = 'c1'
        mock_court.price_per_hour = 100.0
        mock_court.price_conditions = [
            {'dates': ['2026-02-23'], 'slotFrom': '10:00', 'slotTo': '12:00', 'price': 150.0}, # Date match
            {'days': ['mon'], 'slotFrom': '18:00', 'slotTo': '20:00', 'price': 120.0} # Day match
        ]
        mock_court.unavailability_slots = [
            {'dates': ['2026-02-23'], 'times': ['11:00']} # Block 11AM
        ]
        
        mock_db.query().filter().first.return_value = mock_court
        
        # Mock Global Rules (Empty)
        mock_db.query().filter().all.return_value = []
        
        # 2. Test for Monday 2026-02-23
        d_mon = date(2026, 2, 23)
        slots = generate_allowed_slots_map(mock_db, 'c1', d_mon)
        
        # Expected: 
        # 10:00 -> Allowed (Price 150)
        # 11:00 -> Blocked (Should NOT be in map since I changed logic to only add if not blocked)
        # 18:00 & 19:00 -> Allowed (Price 120) from Recurring Rule
        # 09:00 -> NOT allowed (No rule)
        
        self.assertIn("10:00", slots)
        self.assertEqual(slots["10:00"]["price"], 150.0)
        self.assertNotIn("11:00", slots) # Logic now excludes blocked slots from map
        self.assertIn("18:00", slots)
        self.assertIn("19:00", slots)
        self.assertEqual(slots["18:00"]["price"], 120.0)
        self.assertNotIn("09:00", slots) # STRICT MODE check: No rule for 09:00
        
    @patch('sqlalchemy.orm.Session')
    def test_generate_allowed_slots_map_global(self, mock_db):
        import models
        from utils.booking_utils import generate_allowed_slots_map
        
        # 1. Mock Court with NO rules
        mock_court = MagicMock(spec=models.Court)
        mock_court.id = 'c1'
        mock_court.price_per_hour = 100.0
        mock_court.price_conditions = []
        mock_court.unavailability_slots = []
        
        # 2. Mock Global Rule
        mock_global = MagicMock(spec=models.GlobalPriceCondition)
        mock_global.days = ['monday', 'tuesday']
        mock_global.dates = []
        mock_global.slot_from = '08:00'
        mock_global.slot_to = '10:00'
        mock_global.price = 90.0
        mock_global.is_active = True
        
        # DB Query handles: first() for court, all() for global rules
        def db_query_side_effect(*args, **kwargs):
            m_query = MagicMock()
            if args[0] == models.Court:
                m_query.filter().first.return_value = mock_court
            elif args[0] == models.GlobalPriceCondition:
                m_query.filter().all.return_value = [mock_global]
            return m_query
            
        mock_db.query.side_effect = db_query_side_effect
        
        # Test
        d_mon = date(2026, 2, 23)
        slots = generate_allowed_slots_map(mock_db, 'c1', d_mon)
        
        self.assertIn("08:00", slots)
        self.assertIn("09:00", slots)
        self.assertEqual(slots["08:00"]["price"], 90.0)
        self.assertNotIn("07:00", slots)

if __name__ == '__main__':
    unittest.main()
