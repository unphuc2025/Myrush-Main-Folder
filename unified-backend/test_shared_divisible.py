import os
import sys
from datetime import date, time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import models
import crud

# Add current directory to path to import models
sys.path.append(os.getcwd())

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_shared_divisible_logic():
    db = SessionLocal()
    try:
        print("--- START TEST ---")
        # 1. Setup minimal objects
        branch = db.query(models.Branch).first()
        gt = db.query(models.GameType).first()
        
        # Create a shared group
        sg = models.SharedGroup(name="BLOCK TEST GROUP", branch_id=branch.id)
        db.add(sg)
        db.flush()
        
        # Create two courts
        c1 = models.Court(name="F-Turf", branch_id=branch.id, game_type_id=gt.id, logic_type="divisible", shared_group_id=sg.id, price_per_hour=1000)
        c2 = models.Court(name="C-Turf", branch_id=branch.id, game_type_id=gt.id, logic_type="divisible", shared_group_id=sg.id, price_per_hour=1000)
        db.add_all([c1, c2])
        db.flush()
        
        # Add units using model objects
        u1 = models.CourtUnit(court_id=c1.id, name="T1")
        u2 = models.CourtUnit(court_id=c2.id, name="T1")
        db.add_all([u1, u2])
        db.flush()
        
        # Add modes
        m1 = models.DivisionMode(court_id=c1.id, name="Mode-F")
        m2 = models.DivisionMode(court_id=c2.id, name="Mode-C")
        db.add_all([m1, m2])
        db.flush()
        
        # Association
        db.execute(models.DivisionModeUnit.__table__.insert().values(mode_id=m1.id, unit_id=u1.id))
        db.execute(models.DivisionModeUnit.__table__.insert().values(mode_id=m2.id, unit_id=u2.id))
        
        # Commit setup
        db.commit()
        print(f"Setup Complete. Group: {sg.id}")
        
        # --- TEST CROSS BLOCKING ---
        test_date = date(2025, 1, 1)
        start_t = time(12, 0)
        end_t = time(13, 0)
        user_id = str(db.query(models.User).first().id)
        
        # Create booking on C1
        print("Creating booking on F-Turf (Unit T1)...")
        b1 = models.Booking(
            user_id=user_id, court_id=c1.id, booking_date=test_date, 
            start_time=start_t, end_time=end_t, division_mode_id=m1.id, status="confirmed",
            price_per_hour=1000, total_amount=1000
        )
        db.add(b1)
        db.commit()
        
        # Attempt booking on C2 (shares unit name T1)
        print("Attempting overlapping booking on C-Turf (also uses T1)...")
        try:
            crud.validate_booking_rules(
                db=db, court_id=c2.id, booking_date=test_date, 
                start_time=start_t, end_time=end_t, user_id="system_test", division_mode_id=m2.id
            )
            print("FAILED: Cross-blocking NOT working!")
        except Exception as e:
            if hasattr(e, 'detail') and "Conflict: Units T1" in e.detail:
                print(f"PASSED: Cross-blocking works! Error: {e.detail}")
            else:
                print(f"ERROR: Unexpected block error: {e}")

    except Exception as ex:
        print(f"Test Run Error: {ex}")
        import traceback
        traceback.print_exc()
    finally:
        # Cleanup
        print("Cleaning up...")
        try:
            db.delete(b1)
            db.execute(models.DivisionModeUnit.__table__.delete().where(models.DivisionModeUnit.mode_id.in_([m1.id, m2.id])))
            db.delete(c1)
            db.delete(c2)
            db.delete(sg)
            db.commit()
        except:
            pass
        db.close()

if __name__ == "__main__":
    test_shared_divisible_logic()
