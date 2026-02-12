import os
import sys
from sqlalchemy import text
from database import engine

def migrate_db():
    print("Starting database schema migration...")
    
    # List of new columns to add
    # Format: (column_name, column_type)
    new_columns = [
        ("terms_condition", "TEXT"),
        ("rule", "TEXT"),
        ("google_map_url", "TEXT"),
        ("max_players", "INTEGER"),
        ("phone_number", "VARCHAR(50)"),
        ("email", "VARCHAR(255)"),
        ("price", "DECIMAL(10, 2)") # Re-adding price as nullable just in case, though removed from UI
    ]

    with engine.connect() as connection:
        for col_name, col_type in new_columns:
            try:
                # Check if column exists
                check_sql = text(f"SELECT column_name FROM information_schema.columns WHERE table_name='admin_branches' AND column_name='{col_name}'")
                result = connection.execute(check_sql)
                if result.fetchone():
                    print(f"Column '{col_name}' already exists. Skipping.")
                else:
                    # Add column
                    print(f"Adding column '{col_name}'...")
                    alter_sql = text(f"ALTER TABLE admin_branches ADD COLUMN {col_name} {col_type}")
                    connection.execute(alter_sql)
                    print(f"Column '{col_name}' added successfully.")
            except Exception as e:
                print(f"Error adding column '{col_name}': {e}")
        
        connection.commit()
    
    print("Migration completed.")

if __name__ == "__main__":
    migrate_db()
