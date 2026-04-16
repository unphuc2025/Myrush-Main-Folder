from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from database import get_db
from typing import Optional, List, Dict, Any
from functools import lru_cache
import json

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot Knowledge"])

# ============================================================================
# CACHING LAYER
# ============================================================================

@lru_cache(maxsize=1)
def get_cached_knowledge_base(db: Session):
    """Cache frequently accessed static data"""
    try:
        # Get cities
        cities_query = text("""
            SELECT id, name, short_code 
            FROM admin_cities 
            WHERE is_active = true
            ORDER BY name
        """)
        cities = [{
            'id': str(row[0]),
            'name': row[1],
            'short_code': row[2]
        } for row in db.execute(cities_query)]

        # Get game types
        game_types_query = text("""
            SELECT id, name, short_code, description, icon_url 
            FROM admin_game_types 
            WHERE is_active = true
            ORDER BY name
        """)
        game_types = [{
            'id': str(row[0]),
            'name': row[1],
            'short_code': row[2],
            'description': row[3],
            'icon_url': row[4]
        } for row in db.execute(game_types_query)]

        # Get amenities
        amenities_query = text("""
            SELECT id, name, description, icon_url 
            FROM admin_amenities 
            WHERE is_active = true
            ORDER BY name
        """)
        amenities = [{
            'id': str(row[0]),
            'name': row[1],
            'description': row[2],
            'icon_url': row[3]
        } for row in db.execute(amenities_query)]

        # Count active venues
        venue_count_query = text("""
            SELECT COUNT(DISTINCT b.id) 
            FROM admin_branches b
            WHERE b.is_active = true
        """)
        venue_count = db.execute(venue_count_query).scalar()

        return {
            'cities': cities,
            'game_types': game_types,
            'amenities': amenities,
            'venue_count': venue_count,
            'city_count': len(cities)
        }
    except Exception as e:
        print(f"[CHATBOT] Error caching knowledge base: {e}")
        return {
            'cities': [],
            'game_types': [],
            'amenities': [],
            'venue_count': 0,
            'city_count': 0
        }

# ============================================================================
# KNOWLEDGE BASE ENDPOINTS
# ============================================================================

@router.get("/knowledge/base")
async def get_knowledge_base(db: Session = Depends(get_db)):
    """
    Get complete knowledge base for chatbot initialization.
    Includes cities, sports, amenities, and platform stats.
    """
    try:
        knowledge = get_cached_knowledge_base(db).copy()
        
        # Include Global Policies for Bot context (Cancellation, Terms, etc.)
        policies = []
        try:
            # Use named columns for clarity
            policies_query = text("SELECT type, value, content FROM admin_cancellations_terms WHERE is_active = true")
            result = db.execute(policies_query).fetchall()
            for row in result:
                p_type = str(row.type) if row.type else "unknown"
                p_val = row.value if row.value else row.content
                if p_val:
                    policies.append({p_type: p_val})
        except Exception as poly_err:
            print(f"[CHATBOT API] Warning: Could not fetch policies: {poly_err}")
            
        # Add a hardcoded GST entry fallback
        policies.append({"gst": "18.0"})
        
        knowledge['policies'] = policies
        return {
            "success": True,
            "data": knowledge
        }
    except Exception as e:
        print(f"[CHATBOT API] Error in knowledge base: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/knowledge/cities")
async def get_cities(db: Session = Depends(get_db)):
    """Get all active cities with areas"""
    try:
        query = text("""
            SELECT 
                c.id,
                c.name,
                c.short_code,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', a.id,
                            'name', a.name
                        ) ORDER BY a.name
                    ) FILTER (WHERE a.id IS NOT NULL),
                    '[]'
                ) as areas
            FROM admin_cities c
            LEFT JOIN admin_areas a ON a.city_id = c.id AND a.is_active = true
            WHERE c.is_active = true
            GROUP BY c.id, c.name, c.short_code
            ORDER BY c.name
        """)
        
        result = db.execute(query)
        cities = [{
            'id': str(row[0]),
            'name': row[1],
            'short_code': row[2],
            'areas': row[3] if isinstance(row[3], list) else json.loads(row[3]) if row[3] else []
        } for row in result]
        
        return {"success": True, "data": cities}
    except Exception as e:
        print(f"[CHATBOT API] Error getting cities: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/knowledge/game-types")
