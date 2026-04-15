from database import SessionLocal
import models
import traceback

db = SessionLocal()
try:
    print("Testing models.CourtUnit access...")
    # This should fail if the model is missing
    units = db.query(models.CourtUnit).all()
    print(f"Units: {len(units)}")
except Exception as e:
    print(f"Error accessing models.CourtUnit: {e}")
    # traceback.print_exc()

try:
    print("\nTesting models.DivisionMode access...")
    modes = db.query(models.DivisionMode).all()
    print(f"Modes: {len(modes)}")
except Exception as e:
    print(f"Error accessing models.DivisionMode: {e}")

db.close()
