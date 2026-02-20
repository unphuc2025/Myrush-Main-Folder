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
        from sqlalchemy import text, func
        
        # 1. Parse Date
        booking_date = parse_date_safe(date, "%Y-%m-%d", "date")
        day_of_week_full = booking_date.strftime("%A") # Monday
        day_of_week_short = day_of_week_full.lower()[:3] # mon
        
        # 2. Get Branch Details (Opening Hours)
        branch_query = """
            SELECT id, opening_hours 
            FROM admin_branches 
            WHERE id = :venue_id AND is_active = true
        """
        branch_res = db.execute(text(branch_query), {"venue_id": venue_id}).first()
        
        if not branch_res:
            # Fallback: Check if it's a Court ID (since frontend currently uses Court IDs for venue details)
            # If so, resolve to the parent Branch ID
            print(f"[VENUES API] Branch not found for ID {venue_id}. Checking if it's a Court ID...")
            court_check_query = "SELECT branch_id FROM admin_courts WHERE id = :court_id"
            court_check_res = db.execute(text(court_check_query), {"court_id": venue_id}).first()
            
            if court_check_res:
                real_branch_id = str(court_check_res.branch_id)
                print(f"[VENUES API] Resolved Court ID {venue_id} to Branch ID {real_branch_id}")
                
                # Retry fetching branch with the resolved ID
                branch_res = db.execute(text(branch_query), {"venue_id": real_branch_id}).first()
                if branch_res:
                    venue_id = real_branch_id # Update variable for subsequent queries
                else:
                    raise HTTPException(status_code=404, detail="Parent Branch not found/active")
            else:
                raise HTTPException(status_code=404, detail="Venue (Branch) not found")
            
        branch = dict(branch_res._mapping)
        opening_hours = branch.get('opening_hours') or {}
        
        # Determine valid operating hours for the day
        venue_start_hour = 6 # Default
        venue_end_hour = 23 # Default
        
        if isinstance(opening_hours, dict):
            # Check for specific day config
            # Convert "open"/"close" keys from admin_branches JSON to "start"/"end" format if needed
            # The structure is {"monday": {"open": "09:00", "close": "22:00", "isActive": true}}
            
            day_config = opening_hours.get(day_of_week_short) or opening_hours.get(day_of_week_full.lower()) or opening_hours.get('default')
            
            if day_config and isinstance(day_config, dict):
                # Try getting "open"/"close" first, then fallback to "start"/"end"
                start_str = day_config.get('open') or day_config.get('start') or '06:00'
                end_str = day_config.get('close') or day_config.get('end') or '23:00'
                
                # Check if day is active?
                if day_config.get('isActive') is False:
                     print(f"[VENUES API] Venue is closed on {day_of_week_full}")
                     return {
                        "venue_id": venue_id,
                        "date": date,
                        "slots": []
                    }

                try:
                    venue_start_hour = int(start_str.split(':')[0])
                    venue_end_hour = int(end_str.split(':')[0])
                except: pass
        
        print(f"[VENUES API] Venue Hours for {day_of_week_short}: {venue_start_hour}:00 - {venue_end_hour}:00")

        # 3. Get Relevant Courts
        # Filter by game_type if provided
        court_query = """
            SELECT 
                ac.id, 
                ac.name,
                ac.price_per_hour, 
                ac.price_conditions, 
                ac.unavailability_slots,
                agt.name as game_type
            FROM admin_courts ac
            JOIN admin_game_types agt ON ac.game_type_id = agt.id
            WHERE ac.branch_id = :venue_id AND ac.is_active = true
        """
        params = {"venue_id": venue_id}
        
        if game_type:
            court_query += " AND agt.name ILIKE :game_type"
            params['game_type'] = f"%{game_type}%"
            
        court_res = db.execute(text(court_query), params).fetchall()
        
        if not court_res:
            print(f"[VENUES API] No courts found for venue {venue_id} with game_type {game_type}")
            return {
                "venue_id": venue_id,
                "date": date,
                "slots": []
            }

        # 4. Generate Slots for EACH court
        # We will aggregate availabilities. 
        # Strategy: A slot (e.g. 10:00-11:00) is available if ANY court is available.
        # Price: We'll take the minimum price of available courts for that slot.
        
        consolidated_slots = {} # Key: "HH:MM", Value: Slot Object
        
        for court_row in court_res:
            court = dict(court_row._mapping)
            court_id = str(court['id'])
            base_price = float(court['price_per_hour'])
            price_conditions = court.get('price_conditions') or []
            unavailability = court.get('unavailability_slots') or []
            
            print(f"[VENUES API] Processing Court {court_id} ({court['game_type']})")
            print(f"[DEBUG] Court Name from DB: '{court.get('name', 'NOT_FOUND')}'")
            
            # --- Logic from courts.py (Refactored for Overrides) ---
            
            court_slots_config = []
            
            # Step 1: Generate BASE SLOTS for all valid operating hours
            # Use 'default' ID and base_price
            for h in range(venue_start_hour, venue_end_hour):
                court_slots_config.append({
                    'start': h, 
                    'end': h+1, 
                    'price': base_price, 
                    'id': 'default'
                })

            # Step 2: Apply Price Condition OVERRIDES
            if isinstance(price_conditions, list):
                day_configs = []
                date_configs = []
                
                for pc in price_conditions:
                    if isinstance(pc, dict):
                        # Date match
                        if 'dates' in pc and isinstance(pc.get('dates'), list) and date in pc['dates']:
                             date_configs.append(pc)
                        # Day match
                        elif 'days' in pc and isinstance(pc.get('days'), list) and (day_of_week_short in [d.lower()[:3] for d in pc['days']] or day_of_week_full in pc['days']):
                             day_configs.append(pc)
                        # Global match (recurrence type) - if matches all days or type='recurring' with no days?
                        elif pc.get('days') == [] and pc.get('dates') is None: # Global override
                             day_configs.append(pc)
                
                # Prioritize date > day
                active_configs = date_configs if date_configs else day_configs
                
                if active_configs:
                    for cfg in active_configs:
                        try:
                            s = int(cfg.get('slotFrom', '08:00').split(':')[0])
                            e = int(cfg.get('slotTo', '22:00').split(':')[0])
                            p = float(cfg.get('price', base_price))
                            cfg_id = cfg.get('id')
                            
                            # Update existing slots in range [s, e)
                            # Or add if new? (Usually strictly within operating hours)
                            
                            for i, slot in enumerate(court_slots_config):
                                if slot['start'] >= s and slot['end'] <= e:
                                    # This base slot is covered by the override condition
                                    court_slots_config[i]['price'] = p
                                    court_slots_config[i]['id'] = cfg_id
                                    # print(f"Overriding slot {slot['start']}-{slot['end']} with price {p}")
                        except Exception as e:
                            print(f"[VENUES API] Error applying price config: {e}")

            # Generate actual slot objects for this court
            generated_slots = []
            for cfg in court_slots_config:
                start_h = cfg['start']
                end_h = cfg['end']
                
                # STRICT OPENING HOURS CHECK
                # Only include if slot falls within Venue Opening Hours
                if start_h < venue_start_hour or end_h > venue_end_hour:
                    continue

                # Format times
                start_time = f"{start_h:02d}:00"
                end_time = f"{end_h:02d}:00"
                
                # Display Time
                sh_disp = start_h if start_h <= 12 else start_h - 12
                if sh_disp == 0: sh_disp = 12
                ampm_s = "AM" if start_h < 12 else "PM"
                
                eh_disp = end_h if end_h <= 12 else end_h - 12
                if eh_disp == 0: eh_disp = 12
                ampm_e = "AM" if end_h < 12 else "PM"
                
                display_time = f"{sh_disp:02d}:00 {ampm_s} - {eh_disp:02d}:00 {ampm_e}"
                
                generated_slots.append({
                    "time": start_time,
                    "end_time": end_time,
                    "display_time": display_time,
                    "price": cfg['price'],
                    "court_id": court_id,
                    "court_name": court.get('name', ''),  # Add court name
                    "available": True
                })

            # Filter Unavailability (Admin set)
            # ... (Logic to check unavailability_slots for date/day matches) ...
            # Simplified: check distinct times in unavailability list
            disabled_times = set()
            for un in unavailability:
                if isinstance(un, dict):
                    # Check if applies to today
                    applies = False
                    if 'dates' in un and date in un.get('dates', []): applies = True
                    if 'days' in un and (day_of_week_short in [d.lower()[:3] for d in un.get('days', [])]): applies = True
                    
                    if applies:
                         for t in un.get('times', []): disabled_times.add(t)

            # Filter Booked Slots
            booked_res = db.execute(text("""
                SELECT time_slots FROM booking 
                WHERE court_id = :cid AND booking_date = :bdate AND status != 'cancelled'
            """), {"cid": court_id, "bdate": booking_date}).fetchall()
            
            booked_times = set()
            for row in booked_res:
                slots_data = row[0]
                if isinstance(slots_data, list):
                    for s in slots_data:
                        if isinstance(s, dict) and 'start_time' in s:
                            booked_times.add(s['start_time'])
            
            # Mark unavailable
            for slot in generated_slots:
                if slot['time'] in disabled_times or slot['time'] in booked_times:
                    slot['available'] = False
            
            # Merge into Consolidated list
            # If slot exists and is available, keep cheaper price?
            # If slot exists and is NOT available, but THIS court is available, make it available.
            
            for slot in generated_slots:
                key = slot['time']
                
                # Filter past slots (if today)
                if booking_date == datetime.now().date():
                     now = datetime.now()
                     sh = int(key.split(':')[0])
                     if sh < now.hour or (sh == now.hour and now.minute > 0): # Strict past check
                         continue

                if not slot['available']:
                    continue # This court is booked/closed, don't help availability
                
                if key not in consolidated_slots:
                    consolidated_slots[key] = slot
                    print(f"[DEBUG] Added slot {key} from court: {slot.get('court_name', 'UNKNOWN')}")
                else:
                    # Update if cheaper
                    if slot['price'] < consolidated_slots[key]['price']:
                        consolidated_slots[key] = slot
                        print(f"[DEBUG] Updated slot {key} to court: {slot.get('court_name', 'UNKNOWN')} (cheaper price)")
                        
        # Convert dict to list and sort
        final_slots = list(consolidated_slots.values())
        final_slots.sort(key=lambda x: x['time'])
        
        print(f"[VENUES API] Returned {len(final_slots)} aggregated slots for {venue_id} on {date}")
        
        return {
            "venue_id": venue_id,
            "date": date,
            "slots": final_slots
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error in get_venue_slots: {e}")
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
