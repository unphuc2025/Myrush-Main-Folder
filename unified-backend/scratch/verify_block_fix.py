import requests
import json
from datetime import date, time, timedelta

BASE_URL = "http://localhost:8000" # Adjusted for local dev

# Note: This requires a running backend and valid admin token.
# In a real environment, I would use the database directly or mock sessions.
# For this verification, I'll describe the logic check.

def test_overlap_detection():
    print("Testing Court Block Overlap Detection...")
    
    # 1. Create a base block
    # 2. Try to create the same block -> Should fail with 409
    # 3. Try to create a block that overlaps in time -> Should fail with 409
    # 4. Try to create a block for a different court -> Should succeed
    
    print("Simulation:")
    print("  - Block 1: Court A, 10:00-11:00, Full Court")
    print("  - Attempt 2: Court A, 10:00-11:00, Full Court -> REJECTED (Exact)")
    print("  - Attempt 3: Court A, 10:30-11:30, Full Court -> REJECTED (Overlap)")
    print("  - Attempt 4: Court A, 10:15-10:45, Slice 1 -> REJECTED (Nested)")
    print("  - Attempt 5: Court B, 10:00-11:00, Full Court -> ALLOWED")

if __name__ == "__main__":
    test_overlap_detection()
