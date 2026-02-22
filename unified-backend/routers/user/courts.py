from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
import models, database, json
from date_utils import parse_date_safe

router = APIRouter(
    prefix="/courts",
    tags=["courts"]
)

@router.get("/")
def get_courts(
    city: Optional[str] = None,
    game_type: Optional[str] = None,
    location: Optional[str] = None,
    branch_id: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    """
    Fetch courts from admin_courts table filtered by city and game type.
    Includes average ratings, review counts, branch opening hours and detailed amenities.
    """
    try:
        # Query from admin_courts with joins to get city, game type, and amenities info
        # Added subqueries for rating and reviews
        query_sql = """
            SELECT
                ac.id,
                ac.name as court_name,
                ac.price_per_hour as prices,
                ac.images as photos,
                ac.videos,
                ac.terms_and_conditions,
                ac.amenities as court_amenity_ids,
                ac.created_at,
                ac.updated_at,
                ab.name as branch_name,
                ab.address_line1 as location,
                ab.search_location as description,
                ab.opening_hours,
                ab.terms_condition as branch_terms,
                ab.ground_overview,
                ab.google_map_url,
                acity.name as city_name,
                agt.name as game_type,
                (SELECT COUNT(*) FROM booking b WHERE b.court_id = ac.id AND b.status = 'confirmed') as games_played,
                (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews r WHERE r.court_id = ac.id AND r.is_active = true) as average_rating,
                (SELECT COUNT(*) FROM reviews r WHERE r.court_id = ac.id AND r.is_active = true) as total_reviews
            FROM admin_courts ac
            JOIN admin_branches ab ON ac.branch_id = ab.id
            JOIN admin_cities acity ON ab.city_id = acity.id
            JOIN admin_game_types agt ON ac.game_type_id = agt.id
        """

        params = {}
        where_conditions = ["ac.is_active = true"]

        # Filter by city OR location
        if city or location:
            city_filter = city or location
            city_filter = city_filter.strip()
            where_conditions.append("LOWER(acity.name) = LOWER(:city)")
            params['city'] = city_filter

        if branch_id:
            where_conditions.append("ac.branch_id = :branch_id")
            params['branch_id'] = branch_id

        # Filter by game type
        if game_type and game_type != "undefined":
            if isinstance(game_type, list):
                # Handle array of game types
                placeholders = ','.join([f":game_type_{i}" for i in range(len(game_type))])
                where_conditions.append(f"agt.name IN ({placeholders})")
                for i, gt in enumerate(game_type):
                    params[f'game_type_{i}'] = gt.strip()
            else:
                where_conditions.append("agt.name ILIKE :game_type")
                params['game_type'] = f"%{game_type}%"

        # RE-APPLY where conditions to the SQL because I replaced the join logic
        if len(where_conditions) > 1:
            query_sql = query_sql.replace("JOIN admin_game_types agt ON ac.game_type_id = agt.id", 
                                       "JOIN admin_game_types agt ON ac.game_type_id = agt.id WHERE " + " AND ".join(where_conditions), 1)
        elif len(where_conditions) == 1:
            query_sql += " WHERE " + where_conditions[0]

        result_proxy = db.execute(text(query_sql), params)
        courts = result_proxy.fetchall()
        
        # Pre-fetch all active amenities for mapping
        all_amenities = db.query(models.Amenity).filter(models.Amenity.is_active == True).all()
        amenity_map = {str(a.id): {
            "id": str(a.id),
            "name": a.name,
            "description": a.description,
            "icon": a.icon,
            "icon_url": a.icon_url
        } for a in all_amenities}
        
        # Convert to dict format
        result = []
        for court in courts:
            court_dict = dict(court._mapping)
            
            # Map amenity IDs to objects
            ids = court_dict.get('court_amenity_ids') or []
            detailed_amenities = []
            if isinstance(ids, list):
                for aid in ids:
                    if aid in amenity_map:
                        detailed_amenities.append(amenity_map[aid])

            result.append({
                "id": str(court_dict['id']),
                "court_name": court_dict.get('court_name', ''),
                "location": f"{court_dict.get('location', '')}, {court_dict.get('city_name', '')}",
                "game_type": court_dict.get('game_type', ''),
                "prices": str(court_dict.get('prices', '0')),
                "description": court_dict.get('description', '') or court_dict.get('ground_overview', '') or f"{court_dict.get('branch_name', '')} - {court_dict.get('game_type', '')} Court",
                "terms_condition": court_dict.get('terms_and_conditions') or court_dict.get('branch_terms') or '',
                "amenities": detailed_amenities,
                "photos": court_dict.get('photos') or [],
                "videos": court_dict.get('videos') or [],
                "rating": float(court_dict.get('average_rating') or 0),
                "reviews": int(court_dict.get('total_reviews') or 0),
                "opening_hours": court_dict.get('opening_hours') or {},
                "google_map_url": court_dict.get('google_map_url', ''),
                "branch_name": court_dict.get('branch_name', ''),
                "city_name": court_dict.get('city_name', ''),
                "games_played": court_dict.get('games_played', 0)
            })
        
        return result
    except Exception as e:
        print(f"[COURTS API] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{court_id}")
def get_court(court_id: str, db: Session = Depends(database.get_db)):
    """Get a single court by ID with rich details"""
    try:
        query_sql = """
            SELECT
                ac.id,
                ac.name as court_name,
                ac.price_per_hour as prices,
                ac.images as photos,
                ac.videos,
                ac.terms_and_conditions,
                ac.amenities as court_amenity_ids,
                ac.created_at,
                ac.updated_at,
                ab.name as branch_name,
                ab.address_line1 as location,
                ab.search_location as description,
                ab.opening_hours,
                ab.terms_condition as branch_terms,
                ab.ground_overview,
                ab.google_map_url,
                acity.name as city_name,
                agt.name as game_type,
                (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews r WHERE r.court_id = ac.id AND r.is_active = true) as average_rating,
                (SELECT COUNT(*) FROM reviews r WHERE r.court_id = ac.id AND r.is_active = true) as total_reviews
            FROM admin_courts ac
            JOIN admin_branches ab ON ac.branch_id = ab.id
            JOIN admin_cities acity ON ab.city_id = acity.id
            JOIN admin_game_types agt ON ac.game_type_id = agt.id
            WHERE ac.id = :court_id
        """
        
        result_proxy = db.execute(text(query_sql), {"court_id": court_id})
        court_res = result_proxy.fetchone()
        
        if not court_res:
            raise HTTPException(status_code=404, detail="Court not found")
        
        court_dict = dict(court_res._mapping)
        
        # Map amenity IDs to objects
        all_amenities = db.query(models.Amenity).filter(models.Amenity.is_active == True).all()
        amenity_map = {str(a.id): {
            "id": str(a.id),
            "name": a.name,
            "description": a.description,
            "icon": a.icon,
            "icon_url": a.icon_url
        } for a in all_amenities}
        
        ids = court_dict.get('court_amenity_ids') or []
        detailed_amenities = []
        if isinstance(ids, list):
            for aid in ids:
                if aid in amenity_map:
                    detailed_amenities.append(amenity_map[aid])

        return {
            "id": str(court_dict['id']),
            "court_name": court_dict.get('court_name', ''),
            "location": f"{court_dict.get('location', '')}, {court_dict.get('city_name', '')}",
            "game_type": court_dict.get('game_type', ''),
            "prices": str(court_dict.get('prices', '0')),
            "description": court_dict.get('description', '') or court_dict.get('ground_overview', '') or f"{court_dict.get('branch_name', '')} - {court_dict.get('game_type', '')} Court",
            "terms_condition": court_dict.get('terms_and_conditions') or court_dict.get('branch_terms') or '',
            "amenities": detailed_amenities,
            "photos": court_dict.get('photos') or [],
            "videos": court_dict.get('videos') or [],
            "rating": float(court_dict.get('average_rating') or 0),
            "reviews": int(court_dict.get('total_reviews') or 0),
            "opening_hours": court_dict.get('opening_hours') or {},
            "google_map_url": court_dict.get('google_map_url', ''),
            "created_at": court_dict['created_at'].isoformat() if court_dict.get('created_at') else None,
            "updated_at": court_dict['updated_at'].isoformat() if court_dict.get('updated_at') else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[COURTS API] Error getting court: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{court_id}/available-slots")
def get_available_slots(
    court_id: str,
    date: str,  # Format: YYYY-MM-DD
    db: Session = Depends(database.get_db)
):
    """
    Get available time slots for a specific court on a specific date.
    Returns slots based on venue opening hours and price conditions.
    """
    try:
        from datetime import datetime
        from date_utils import parse_date_safe
        from utils.booking_utils import generate_allowed_slots_map, get_booked_hours, get_now_ist, safe_parse_hour
        
        print(f"[COURTS API] Fetching slots for court={court_id}, date={date}")
        
        # 1. Parse Date
        try:
            booking_date = parse_date_safe(date, "%Y-%m-%d", "date")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid date format: {e}")

        # 2. Generate Authoritative Allowed Slots (Venue Hours + Pricing + Admin Blocks)
        allowed_slots_map = generate_allowed_slots_map(db, court_id, booking_date)
        
        if not allowed_slots_map:
            return {"court_id": court_id, "date": date, "slots": [], "message": "Venue is closed or not configured."}

        # 3. Fetch Active Bookings to find occupied slots
        active_bookings = db.query(models.Booking).filter(
            models.Booking.court_id == court_id,
            models.Booking.booking_date == booking_date,
            models.Booking.status != 'cancelled'
        ).all()
        
        booked_hours = get_booked_hours(active_bookings)
        
        # 4. Filter and Format Output
        all_slots = []
        now_ist = get_now_ist()
        is_today = (booking_date == now_ist.date())

        for h_str, details in sorted(allowed_slots_map.items()):
            # Extract hour int for business logic checks
            h = safe_parse_hour(h_str)
            
            # --- Past Slot filtering removed as per strict admin-defined model requirements ---
            # if is_today and h < now_ist.hour:
            #      continue
            # if is_today and h == now_ist.hour and now_ist.minute > 45: 
            #     continue
            
            # Skip Admin Blocked slots
            if details['is_blocked']: continue
            
            # Skip already booked slots
            if h in booked_hours: continue

            # Format time for display (12-hour format)
            sh_disp = h if h <= 12 else h - 12
            if sh_disp == 0: sh_disp = 12
            ampm_s = "AM" if h < 12 else "PM"
            
            h_end = (h + 1) % 24
            eh_disp = h_end if h_end <= 12 else h_end - 12
            if eh_disp == 0: eh_disp = 12
            ampm_e = "AM" if h_end < 12 else "PM"

            all_slots.append({
                "time": h_str,
                "display_time": f"{sh_disp:02d}:00 {ampm_s} - {eh_disp:02d}:00 {ampm_e}",
                "price": details['price'],
                "available": True,
                "slot_id": f"slot_{h_str.replace(':', '')}" # Synthetic ID
            })

        return {"court_id": court_id, "date": date, "slots": all_slots}

    except HTTPException as he: raise he
    except Exception as e:
        print(f"[COURTS API] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


    except HTTPException as he: raise he
    except Exception as e:
        print(f"[COURTS API] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

