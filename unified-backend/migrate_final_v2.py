import os
import sys
import traceback
from sqlalchemy import text

# Add current directory to path
sys.path.append(os.getcwd())

from database import engine

def migrate_final_v2():
    print("Starting database schema repair v2...")
    try:
        with engine.connect() as conn:
            # Add columns to admin_shared_groups
            print("Repairing admin_shared_groups...")
            conn.execute(text("ALTER TABLE admin_shared_groups ADD COLUMN IF NOT EXISTS branch_id UUID;"))
            
            # Add foreign key for shared groups if missing
            try:
                conn.execute(text("ALTER TABLE admin_shared_groups ADD CONSTRAINT fk_shared_group_branch FOREIGN KEY (branch_id) REFERENCES admin_branches(id);"))
                print("   - Added constraint fk_shared_group_branch")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print("   - Constraint fk_shared_group_branch already exists.")
                else:
                    print(f"   - Warn: Could not add constraint: {e}")
            
            # Ensure other tables are complete (re-run logic)
            # admin_court_units, admin_division_modes, admin_rental_items, etc.
            conn.execute(text("ALTER TABLE admin_court_units ADD COLUMN IF NOT EXISTS name VARCHAR(50);"))
            conn.execute(text("ALTER TABLE admin_division_modes ADD COLUMN IF NOT EXISTS name VARCHAR(255);"))
            conn.execute(text("ALTER TABLE admin_rental_items ADD COLUMN IF NOT EXISTS branch_id UUID;"))
            conn.execute(text("ALTER TABLE admin_rental_items ADD COLUMN IF NOT EXISTS name VARCHAR(255);"))
            conn.execute(text("ALTER TABLE admin_rental_items ADD COLUMN IF NOT EXISTS price_per_booking DECIMAL(10, 2);"))
            conn.execute(text("ALTER TABLE admin_rental_items ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;"))
            conn.execute(text("ALTER TABLE admin_facility_types ADD COLUMN IF NOT EXISTS name VARCHAR(255);"))
            conn.execute(text("ALTER TABLE admin_facility_types ADD COLUMN IF NOT EXISTS short_code VARCHAR(50);"))

            conn.commit()
            print("✅ Repair complete!")
                
    except Exception as e:
        print(f"❌ Repair failed: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    migrate_final_v2()