async def get_game_types(db: Session = Depends(get_db)):
    """Get all active game types/sports"""
    try:
        query = text("""
            SELECT id, name, short_code, description, icon, icon_url
            FROM admin_game_types
            WHERE is_active = true
            ORDER BY name
        """)
        
        result = db.execute(query)
        game_types = [{
            'id': str(row[0]),
            'name': row[1],
            'short_code': row[2],
            'description': row[3],
            'icon': row[4],
            'icon_url': row[5]
        } for row in result]
        
        return {"success": True, "data": game_types}
    except Exception as e:
        print(f"[CHATBOT API] Error getting game types: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/knowledge/amenities")
async def get_amenities(db: Session = Depends(get_db)):
    """Get all active amenities"""
    try:
        query = text("""
            SELECT id, name, description, icon, icon_url
            FROM admin_amenities
            WHERE is_active = true
            ORDER BY name
        """)
        
        result = db.execute(query)
        amenities = [{
            'id': str(row[0]),
            'name': row[1],
            'description': row[2],
            'icon': row[3],
            'icon_url': row[4]
        } for row in result]
        
        return {"success": True, "data": amenities}
    except Exception as e:
        print(f"[CHATBOT API] Error getting amenities: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/knowledge/venues")
async def get_all_venues_summary(db: Session = Depends(get_db)):
    """
    Get summary of all active venues for chatbot context.
    Returns lightweight venue data for quick reference.
    """
    try:
        query = text("""
            SELECT 
                b.id,
                b.name,
                c.name as city_name,
                a.name as area_name,
                b.address_line1,
                b.search_location,
                b.phone_number,
                b.google_map_url,
                b.max_players,
                COALESCE(
                    (SELECT json_agg(DISTINCT gt.name)
                     FROM admin_branch_game_types bgt
                     JOIN admin_game_types gt ON gt.id = bgt.game_type_id
                     WHERE bgt.branch_id = b.id),
                    '[]'
                ) as game_types,
                COALESCE(
                    (SELECT json_agg(am.name)
                     FROM admin_branch_amenities ba
                     JOIN admin_amenities am ON am.id = ba.amenity_id
                     WHERE ba.branch_id = b.id),
                    '[]'
                ) as amenities,
                b.images,
                b.opening_hours
            FROM admin_branches b
            LEFT JOIN admin_cities c ON c.id = b.city_id
            LEFT JOIN admin_areas a ON a.id = b.area_id
            WHERE b.is_active = true
            ORDER BY c.name, b.name
        """)
        
        result = db.execute(query)
        venues = []
        
        for row in result:
            game_types = row[9] if isinstance(row[9], list) else json.loads(row[9]) if row[9] else []
            amenities = row[10] if isinstance(row[10], list) else json.loads(row[10]) if row[10] else []
            images = row[11] if isinstance(row[11], list) else json.loads(row[11]) if row[11] else []
            opening_hours = row[12] if isinstance(row[12], dict) else json.loads(row[12]) if row[12] else {}
            
            venues.append({
                'id': str(row[0]),
                'name': row[1],
                'city': row[2],
                'area': row[3],
                'address': row[4],
                'location': row[5],
                'phone': row[6],
                'google_map_url': row[7],
                'max_players': row[8],
                'game_types': game_types,
                'amenities': amenities,
                'image_url': images[0] if images else None,
                'opening_hours': opening_hours
            })
        
        return {"success": True, "data": venues, "count": len(venues)}
    except Exception as e:
        print(f"[CHATBOT API] Error getting venues summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/context/venue/{venue_id}")
