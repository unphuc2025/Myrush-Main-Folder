from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas, database
import uuid

router = APIRouter(
    prefix="/venues",
    tags=["venues"]
)

@router.get("/game-types")
def get_game_types(db: Session = Depends(database.get_db)):
    try:
        from sqlalchemy import text
        query = text("SELECT name FROM admin_game_types WHERE is_active = true ORDER BY name ASC")
        result = db.execute(query).fetchall()
        game_types = [row[0] for row in result]
        return game_types
    except Exception as e:
        print(f"Error fetching game types: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cities")
def get_cities(db: Session = Depends(database.get_db)):
    """Fetch all active cities for dropdowns"""
    try:
        from sqlalchemy import text
        # Query distinct city names from admin_cities where is_active is true
        query = text("SELECT name FROM admin_cities WHERE is_active = true ORDER BY name ASC")
        result = db.execute(query).fetchall()
        cities = [row[0] for row in result]
        return cities
    except Exception as e:
        print(f"Error fetching cities: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/branches")
def get_branches(city: Optional[str] = None, db: Session = Depends(database.get_db)):
    try:
        from sqlalchemy import text
        query_sql = """
            SELECT ab.id, ab.name, ab.address_line1, acity.name as city_name
            FROM admin_branches ab
            JOIN admin_cities acity ON ab.city_id = acity.id
            WHERE ab.is_active = true
        """
        params = {}
        if city:
            query_sql += " AND LOWER(acity.name) = LOWER(:city)"
            params['city'] = city.strip()
            
        result = db.execute(text(query_sql), params).fetchall()
        branches = []
        for row in result:
            row_dict = dict(row._mapping)
            branches.append({
                "id": str(row_dict['id']),
                "name": row_dict['name'],
                "location": row_dict['address_line1'],
                "city": row_dict['city_name']
            })
        return branches
    except Exception as e:
        print(f"Error fetching branches: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
def get_venues(
    city: Optional[str] = None,
    game_type: Optional[str] = None,
    location: Optional[str] = None,
    branch_id: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    try:
        from sqlalchemy import text
        
        # Query to fetch branches with aggregated details
        # We need:
        # - Branch details (id, name, location, images)
        # - City name
        # - Min price from courts
        # - Aggregated game types
        
        query_sql = """
            SELECT 
                ab.id,
                ab.name as branch_name,
                ab.address_line1 as location,
                acity.name as city_name,
                ab.images,
                ab.ground_overview,
                ab.search_location,
                
                -- Aggregated Game Types
                (
                    SELECT string_agg(DISTINCT agt.name, ', ')
                    FROM admin_branch_game_types abgt
                    JOIN admin_game_types agt ON abgt.game_type_id = agt.id
                    WHERE abgt.branch_id = ab.id
                ) as game_types,
                
                -- Min Price from Courts
                (
                    SELECT MIN(ac.price_per_hour)
                    FROM admin_courts ac
                    WHERE ac.branch_id = ab.id AND ac.is_active = true
                ) as min_price,

                ab.created_at,
                ab.updated_at

            FROM admin_branches ab
            JOIN admin_cities acity ON ab.city_id = acity.id
            WHERE ab.is_active = true
        """
        
        params = {}
        
        # Filter by city OR location
        if city or location:
            city_filter = city or location
            city_filter = city_filter.strip()
            query_sql += " AND LOWER(acity.name) = LOWER(:city)"
            params['city'] = city_filter
        
        # Filter by branch_id
        if branch_id:
            query_sql += " AND ab.id = :branch_id"
            params['branch_id'] = branch_id

        # Filter by game_type (complex because it's a many-to-many check)
        if game_type and game_type != "undefined":
            # We filter branches that HAVE the requested game type
            if isinstance(game_type, list):
                 # logic for list if needed, usually simplified to "contains any"
                 pass 
            else:
                 # Check if branch has this game type
                 query_sql += """
                    AND EXISTS (
                        SELECT 1 FROM admin_branch_game_types abgt
                        JOIN admin_game_types agt ON abgt.game_type_id = agt.id
                        WHERE abgt.branch_id = ab.id AND agt.name ILIKE :game_type
                    )
                 """
                 params['game_type'] = f"%{game_type}%"

        print(f"[VENUES API] Query: {query_sql}")
        print(f"[VENUES API] Params: {params}")
        
        result_proxy = db.execute(text(query_sql), params)
        branches = result_proxy.fetchall()
        
        print(f"[VENUES API] Found {len(branches)} branches")
        
        # Helper function to parse images
        def parse_images(images_value):
            if not images_value: return []
            if isinstance(images_value, list): return [str(img).strip() for img in images_value if img]
            if isinstance(images_value, str):
                images_value = images_value.strip()
                if not images_value: return []
                if images_value.startswith('[') and images_value.endswith(']'):
                    try:
                        import json
                        parsed = json.loads(images_value)
                        return [str(img).strip() for img in parsed if img] if isinstance(parsed, list) else []
                    except: pass
                if images_value.startswith('{') and images_value.endswith('}'):
                    return [img.strip() for img in images_value[1:-1].split(',') if img.strip()]
                if ',' in images_value:
                    return [img.strip() for img in images_value.split(',') if img.strip()]
                return [images_value]
            return []

        result = []
        for branch in branches:
            b = dict(branch._mapping)
            
            parsed_images = parse_images(b.get('images'))
            # If branch has no images, maybe fallback to court images? (Skipping for now to keep it fast)
            
            # Map to the format expected by Frontend "Venue" interface (mostly)
            # Frontend expects: court_name, location, game_type, prices, photos
            
            result.append({
                "id": str(b['id']),
                "court_name": b['branch_name'], # Mapping Branch Name to 'court_name' for frontend compatibility
                "location": f"{(b.get('location') or '')}, {(b.get('city_name') or '')}".strip(', '),
                "game_type": b.get('game_types', '') or 'Multi-Sport',
                "prices": str(b.get('min_price') or 'On Request'),
                "description": b.get('ground_overview') or b.get('search_location') or '',
                "photos": parsed_images,
                "videos": [], # Branch videos if any
                "branch_name": b['branch_name'],
                "city_name": b['city_name'],
                "created_at": b['created_at'].isoformat() if b.get('created_at') else None,
                "updated_at": b['updated_at'].isoformat() if b.get('updated_at') else None,
            })
        
        return result

    except Exception as e:
        print(f"Error in get_venues: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{venue_id}")
def get_venue(venue_id: str, db: Session = Depends(database.get_db)):
    try:
        # Validate UUID format to prevent DataError
        try:
            uuid.UUID(venue_id)
        except ValueError:
            raise HTTPException(status_code=404, detail="Venue not found (Invalid ID)")

        from sqlalchemy import text
        
        # 1. Try to find in admin_branches (since we now list branches)
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
                ab.created_at,
                ab.updated_at,
                
                -- Aggregated Game Types
                (
                    SELECT string_agg(DISTINCT agt.name, ', ')
                    FROM admin_branch_game_types abgt
                    JOIN admin_game_types agt ON abgt.game_type_id = agt.id
                    WHERE abgt.branch_id = ab.id
                ) as game_types,
                
                -- Min Price
                (
                    SELECT MIN(ac.price_per_hour)
                    FROM admin_courts ac
                    WHERE ac.branch_id = ab.id AND ac.is_active = true
                ) as min_price

            FROM admin_branches ab
            JOIN admin_cities acity ON ab.city_id = acity.id
            WHERE ab.id = :venue_id
        """
        
        branch_result = db.execute(text(branch_query), {"venue_id": venue_id}).first()
        
        if branch_result:
            # Found a branch
            b = dict(branch_result._mapping)
            
            # Helper function to parse images (simple version)
            def parse_images(images_value):
                if not images_value: return []
                if isinstance(images_value, list): return [str(img).strip() for img in images_value if img]
                if isinstance(images_value, str):
                    images_value = images_value.strip()
                    if not images_value: return []
                    if images_value.startswith('[') and images_value.endswith(']'):
                         try:
                             import json
                             parsed = json.loads(images_value)
                             return [str(img).strip() for img in parsed if img] if isinstance(parsed, list) else []
                         except: pass
                    if ',' in images_value: return [img.strip() for img in images_value.split(',') if img.strip()]
                    return [images_value]
                return []

            parsed_images = parse_images(b.get('images'))
            
            # Fetch amenities for branch (aggregated from courts or branch amenities if table exists)
            # Simplified: just return empty or static for now, or fetch from branch_amenities if it exists?
            # Let's try fetching from admin_amenities linked to branch via admin_branch_amenities if it exists, or just courts.
            # Assuming admin_branch_amenities might not exist or be populated, let's skip for safety or try generic query.
            amenities_data = [] # Placeholder
            
            return {
                "id": str(b['id']),
                "court_name": b['branch_name'],
                "location": f"{(b.get('location') or '')}, {(b.get('city_name') or '')}".strip(', '),
                "game_type": b.get('game_types', '') or 'Multi-Sport',
                "prices": str(b.get('min_price') or 'On Request'),
                "description": b.get('ground_overview') or b.get('search_location') or '',
                "photos": parsed_images,
                "videos": [],
                "amenities": amenities_data,
                "terms_and_conditions": "", # Branch specific terms?
                "created_at": b['created_at'].isoformat() if b.get('created_at') else None,
                "updated_at": b['updated_at'].isoformat() if b.get('updated_at') else None,
                "branch_name": b['branch_name'],
                "city_name": b['city_name'],
                "google_map_url": b.get('google_map_url')
            }

        # 2. If not found in branches, try admin_courts (Legacy support)
        query_sql = """
            SELECT 
                ac.id,
                ac.name as court_name,
                ac.price_per_hour as prices,
                ac.images as photos,
                ac.videos,
                ac.amenities,
                ac.terms_and_conditions,
                ac.created_at,
                ac.updated_at,
                ab.name as branch_name,
                ab.address_line1 as location,
                ab.search_location as description,
                acity.name as city_name,
                agt.name as game_type
            FROM admin_courts ac
            JOIN admin_branches ab ON ac.branch_id = ab.id
            JOIN admin_cities acity ON ab.city_id = acity.id
            JOIN admin_game_types agt ON ac.game_type_id = agt.id
            WHERE ac.id = :venue_id
        """
        
        result = db.execute(text(query_sql), {"venue_id": venue_id}).first()
        
        if not result:
            raise HTTPException(status_code=404, detail="Venue not found")
            
        court_dict = dict(result._mapping)
        
        # Helper reuse (duplicating for safety context)
        def parse_images_c(images_value):
            if not images_value: return []
            if isinstance(images_value, list): return [str(img).strip() for img in images_value if img]
            if isinstance(images_value, str):
                images_value = images_value.strip()
                if not images_value: return []
                if images_value.startswith('[') and images_value.endswith(']'):
                    try:
                        import json
                        parsed = json.loads(images_value)
                        return [str(img).strip() for img in parsed if img] if isinstance(parsed, list) else []
                    except: pass
                if images_value.startswith('{') and images_value.endswith('}'):
                    return [img.strip() for img in images_value[1:-1].split(',') if img.strip()]
                if ',' in images_value:
                    return [img.strip() for img in images_value.split(',') if img.strip()]
                return [images_value]
            return []

        # Parse Amenities
        amenities_data = []
        raw_amenities = court_dict.get('amenities')
        
        parsed_images = parse_images_c(court_dict.get('photos'))
        parsed_videos = parse_images_c(court_dict.get('videos'))
        
        if raw_amenities:
            if isinstance(raw_amenities, str):
                if raw_amenities.startswith('{') and raw_amenities.endswith('}'):
                    raw_amenities = raw_amenities[1:-1].split(',')
                elif raw_amenities.startswith('[') and raw_amenities.endswith(']'):
                    import json
                    try: raw_amenities = json.loads(raw_amenities) 
                    except: raw_amenities = []
            
            if isinstance(raw_amenities, list) and len(raw_amenities) > 0:
                amenity_ids = [str(a).strip() for a in raw_amenities if str(a).strip()]
                if amenity_ids:
                    try:
                        clean_ids = [aid.replace('"', '').replace("'", "") for aid in amenity_ids]
                        amenities_query = "SELECT id, name, icon FROM admin_amenities WHERE id::text = ANY(:ids)"
                        amenity_res = db.execute(text(amenities_query), {"ids": clean_ids}).fetchall()
                        for row in amenity_res:
                            r = dict(row._mapping)
                            amenities_data.append({"id": str(r['id']), "name": r['name'], "icon": r['icon'] or "✨"})
                    except Exception as e:
                        print(f"Error fetching amenities details: {e}")
                        for aid in amenity_ids: amenities_data.append({"id": str(aid), "name": str(aid), "icon": "✨"})

        response = {
            "id": str(court_dict['id']),
            "court_name": court_dict.get('court_name', ''),
            "location": f"{court_dict.get('location', '')}, {court_dict.get('city_name', '')}",
            "game_type": court_dict.get('game_type', ''),
            "prices": str(court_dict.get('prices', '0')),
            "description": court_dict.get('description', '') or f"{court_dict.get('branch_name', '')} - {court_dict.get('game_type', '')} Court",
            "photos": parsed_images,
            "videos": parsed_videos,
            "amenities": amenities_data,
            "terms_and_conditions": court_dict.get('terms_and_conditions', ''),
            "created_at": court_dict['created_at'].isoformat() if court_dict.get('created_at') else None,
            "updated_at": court_dict['updated_at'].isoformat() if court_dict.get('updated_at') else None,
        }
        
        return response

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error in get_venue: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{venue_id}/slots")
def get_venue_slots(
    venue_id: str,
    date: str,
    game_type: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    """
    Get aggregated available slots for a venue (branch) on a specific date.
    Considers branch opening hours, court availability, and game type.
    """
    try:
        from datetime import datetime
        from date_utils import parse_date_safe
        from sqlalchemy import text
        
        # 1. Parse Date
        booking_date = parse_date_safe(date, "%Y-%m-%d", "date")
        day_of_week_full = booking_date.strftime("%A") 
        day_of_week_short = day_of_week_full[:3].lower()
        
        # 2. Identify Venue/Branch
        branch_query = "SELECT id, name, opening_hours FROM admin_branches WHERE id = :venue_id"
        branch_res = db.execute(text(branch_query), {"venue_id": venue_id}).first()
        
        is_specific_court = False
        target_court_id = None
        
        if not branch_res:
            # Check if it's a court ID
            court_check = db.execute(text("SELECT id, branch_id FROM admin_courts WHERE id = :venue_id"), {"venue_id": venue_id}).first()
            if court_check:
                is_specific_court = True
                target_court_id = str(court_check.id)
                branch_res = db.execute(text(branch_query), {"venue_id": str(court_check.branch_id)}).first()
        
        if not branch_res:
            raise HTTPException(status_code=404, detail="Venue or Branch not found")

        branch = dict(branch_res._mapping)
        branch_id = str(branch['id'])
        opening_hours = branch.get('opening_hours') or {}

        # 3. Determine Operating Hours (Robustly)
        branch_is_active = True
        venue_start_hour = 8
        venue_end_hour = 22
        
        if isinstance(opening_hours, dict):
            # Try multiple key variants
            possible_keys = [
                day_of_week_full.lower(), # friday
                day_of_week_full,        # Friday
                day_of_week_short,       # fri
                day_of_week_short.title(),# Fri
                'default'
            ]
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

        # 4. Get Relevant Courts
        court_query = """
            SELECT ac.id, ac.name, ac.price_per_hour, ac.price_conditions, ac.unavailability_slots, agt.name as game_type
            FROM admin_courts ac
            JOIN admin_game_types agt ON ac.game_type_id = agt.id
            WHERE ac.branch_id = :branch_id AND ac.is_active = true
        """
        params = {"branch_id": branch_id}
        if is_specific_court:
            court_query += " AND ac.id = :court_id"
            params['court_id'] = target_court_id
        elif game_type:
            court_query += " AND agt.name ILIKE :game_type"
            params['game_type'] = f"%{game_type}%"
            
        court_res = db.execute(text(court_query), params).fetchall()
        
        # 5. Fetch Global Conditions
        global_conditions = db.query(models.GlobalPriceCondition).filter(models.GlobalPriceCondition.is_active == True).all()

        # 6. Aggregate
        consolidated_slots = {} # "HH:00" -> SlotInfo
        
        for court_row in court_res:
            court = dict(court_row._mapping)
            c_id = str(court['id'])
            b_price = float(court['price_per_hour'])
            p_cond = court.get('price_conditions') or []
            un_slots = court.get('unavailability_slots') or []
            
            court_slots = {} # hour(int) -> {price, id}
            
            # A. Base Range
            if branch_is_active:
                for h in range(venue_start_hour, venue_end_hour):
                    court_slots[h] = {'price': b_price, 'id': 'default'}
                    
            # B. Collect Overrides (with specific list separation for priority)
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
                    if 'dates' in pc and date in (pc.get('dates') or []):
                        match = True
                        is_date = True
                    elif 'days' in pc and (day_of_week_short in [d.lower()[:3] for d in (pc.get('days') or [])] or day_of_week_full.lower() in [d.lower() for d in (pc.get('days') or [])]):
                        match = True
                    
                    if match:
                        item = {'slotFrom': pc.get('slotFrom'), 'slotTo': pc.get('slotTo'), 'price': float(pc.get('price', b_price)), 'id': pc.get('id', 'override')}
                        if is_date: l_date.append(item)
                        else: l_recurring.append(item)
            
            # Apply in order of priority (Global Recurring -> Local Recurring -> Global Date -> Local Date)
            for items in [g_recurring, l_recurring, g_date, l_date]:
                for cfg in items:
                    try:
                        s_h = int(cfg['slotFrom'].split(':')[0])
                        e_h = int(cfg['slotTo'].split(':')[0])
                        for h in range(s_h, e_h):
                            court_slots[h] = {'price': cfg['price'], 'id': cfg['id']}
                    except: pass
            
            # C. Unavailable & Booked
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
                            
            booked_res = db.execute(text("SELECT time_slots FROM booking WHERE court_id = :cid AND booking_date = :bdate AND status != 'cancelled'"), {"cid": c_id, "bdate": booking_date}).fetchall()
            booked_hours = set()
            for row in booked_res:
                if row[0] and isinstance(row[0], list):
                    for s in row[0]:
                        try: booked_hours.add(int(s['start_time'].split(':')[0]))
                        except: pass
            
            # D. Merge to Consolidated
            now = datetime.now()
            is_today = (booking_date == now.date())

            for h, cfg in court_slots.items():
                # Past check
                if is_today and h <= now.hour and (h < now.hour or now.minute > 0):
                    continue
                
                time_key = f"{h:02d}:00"
                is_available = not (h in disabled_hours or h in booked_hours)
                
                # Rule for consolidated view:
                # 1. If slot exists, and current attempt is available while existing is not -> update.
                # 2. If both available, pick cheaper.
                # 3. If both unavailable, doesn't matter much but we keep one.
                
                update = False
                if time_key not in consolidated_slots:
                    update = True
                else:
                    existing = consolidated_slots[time_key]
                    if is_available and not existing['available']:
                        update = True
                    elif is_available and existing['available']:
                        if cfg['price'] < existing['price']:
                            update = True
                            
                if update:
                    sh_disp = h if h <= 12 else h - 12
                    if sh_disp == 0: sh_disp = 12
                    ampm_s = "AM" if h < 12 else "PM"
                    eh_disp = (h+1) if (h+1) <= 12 else (h+1) - 12
                    if eh_disp == 0: eh_disp = 12
                    ampm_e = "AM" if (h+1) < 12 else "PM"
                    
                    consolidated_slots[time_key] = {
                        "time": time_key,
                        "display_time": f"{sh_disp:02d}:00 {ampm_s} - {eh_disp:02d}:00 {ampm_e}",
                        "price": cfg['price'],
                        "court_id": c_id,
                        "court_name": court.get('name', ''),
                        "available": is_available,
                        "slot_id": cfg['id']
                    }

        final_slots = sorted(consolidated_slots.values(), key=lambda x: x['time'])
        
        return {
            "venue_id": venue_id,
            "date": date,
            "slots": final_slots
        }

    except HTTPException as he: raise he
    except Exception as e:
        print(f"[VENUES API] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/seed", response_model=List[schemas.VenueResponse])
def seed_venues(db: Session = Depends(database.get_db)):
    """Seed the database with some dummy venues if empty"""
    if db.query(models.Venue).count() > 0:
        return db.query(models.Venue).all()
        
    venues_data = [
        {
            "court_name": "Smash Arena",
            "location": "Jubilee Hills",
            "city": "Hyderabad",
            "game_type": "Badminton,Table Tennis",
            "prices": "500",
            "description": "Premium indoor stadium with synthetic courts",
            "photos": "https://example.com/photo1.jpg"
        },
        {
            "court_name": "Power Play Sports",
            "location": "Gachibowli",
            "city": "Hyderabad",
            "game_type": "Cricket,Football",
            "prices": "1200",
            "description": "Large turf for cricket and football",
            "photos": "https://example.com/photo2.jpg"
        },
        {
            "court_name": "City Tennis Club",
            "location": "Banjara Hills",
            "city": "Hyderabad",
            "game_type": "Tennis",
            "prices": "800",
            "description": "Clay and hard courts available",
            "photos": "https://example.com/photo3.jpg"
        }
    ]
    
    created_venues = []
    for v in venues_data:
        venue = models.Venue(
            id=str(uuid.uuid4()),
            **v
        )
        db.add(venue)
        created_venues.append(venue)
        
    db.commit()
    for v in created_venues:
        db.refresh(v)
        
    return created_venues
