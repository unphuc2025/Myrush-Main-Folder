import sys
import os
from sqlalchemy import text

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from database import engine
except ImportError:
    print("Error: Could not import 'database'.")
    sys.exit(1)

def test_fetch():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT id, name, location_url FROM admin_branches LIMIT 1;"))
            row = result.fetchone()
            if row:
                print(f"✅ Successfully fetched branch: {row[1]} with location_url: {row[2]}")
            else:
                print("ℹ️ No branches found in admin_branches table.")
    except Exception as e:
        print(f"❌ Fetch failed: {e}")

if __name__ == "__main__":
    test_fetch()