async def get_venue_detailed_context(venue_id: str, db: Session = Depends(get_db)):
    """
    Get comprehensive venue details for chatbot context.
    Includes full descriptions, pricing info, rules, terms, and reviews.
    """
    try:
        venue_query = text("""
            SELECT 
                b.id,
                b.name,
                c.name as city_name,
                a.name as area_name,
                b.address_line1,
                b.address_line2,
                b.landmark,
                b.search_location,
                b.phone_number,
                b.email,
                b.google_map_url,
                b.ground_overview,
                b.terms_condition,
                b.rule,
                b.max_players,
                b.images,
                b.videos,
                b.opening_hours,
                COALESCE(
                    (SELECT json_agg(
                        json_build_object(
                            'id', gt.id,
                            'name', gt.name,
                            'description', gt.description
                        )
                    )
                     FROM admin_branch_game_types bgt
                     JOIN admin_game_types gt ON gt.id = bgt.game_type_id
                     WHERE bgt.branch_id = b.id),
                    '[]'
                ) as game_types,
                COALESCE(
                    (SELECT json_agg(
                        json_build_object(
                            'id', am.id,
                            'name', am.name,
                            'description', am.description
                        )
                    )
                     FROM admin_branch_amenities ba
                     JOIN admin_amenities am ON am.id = ba.amenity_id
                     WHERE ba.branch_id = b.id),
                    '[]'
                ) as amenities
            FROM admin_branches b
            LEFT JOIN admin_cities c ON c.id = b.city_id
            LEFT JOIN admin_areas a ON a.id = b.area_id
            WHERE b.id = :venue_id AND b.is_active = true
        """)
        
        result = db.execute(venue_query, {"venue_id": venue_id}).first()
        
        if not result:
            raise HTTPException(status_code=404, detail="Venue not found")
        
        # Get courts and their zones (SportSlices) for this venue
        courts_query = text("""
            SELECT 
                c.id,
                c.name,
                c.price_per_hour,
                c.logic_type,
                c.capacity_limit,
                c.total_zones,
                c.shared_group_id,
                gt.name as game_type,
                COALESCE(
                    (SELECT json_agg(
                        json_build_object(
                            'id', ss.id,
                            'name', ss.name,
                            'mask', ss.mask,
                            'price_per_hour', ss.price_per_hour
                        )
                    )
                     FROM admin_sport_slices ss
                     WHERE ss.court_id = c.id),
                    '[]'
                ) as slices
            FROM admin_courts c
            JOIN admin_game_types gt ON gt.id = c.game_type_id
            WHERE c.branch_id = :venue_id AND c.is_active = true
            ORDER BY c.name
        """)
        
        courts_result = db.execute(courts_query, {"venue_id": venue_id}).fetchall()
        courts = []
        for row in courts_result:
            try:
                slices = row.slices if isinstance(row.slices, list) else json.loads(row.slices) if row.slices else []
            except: slices = []
            
            courts.append({
                'id': str(row.id),
                'name': row.name,
                'price': float(row.price_per_hour) if row.price_per_hour else None,
                'logic_type': row.logic_type,
                'capacity_limit': row.capacity_limit,
                'total_zones': row.total_zones,
                'shared_group_id': str(row.shared_group_id) if row.shared_group_id else None,
                'game_type': row.game_type,
                'slices': slices
            })
        
        # Parse JSON fields with safer checks
        def safe_json(val, default=[]):
            if isinstance(val, (list, dict)): return val
            try: return json.loads(val) if val else default
            except: return default

        game_types = safe_json(result.game_types)
        amenities = safe_json(result.amenities)
        images = safe_json(result.images)
        videos = safe_json(result.videos)
        opening_hours = safe_json(result.opening_hours, default={})
        
        venue = {
            'id': str(result.id),
            'name': result.name,
            'city': result.city_name,
            'area': result.area_name,
            'address_line1': result.address_line1,
            'address_line2': result.address_line2,
            'landmark': result.landmark,
            'location': result.search_location,
            'phone': result.phone_number,
            'email': result.email,
            'google_map_url': result.google_map_url,
            'overview': result.ground_overview,
            'terms': result.terms_condition,
            'rules': result.rule,
            'max_players': result.max_players,
            'images': images,
            'videos': videos,
            'opening_hours': opening_hours,
            'game_types': game_types,
            'amenities': amenities,
            'courts': courts,
            'price_range': {
                'min': min([c['price'] for c in courts if c['price']]) if courts and any(c['price'] for c in courts) else None,
                'max': max([c['price'] for c in courts if c['price']]) if courts and any(c['price'] for c in courts) else None
            }
        }
        
        return {"success": True, "data": venue}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[CHATBOT API] Error getting venue context: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/booking/calculate")
