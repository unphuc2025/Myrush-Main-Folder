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
        knowledge = get_cached_knowledge_base(db)
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
            JOIN admin_cities c ON c.id = b.city_id
            JOIN admin_areas a ON a.id = b.area_id
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
            JOIN admin_cities c ON c.id = b.city_id
            JOIN admin_areas a ON a.id = b.area_id
            WHERE b.id = :venue_id AND b.is_active = true
        """)
        
        result = db.execute(venue_query, {"venue_id": venue_id}).first()
        
        if not result:
            raise HTTPException(status_code=404, detail="Venue not found")
        
        # Get courts and pricing for this venue
        courts_query = text("""
            SELECT 
                court_name,
                game_type,
                price,
                opening_time,
                closing_time
            FROM admin_courts
            WHERE branch_id = :venue_id AND is_active = true
            ORDER BY court_name
        """)
        
        courts_result = db.execute(courts_query, {"venue_id": venue_id})
        courts = [{
            'name': row[0],
            'game_type': row[1],
            'price': float(row[2]) if row[2] else None,
            'opening_time': str(row[3]) if row[3] else None,
            'closing_time': str(row[4]) if row[4] else None
        } for row in courts_result]
        
        # Parse JSON fields
        game_types = result[18] if isinstance(result[18], list) else json.loads(result[18]) if result[18] else []
        amenities = result[19] if isinstance(result[19], list) else json.loads(result[19]) if result[19] else []
        images = result[15] if isinstance(result[15], list) else json.loads(result[15]) if result[15] else []
        videos = result[16] if isinstance(result[16], list) else json.loads(result[16]) if result[16] else []
        opening_hours = result[17] if isinstance(result[17], dict) else json.loads(result[17]) if result[17] else {}
        
        venue = {
            'id': str(result[0]),
            'name': result[1],
            'city': result[2],
            'area': result[3],
            'address_line1': result[4],
            'address_line2': result[5],
            'landmark': result[6],
            'location': result[7],
            'phone': result[8],
            'email': result[9],
            'google_map_url': result[10],
            'overview': result[11],
            'terms': result[12],
            'rules': result[13],
            'max_players': result[14],
            'images': images,
            'videos': videos,
            'opening_hours': opening_hours,
            'game_types': game_types,
            'amenities': amenities,
            'courts': courts,
            'price_range': {
                'min': min([c['price'] for c in courts if c['price']]) if courts else None,
                'max': max([c['price'] for c in courts if c['price']]) if courts else None
            }
        }
        
        return {"success": True, "data": venue}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[CHATBOT API] Error getting venue context: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
    Returns venues matching the criteria, sorted by relevance.
    """
    try:
        conditions = ["b.is_active = true"]
        params = {}
        
        if city:
            conditions.append("LOWER(c.name) = LOWER(:city)")
            params['city'] = city
        
        if area:
            conditions.append("LOWER(a.name) = LOWER(:area)")
            params['area'] = area
        
        query_str = f"""
            SELECT
                b.id,
                b.name,
                c.name as city_name,
                a.name as area_name,
                b.address_line1,
                b.search_location,
                b.google_map_url,
                b.images,
                b.max_players,
                COALESCE(
                    (SELECT json_agg(DISTINCT gt.name)
                     FROM admin_branch_game_types bgt
                     JOIN admin_game_types gt ON gt.id = bgt.game_type_id
                     WHERE bgt.branch_id = b.id),
                    '[]'::json
                ) as game_types,
                COALESCE(
                    (SELECT json_agg(am.name)
                     FROM admin_branch_amenities ba
                     JOIN admin_amenities am ON am.id = ba.amenity_id
                     WHERE ba.branch_id = b.id),
                    '[]'::json
                ) as amenities,
                NULL as min_price,
                NULL as max_price
            FROM admin_branches b
            JOIN admin_cities c ON c.id = b.city_id
            JOIN admin_areas a ON a.id = b.area_id
        """
        
        # Add sport filter via join
        if sport:
            query_str += """
                JOIN admin_branch_game_types bgt ON bgt.branch_id = b.id
                JOIN admin_game_types gt ON gt.id = bgt.game_type_id
            """
            conditions.append("LOWER(gt.name) = LOWER(:sport)")
            params['sport'] = sport
        
        # Add amenity filter via join
        if amenity:
            query_str += """
                JOIN admin_branch_amenities ba ON ba.branch_id = b.id
                JOIN admin_amenities am ON am.id = ba.amenity_id
            """
            conditions.append("LOWER(am.name) LIKE LOWER(:amenity)")
            params['amenity'] = f"%{amenity}%"
        
        query_str += f" WHERE {' AND '.join(conditions)} ORDER BY b.name"
        
        result = db.execute(text(query_str), params)
        venues = []
        seen_ids = set()
        
        for row in result:
            venue_id = str(row[0])
            if venue_id in seen_ids:
                continue
            seen_ids.add(venue_id)
            
            min_price = float(row[11]) if row[11] else None
            max_price = float(row[12]) if row[12] else None
            
            # Apply price filter if specified
            if price_max and min_price and min_price > price_max:
                continue
            
            game_types = row[9] if isinstance(row[9], list) else json.loads(row[9]) if row[9] else []
            amenities = row[10] if isinstance(row[10], list) else json.loads(row[10]) if row[10] else []
            images = row[7] if isinstance(row[7], list) else json.loads(row[7]) if row[7] else []
            
            venues.append({
                'id': venue_id,
                'name': row[1],
                'city': row[2],
                'area': row[3],
                'address': row[4],
                'location': row[5],
                'google_map_url': row[6],
                'image_url': images[0] if images else None,
                'max_players': row[8],
                'game_types': game_types,
                'amenities': amenities,
                'price_range': {
                    'min': min_price,
                    'max': max_price
                }
            })
        
        return {"success": True, "data": venues, "count": len(venues)}
    except Exception as e:
        print(f"[CHATBOT API] Error searching venues: {e}")
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
