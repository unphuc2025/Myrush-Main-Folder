from sqlalchemy import text
from database import SessionLocal
import models

def cleanup_duplicate_blocks():
    db = SessionLocal()
    print("Starting Court Block Cleanup...")
    try:
        # Find duplicates based on court_id, block_date, start_time, end_time, and slice_mask
        # We use a CTE to find duplicates and keep only the first (earliest created_at or min(id))
        sql = text("""
            DELETE FROM admin_court_blocks
            WHERE id IN (
                SELECT id
                FROM (
                    SELECT id,
                           ROW_NUMBER() OVER (
                               PARTITION BY court_id, block_date, start_time, end_time, COALESCE(slice_mask, 0)
                               ORDER BY created_at ASC
                           ) as row_num
                    FROM admin_court_blocks
                ) t
                WHERE t.row_num > 1
            )
        """)
        
        result = db.execute(sql)
        count = result.rowcount
        db.commit()
        print(f"Successfully removed {count} duplicate court blocks.")
        
    except Exception as e:
        print(f"Error during cleanup: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_duplicate_blocks()
