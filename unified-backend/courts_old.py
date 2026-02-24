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
    Returns slots based on admin configuration minus booked slots.
    """
    try:
        from datetime import datetime
        from date_utils import parse_date_safe
        
        # 1. Parse Date
        booking_date = parse_date_safe(date, "%Y-%m-%d", "date")
        day_of_week_full = booking_date.strftime("%A") 
        day_of_week_short = day_of_week_full[:3].lower()
        
        # 2. Get Court & Branch Details
        court_query = """
            SELECT ac.id, ac.price_per_hour, ac.price_conditions, ac.unavailability_slots, ab.opening_hours
            FROM admin_courts ac
            JOIN admin_branches ab ON ac.branch_id = ab.id
            WHERE ac.id = :court_id AND ac.is_active = true
        """
        court_res = db.execute(text(court_query), {"court_id": court_id}).first()
        
        if not court_res:
            raise HTTPException(status_code=404, detail="Court not found")

        court = dict(court_res._mapping)
        b_price = float(court['price_per_hour'])
        p_cond = court.get('price_conditions') or []
        un_slots = court.get('unavailability_slots') or []
        opening_hours = court.get('opening_hours') or {}

        # 3. Determine Operating Hours
        branch_is_active = True
        venue_start_hour = 8
        venue_end_hour = 22
        
        # Helper for JSON parsing
        def safe_json(val):
            if isinstance(val, str):
                try: return json.loads(val)
                except: return []
            return val or []

        p_cond = safe_json(court.get('price_conditions'))
        un_slots = safe_json(court.get('unavailability_slots'))
        opening_hours = safe_json(court.get('opening_hours'))

        if isinstance(opening_hours, dict):
            possible_keys = [day_of_week_full.lower(), day_of_week_full, day_of_week_short, day_of_week_short.title(), 'default']
            day_config = None
            for k in possible_keys:
                if k in opening_hours:
                    day_config = opening_hours[k]
                    break
            
            if day_config and isinstance(day_config, dict):
                start_str = day_config.get('open') or day_config.get('start') or '08:00'
                end_str = day_config.get('close') or day_config.get('end') or '22:00'
                if day_config.get('isActive') is False:
                    branch_is_active = False
                try:
                    venue_start_hour = int(start_str.split(':')[0])
                    venue_end_hour = int(end_str.split(':')[0])
                except: pass

        # 4. Generate & Override Slots
        court_slots = {} # hour(int) -> {price, id}
        
        # Only populate default slots if branch is active for this day
        if branch_is_active:
            # Handle overnight wrap-around (e.g., 9 PM to 2 AM)
            if venue_end_hour < venue_start_hour:
                for h in range(venue_start_hour, 24):
                    court_slots[h] = {'price': b_price, 'id': 'default'}
                for h in range(0, venue_end_hour):
                    court_slots[h] = {'price': b_price, 'id': 'default'}
            else:
                for h in range(venue_start_hour, venue_end_hour):
                    court_slots[h] = {'price': b_price, 'id': 'default'}
        else:
            print(f"[COURTS API] Venue is marked OFF on {day_of_week_full} ({date}), skipping default slots.")

        # Fetch Global Conditions
        global_conditions = db.query(models.GlobalPriceCondition).filter(models.GlobalPriceCondition.is_active == True).all()

        g_recurring, l_recurring, g_date, l_date = [], [], [], []
        for gc in global_conditions:
            match = False
            if gc.condition_type == 'date' and gc.dates and date in gc.dates: match = True
            elif gc.condition_type == 'recurring' and gc.days and (day_of_week_short in [d.lower()[:3] for d in gc.days] or day_of_week_full.lower() in [d.lower() for d in gc.days]): match = True
            if match:
                item = {'slotFrom': gc.slot_from, 'slotTo': gc.slot_to, 'price': float(gc.price), 'id': f"global-{gc.id}"}
                if gc.condition_type == 'date': g_date.append(item)
                else: g_recurring.append(item)
        
        if isinstance(p_cond, list):
            for pc in p_cond:
                if not isinstance(pc, dict): continue
                match = False
                is_date = False
                if 'dates' in pc and date in (pc.get('dates') or []): match = True; is_date = True
                elif 'days' in pc and (day_of_week_short in [d.lower()[:3] for d in (pc.get('days') or [])] or day_of_week_full.lower() in [d.lower() for d in (pc.get('days') or [])]): match = True
                if match:
                    item = {'slotFrom': pc.get('slotFrom'), 'slotTo': pc.get('slotTo'), 'price': float(pc.get('price', b_price)), 'id': pc.get('id', 'override')}
                    if is_date: l_date.append(item)
                    else: l_recurring.append(item)

        for items in [g_recurring, l_recurring, g_date, l_date]:
            for cfg in items:
                try:
                    s_h = int(cfg['slotFrom'].split(':')[0])
                    e_h = int(cfg['slotTo'].split(':')[0])
                    # Handle overnight wrap-around for overrides
                    if e_h < s_h:
                        for h in range(s_h, 24):
                            court_slots[h] = {'price': cfg['price'], 'id': cfg['id']}
                        for h in range(0, e_h):
                            court_slots[h] = {'price': cfg['price'], 'id': cfg['id']}
                    else:
                        for h in range(s_h, e_h):
                            court_slots[h] = {'price': cfg['price'], 'id': cfg['id']}
                except: pass

        # 5. Check Availability (Unavailability & Bookings)
        disabled_hours = set()
        for un in un_slots:
            if isinstance(un, dict):
                match = False
                if date in (un.get('dates') or []): match = True
                if day_of_week_short in [d.lower()[:3] for d in (un.get('days') or [])]: match = True
                if match:
                    for t in (un.get('times') or []):
                        try: disabled_hours.add(int(t.split(':')[0]))
                        except: pass
        
        booked_res = db.execute(text("SELECT time_slots FROM booking WHERE court_id = :cid AND booking_date = :bdate AND status != 'cancelled'"), {"cid": court_id, "bdate": booking_date}).fetchall()
        booked_hours = set()
        for row in booked_res:
            if row[0] and isinstance(row[0], list):
                for s in row[0]:
                    try: booked_hours.add(int(s['start_time'].split(':')[0]))
                    except: pass

        # 6. Format Output
        all_slots = []
        now = datetime.now()
        is_today = (booking_date == now.date())

        for h in sorted(court_slots.keys()):
            # Filter out Today's past slots
            if is_today and h <= now.hour and (h < now.hour or now.minute > 0):
                continue

            # CRITICAL: Hide deleted (unavailable) or booked slots from the APK
            # This ensures only selectable slots are displayed.
            if h in disabled_hours or h in booked_hours:
                continue

            time_key = f"{h:02d}:00"
            available = True # We already filtered out non-available ones
            
            sh_disp = h if h <= 12 else h - 12
            if sh_disp == 0: sh_disp = 12
            ampm_s = "AM" if h < 12 else "PM"
            eh_disp = (h+1) if (h+1) <= 12 else (h+1) - 12
            if eh_disp == 0: eh_disp = 12
            ampm_e = "AM" if (h+1) < 12 else "PM"

            all_slots.append({
                "time": time_key,
                "display_time": f"{sh_disp:02d}:00 {ampm_s} - {eh_disp:02d}:00 {ampm_e}",
                "price": court_slots[h]['price'],
                "available": available,
                "slot_id": court_slots[h]['id']
            })

        print(f"[COURTS API] Returning {len(all_slots)} slots for court {court_id} on {date}")
        return {"court_id": court_id, "date": date, "slots": all_slots}

    except HTTPException as he: raise he
    except Exception as e:
        print(f"[COURTS API] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