async def calculate_chatbot_price(
    data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Calculate the total price for a booking draft.
    Expected data: {venue_id, court_id, date, slot_times: [], number_of_players, slice_mask}
    Returns: {base_price, tax, total, breakdown}
    """
    try:
        from routers.user.payments import calculate_authoritative_price
        from datetime import datetime
        
        venue_id = data.get('venueId') or data.get('venue_id')
        court_id = data.get('courtId') or data.get('court_id')
        booking_date_str = data.get('date')
        # Support both slot_times and time_slots (standard booking schema)
        slot_list = data.get('slot_times') or data.get('time_slots') or []
        num_players = int(data.get('number_of_players') or data.get('num_players') or 1)
        slice_mask = data.get('slice_mask')
        
        if not (court_id and booking_date_str and slot_list):
            raise HTTPException(status_code=400, detail="Missing required parameters: court_id, date, slot_times")
        
        # Convert date string to date object
        booking_date = datetime.strptime(booking_date_str, "%Y-%m-%d").date()
        
        # Format slots for the calculation utility
        requested_slots = []
        for s in slot_list:
            if isinstance(s, dict):
                requested_slots.append(s)
            else:
                requested_slots.append({"time": str(s)})
        
        # Authoritative Price Calculation using the same logic as payments.py
        base_amount = calculate_authoritative_price(
            db, 
            court_id, 
            booking_date, 
            requested_slots, 
            num_players,
            slice_mask
        )
        
        # 2. Add GST (fetch from policies or fallback to 18%)
        gst_query = text("SELECT value FROM admin_cancellations_terms WHERE type = 'gst' AND is_active = true")
        gst_row = db.execute(gst_query).first()
        gst_percent = float(gst_row[0]) if (gst_row and gst_row[0]) else 18.0
        
        tax_amount = (base_amount * gst_percent) / 100
        total_amount = base_amount + tax_amount
        
        return {
            "success": True,
            "data": {
                "base_price": round(base_amount, 2),
                "tax": round(tax_amount, 2),
                "total": round(total_amount, 2),
                "currency": "INR",
                "gst_percent": gst_percent,
                "is_capacity_based": num_players > 1 if num_players > 1 else False # simplified
            }
        }
    except Exception as e:
        print(f"[CHATBOT API] Error calculating price: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Normalized sport name mapping for chatbot search
SPORT_SYNONYMS = {
    "pool": "Swimming",
    "swimming pool": "Swimming",
    "turf": "FootBall",
    "football turf": "FootBall",
    "cricket turf": "Cricket",
    "cricket nets": "Nets",
    "badminton court": "Badminton",
    "shuttle": "Badminton",
    "table tennis": "Table tennis",
    "tt": "Table tennis",
    "padel": "Padel",
    "skating": "Skating",
    "squash": "Squash"
}

def normalize_sport_name(sport: str) -> str:
    """Map common user terms to official game_type names"""
    if not sport: return sport
    s = sport.lower().strip()
    return SPORT_SYNONYMS.get(s, sport)

@router.get("/search/venues")
async def search_venues_smart(
    city: Optional[str] = Query(None),
    sport: Optional[str] = Query(None),
    area: Optional[str] = Query(None),
    amenity: Optional[str] = Query(None),
    price_max: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Smart venue search with multiple filters.
    Uses fuzzy matching (LIKE) for broad results.
    """
    try:
        # Normalize inputs
        sport = normalize_sport_name(sport)
        
        conditions = ["b.is_active = true"]
        params = {}
        
        if city:
            conditions.append("c.name ILIKE :city")
            params['city'] = f"%{city}%"
        
        if area:
            conditions.append("a.name ILIKE :area")
            params['area'] = f"%{area}%"
        
        if sport:
            conditions.append("""
                EXISTS (
                    SELECT 1 FROM admin_branch_game_types bgt_f
                    JOIN admin_game_types gt_f ON gt_f.id = bgt_f.game_type_id
                    WHERE bgt_f.branch_id = b.id AND gt_f.name ILIKE :sport AND gt_f.is_active = true
                )
            """)
            params['sport'] = f"%{sport}%"
            
        if amenity:
            conditions.append("""
                EXISTS (
                    SELECT 1 FROM admin_branch_amenities ba_f
                    JOIN admin_amenities am_f ON am_f.id = ba_f.amenity_id
                    WHERE ba_f.branch_id = b.id AND am_f.name ILIKE :amenity AND am_f.is_active = true
                )
            """)
            params['amenity'] = f"%{amenity}%"

        query_str = f"""
            SELECT
                b.id,
                b.name,
                COALESCE(c.name, 'Unknown City') as city_name,
                COALESCE(a.name, 'Other') as area_name,
                b.address_line1,
                b.search_location,
                b.google_map_url,
                b.images,
                b.max_players,
                COALESCE(
                    (SELECT json_agg(DISTINCT gt.name)
                     FROM admin_branch_game_types bgt
                     JOIN admin_game_types gt ON gt.id = bgt.game_type_id
                     WHERE bgt.branch_id = b.id AND gt.is_active = true),
                    '[]'::json
                ) as game_types,
                COALESCE(
                    (SELECT json_agg(am.name)
                     FROM admin_branch_amenities ba
                     JOIN admin_amenities am ON am.id = ba.amenity_id
                     WHERE ba.branch_id = b.id AND am.is_active = true),
                    '[]'::json
                ) as amenities,
                (SELECT MIN(price_per_hour) FROM admin_courts WHERE branch_id = b.id AND is_active = true) as min_price,
                (SELECT MAX(price_per_hour) FROM admin_courts WHERE branch_id = b.id AND is_active = true) as max_price
            FROM admin_branches b
            LEFT JOIN admin_cities c ON c.id = b.city_id
            LEFT JOIN admin_areas a ON a.id = b.area_id
            WHERE {' AND '.join(conditions)}
            ORDER BY b.name
        """
        
        result = db.execute(text(query_str), params).fetchall()
        venues = []
        seen_ids = set()
        
        for row in result:
            venue_id = str(row.id)
            if venue_id in seen_ids:
                continue
            seen_ids.add(venue_id)
            
            # Robust price range handling
            min_price = float(row.min_price) if row.min_price is not None else None
            max_price = float(row.max_price) if row.max_price is not None else None
            
            # Apply price filter if specified
            if price_max and min_price is not None and min_price > price_max:
                continue
            
            # Safe JSON parsing for fields
            try:
                game_types = row.game_types if isinstance(row.game_types, list) else json.loads(row.game_types) if row.game_types else []
            except: game_types = []
            
            try:
                amenities = row.amenities if isinstance(row.amenities, list) else json.loads(row.amenities) if row.amenities else []
            except: amenities = []
            
            try:
                images = row.images if isinstance(row.images, list) else json.loads(row.images) if row.images else []
            except: images = []
            
            venues.append({
                'id': venue_id,
                'name': row.name,
                'city': row.city_name,
                'area': row.area_name,
                'address': row.address_line1,
                'location': row.search_location,
                'google_map_url': row.google_map_url,
                'image_url': images[0] if images else None,
                'max_players': row.max_players,
                'game_types': game_types,
                'amenities': amenities,
                'price_range': {
                    'min': min_price,
                    'max': max_price
                }
            })
        
        return {
            "success": True,
            "data": venues
        }
    except Exception as e:
        print(f"[CHATBOT API] Error searching venues: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/booking/{display_id}")
async def get_booking_details(display_id: str, db: Session = Depends(get_db)):
    """
    Look up booking details and venue location by booking display ID.
    Used by chatbot to help users find their court location.
    """
    try:
        query = text("""
            SELECT 
                b.booking_display_id,
                b.booking_date,
                b.status,
                b.payment_status,
                br.name as venue_name,
                br.address_line1,
                br.address_line2,
                br.landmark,
                br.area_id,
                br.city_id,
                br.google_map_url,
                c.name as city_name,
                a.name as area_name,
                cr.name as court_name
            FROM booking b
            JOIN admin_courts cr ON cr.id = b.court_id
            JOIN admin_branches br ON br.id = cr.branch_id
            JOIN admin_cities c ON c.id = br.city_id
            JOIN admin_areas a ON a.id = br.area_id
            WHERE b.booking_display_id = :display_id
        """)
        
        result = db.execute(query, {"display_id": display_id}).first()
        
        if not result:
            return {
                "success": False,
                "message": "Booking not found. Please check the ID and try again."
            }
        
        booking_info = {
            "booking_id": result[0],
            "date": str(result[1]),
            "status": result[2],
            "payment_status": result[3],
            "venue_name": result[4],
            "address": f"{result[5]}, {result[6]}" if result[6] else result[5],
            "landmark": result[7],
            "google_map_url": result[10],
            "city": result[11],
            "area": result[12],
            "court_name": result[13]
        }
        
        return {
            "success": True,
            "data": booking_info
        }
    except Exception as e:
        print(f"[CHATBOT API] Error looking up booking: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/knowledge/faqs")
async def get_faqs():
    """Get common FAQs for chatbot context"""
    faqs = [
        {
            "category": "Booking",
            "question": "How do I book a court?",
            "answer": "You can book a court by selecting your city, sport, and venue, then choosing a date and time slot. Payment is required to confirm the booking."
        },
        {
            "category": "Cancellation",
            "question": "What is the cancellation policy?",
            "answer": "Free cancellation if done 24+ hours before the slot. 50% refund for cancellations between 12-24 hours. No refund for cancellations within 12 hours."
        },
        {
            "category": "Payment",
            "question": "What payment methods are accepted?",
            "answer": "We accept UPI, Credit/Debit Cards, Net Banking, and Wallets."
        },
        {
            "category": "Amenities",
            "question": "Do you provide equipment?",
            "answer": "Most venues offer equipment rental (rackets, balls, bibs) for a small fee. Check individual venue details."
        },
        {
            "category": "Membership",
            "question": "Are there membership plans?",
            "answer": "Currently, we operate on a pay-per-play basis. Membership plans are coming soon!"
        },
        {
            "category": "Support",
            "question": "How do I contact support?",
            "answer": "You can email us at support@myrush.in or call +91 9876543210 (9 AM - 9 PM)."
        },
        {
            "category": "Rain Policy",
            "question": "What if it rains during my outdoor booking?",
            "answer": "For outdoor sports, if rain disrupts play, we offer a credit refund or rescheduling options. Please contact the venue manager immediately."
        }
    ]
    return {"success": True, "data": faqs}
