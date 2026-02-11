import sys
import os
from sqlalchemy import text

# Add current directory to path so we can import 'database'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from database import engine
except ImportError:
    print("Error: Could not import 'database'. Make sure you are running this script from the 'unified-backend' directory.")
    sys.exit(1)

def add_columns():
    print(f"Connecting to database...")
    try:
        with engine.connect() as conn:
            print("Checking/Adding razorpay columns to booking table...")
            
            # Add razorpay_order_id
            try:
                # Check if column exists first (PostgreSQL specific way is cleaner but expensive, 
                # catch error method is generic enough for this quick fix)
                # Or use IF NOT EXISTS syntax if supported (Postgres 9.6+ supports IF NOT EXISTS on ADD COLUMN)
                conn.execute(text("ALTER TABLE booking ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255);"))
                print("✅ Added/Verified razorpay_order_id")
            except Exception as e:
                print(f"⚠️ Error adding razorpay_order_id: {e}")

            # Add razorpay_signature
            try:
                conn.execute(text("ALTER TABLE booking ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(500);"))
                print("✅ Added/Verified razorpay_signature")
            except Exception as e:
                 print(f"⚠️ Error adding razorpay_signature: {e}")
            
            conn.commit()
            print("🎉 Database migration completed successfully.")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")

if __name__ == "__main__":
    add_columns()
