#!/usr/bin/env python3
"""
Script to find valid venue and court IDs from the database
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'unified-backend'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Branch, Court, GameType
from database import get_db
import uuid

def find_venue_court_ids():
    """Find valid venue and court IDs from the database"""
    
    print("🔍 Finding valid venue and court IDs from database")
    print("=" * 60)
    
    try:
        # Get database session
        db = next(get_db())
        
        # Find all active branches (venues)
        print("\n🏢 Available Venues (Branches):")
        print("-" * 40)
        branches = db.query(Branch).filter(Branch.is_active == True).all()
        
        if not branches:
            print("❌ No active venues found in database")
            return
        
        for branch in branches:
            print(f"Venue ID: {branch.id}")
            print(f"  Name: {branch.name}")
            print(f"  City: {branch.city.name if branch.city else 'Unknown'}")
            print(f"  Area: {branch.area.name if branch.area else 'Unknown'}")
            print()
            
            # Find courts for this branch
            courts = db.query(Court).filter(
                Court.branch_id == branch.id,
                Court.is_active == True
            ).all()
            
            if courts:
                print(f"  🎾 Courts for {branch.name}:")
                for court in courts:
                    game_type = db.query(GameType).filter(GameType.id == court.game_type_id).first()
                    print(f"    Court ID: {court.id}")
                    print(f"      Name: {court.name}")
                    print(f"      Game Type: {game_type.name if game_type else 'Unknown'}")
                    print(f"      Price: ₹{court.price_per_hour}")
                    print()
            else:
                print(f"  ❌ No courts found for {branch.name}")
            print()
        
        print("💡 Use these IDs in your Playo Booking Create API requests:")
        print("   - venueId: Use the Branch ID")
        print("   - courtId: Use the Court ID")
        print("   - Ensure the court belongs to the specified venue")
        
    except Exception as e:
        print(f"❌ Error accessing database: {e}")
        print("💡 Make sure your database is running and accessible")
    
    finally:
        try:
            db.close()
        except:
            pass

if __name__ == "__main__":
    find_venue_court_ids()