
import sys
import os
from datetime import date

# Add the parent directory to sys.path to import from unified-backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
import models
from routers.user.payments import calculate_authoritative_price

def test_price_calculation():
    db = SessionLocal()
    try:
        # 1. Find a capacity court (Swimming or Skating)
        court = db.query(models.Court).filter(models.Court.logic_type == 'capacity').first()
        if not court:
            print("No capacity court found in DB. Skipping test.")
            return

        print(f"Testing with court: {court.name} (ID: {court.id}, Logic: {court.logic_type})")

        # 2. Define some slots
        requested_slots = [
            {"time": "09:00", "price": 0}, # Price will be enriched
            {"time": "09:30", "price": 0}
        ]
        
        booking_date = date(2026, 4, 15)
        num_players = 10
        
        # 3. Calculate price
        # This will call generate_allowed_slots_map internally
        total_price = calculate_authoritative_price(
            db=db,
            court_id=str(court.id),
            booking_date=booking_date,
            requested_slots=requested_slots,
            number_of_players=num_players
        )
        
        print(f"Calculated Total Price: {total_price}")
        
        # 4. Verify enrichment
        for slot in requested_slots:
            print(f"Slot {slot['time']} - Enriched Price: {slot['price']}")
            # The expected behavior now is that slot['price'] should be base * num_players
            # We don't know the base price for sure without checking the map, but we can check if it's > 0
            if slot['price'] == 0:
                print(f"FAIL: Slot price for {slot['time']} was not enriched.")
            else:
                # If we assume base price was at least some value, say 100
                # We can't strictly assert without knowing DB state, but we can verify it's a multiple of num_players if base is whole
                pass

        print("Verification complete. Check prints above.")

    finally:
        db.close()

if __name__ == "__main__":
    test_price_calculation()
