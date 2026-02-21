from sqlalchemy import text
from database import engine
import json

def test_get_venue(venue_id):
    with engine.connect() as conn:
        print(f"\n--- Testing get_venue for ID: {venue_id} ---")
        
        # 1. Branch Query
        branch_query = """
            SELECT 
                ab.id,
                ab.name as branch_name,
                ab.address_line1 as location,
                acity.name as city_name,
                ab.images,
                ab.ground_overview,
                ab.search_location,
                ab.google_map_url,
                ab.terms_condition,
                ab.rule,
                ab.created_at,
                ab.updated_at
            FROM admin_branches ab
            LEFT JOIN admin_cities acity ON ab.city_id = acity.id
            WHERE ab.id = :venue_id
        """
        
        result = conn.execute(text(branch_query), {"venue_id": venue_id}).first()
        if result:
            print("Found in admin_branches")
            b = dict(result._mapping)
            print(f"Name: {b['branch_name']}")
            print(f"Terms: {b['terms_condition']}")
            print(f"Rule: {b['rule']}")
            
            # 2. Amenities Query
            amenities_query = """
                SELECT aa.id, aa.name, aa.icon, aa.icon_url
                FROM admin_amenities aa
                JOIN admin_branch_amenities aba ON aa.id = aba.amenity_id
                WHERE aba.branch_id = :branch_id AND aa.is_active = true
            """
            am_res = conn.execute(text(amenities_query), {"branch_id": venue_id}).fetchall()
            print(f"Amenities Count: {len(am_res)}")
            for am in am_res:
                print(f"  - {am.name}")
        else:
            print("NOT found in admin_branches")

if __name__ == "__main__":
    # Test with the ID we found earlier
    test_get_venue("76704fa8-b7bc-4f30-92e7-6c65b1395fa2")
