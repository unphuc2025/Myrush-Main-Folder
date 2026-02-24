
import sys
import os
import json
from datetime import date

# Add current directory to path
sys.path.append(os.getcwd())

from utils.booking_utils import safe_parse_hour, get_booked_hours

def test_safe_parse_hour():
    print("--- Testing safe_parse_hour ---")
    test_cases = [
        ("09:00", 9),
        ("09:00 AM", 9),
        ("09:00 PM", 21),
        ("21:00", 21),
        ("12:00 PM", 12),
        ("12:00 AM", 0),
        ("00:00", 0),
        (" 11:30 PM ", 23),
        ("07:00:00", 7),
    ]
    
    passed = 0
    for inp, expected in test_cases:
        result = safe_parse_hour(inp)
        if result == expected:
            print(f"PASS: '{inp}' -> {result}")
            passed += 1
        else:
            print(f"FAIL: '{inp}' -> {result} (Expected {expected})")
            
    print(f"Passed {passed}/{len(test_cases)} cases.")
    return passed == len(test_cases)

def test_booked_hours_logic():
    print("\n--- Testing get_booked_hours logic ---")
    
    class MockBooking:
        def __init__(self, time_slots):
            self.time_slots = time_slots
            self.id = "mock-id"
    
    # 9 PM booking
    mock_b = MockBooking([{"start_time": "09:00 PM", "price": 200}])
    booked = get_booked_hours([mock_b])
    
    print(f"Booked hours from '09:00 PM': {booked}")
    
    # Check if 9 AM is in booked (it should NOT be)
    if 9 in booked:
        print("FAIL: 9 AM (hour 9) incorrectly identified as booked for a 9 PM booking.")
        return False
    elif 21 in booked:
        print("PASS: 9 PM (hour 21) correctly identified as booked.")
        return True
    else:
        print("FAIL: 9 PM booking not recognized.")
        return False

if __name__ == "__main__":
    s1 = test_safe_parse_hour()
    s2 = test_booked_hours_logic()
    
    if s1 and s2:
        print("\nALL VERIFICATIONS PASSED!")
    else:
        print("\nVERIFICATION FAILED!")
        sys.exit(1)
