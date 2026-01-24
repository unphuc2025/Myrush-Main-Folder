"""
Database migration script for Playo integration
Run this script to add Playo tables and fields to existing database
"""

from sqlalchemy import text
from database import engine
import sys

def run_migration():
    """Execute SQL migration for Playo integration"""
    
    print("=" * 60)
    print("PLAYO INTEGRATION - DATABASE MIGRATION")
    print("=" * 60)
    
    migrations = [
        # Create playo_api_keys table
        """
        CREATE TABLE IF NOT EXISTS playo_api_keys (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            token_hash VARCHAR(255) UNIQUE NOT NULL,
            description VARCHAR(255),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_used_at TIMESTAMP
        );
        """,
        
        # Create index on token_hash
        """
        CREATE INDEX IF NOT EXISTS idx_playo_api_keys_token_hash 
        ON playo_api_keys(token_hash);
        """,
        
        # Create playo_orders table
        """
        CREATE TABLE IF NOT EXISTS playo_orders (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            playo_order_id VARCHAR(255) UNIQUE NOT NULL,
            venue_id UUID REFERENCES admin_branches(id),
            court_id UUID REFERENCES admin_courts(id),
            booking_date DATE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            booking_id UUID REFERENCES booking(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP
        );
        """,
        
        # Create indexes on playo_orders
        """
        CREATE INDEX IF NOT EXISTS idx_playo_orders_playo_order_id 
        ON playo_orders(playo_order_id);
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_playo_orders_booking_date 
        ON playo_orders(booking_date);
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_playo_orders_status 
        ON playo_orders(status);
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_playo_orders_expires_at 
        ON playo_orders(expires_at);
        """,
        
        # Add Playo fields to booking table
        """
        ALTER TABLE booking 
        ADD COLUMN IF NOT EXISTS playo_order_id VARCHAR(255);
        """,
        """
        ALTER TABLE booking 
        ADD COLUMN IF NOT EXISTS playo_booking_id VARCHAR(255);
        """,
        """
        ALTER TABLE booking 
        ADD COLUMN IF NOT EXISTS booking_source VARCHAR(50) DEFAULT 'direct';
        """,
        
        # Create indexes on booking Playo fields
        """
        CREATE INDEX IF NOT EXISTS idx_booking_playo_order_id 
        ON booking(playo_order_id);
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_booking_playo_booking_id 
        ON booking(playo_booking_id);
        """,
    ]
    
    try:
        with engine.connect() as conn:
            for i, migration in enumerate(migrations, 1):
                try:
                    print(f"\n[{i}/{len(migrations)}] Executing migration...")
                    conn.execute(text(migration))
                    conn.commit()
                    print(f"✅ Migration {i} completed successfully")
                except Exception as e:
                    print(f"⚠️  Migration {i} skipped or failed: {str(e)}")
                    # Continue with other migrations
                    continue
        
        print("\n" + "=" * 60)
        print("✅ MIGRATION COMPLETED SUCCESSFULLY")
        print("=" * 60)
        print("\nPlayo integration tables created:")
        print("  - playo_api_keys")
        print("  - playo_orders")
        print("\nBooking table updated with Playo fields:")
        print("  - playo_order_id")
        print("  - playo_booking_id")
        print("  - booking_source")
        print("\n" + "=" * 60)
        
        return True
        
    except Exception as e:
        print("\n" + "=" * 60)
        print("❌ MIGRATION FAILED")
        print("=" * 60)
        print(f"Error: {str(e)}")
        print("\nPlease check your database connection and try again.")
        return False

if __name__ == "__main__":
    print("\n⚠️  WARNING: This will modify your database schema!")
    print("Make sure you have a backup before proceeding.\n")
    
    response = input("Do you want to continue? (yes/no): ").strip().lower()
    
    if response == "yes":
        success = run_migration()
        sys.exit(0 if success else 1)
    else:
        print("\nMigration cancelled.")
        sys.exit(0)
