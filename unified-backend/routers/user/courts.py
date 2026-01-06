from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
import database

router = APIRouter(
    prefix="/courts",
    tags=["courts"]
)

@router.get("/")
def get_courts(
    city: Optional[str] = None,
    game_type: Optional[str] = None,
    location: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    """
    Fetch courts from admin_courts table filtered by city and game type.
    This is used for the field booking section.
    """
    try:
        # Query from admin_courts with joins to get city, game type, and amenities info
        query_sql = """
            SELECT
                ac.id,
                ac.name as court_name,
                ac.price_per_hour as prices,
                ac.images as photos,
                ac.videos,
                ac.terms_and_conditions,
                ac.amenities as amenities,
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
        """

        params = {}
        where_conditions = ["ac.is_active = true"]

        # Filter by city OR location (they're the same in your case)
        if city or location:
            city_filter = city or location
            city_filter = city_filter.strip()  # Remove trailing spaces
            where_conditions.append("LOWER(acity.name) = LOWER(:city)")
            params['city'] = city_filter

        # Add WHERE clause
        query_sql += " WHERE " + " AND ".join(where_conditions)
        
        # Filter by game type if provided (handle array of game types)
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

        # Update WHERE clause if we have additional conditions
        if len(where_conditions) > 1:
            query_sql = query_sql.replace(" WHERE ac.is_active = true", " WHERE " + " AND ".join(where_conditions))
        
        print(f"[COURTS API] Query: {query_sql}")
        print(f"[COURTS API] Params: {params}")
        
        result_proxy = db.execute(text(query_sql), params)
        courts = result_proxy.fetchall()
        
        print(f"[COURTS API] Found {len(courts)} courts")
        
        # Convert to dict format
        result = []
        for court in courts:
            court_dict = dict(court._mapping)
            result.append({
                "id": str(court_dict['id']),
                "court_name": court_dict.get('court_name', ''),
                "location": f"{court_dict.get('location', '')}, {court_dict.get('city_name', '')}",
                "game_type": court_dict.get('game_type', ''),
                "prices": str(court_dict.get('prices', '0')),
                "description": court_dict.get('description', '') or f"{court_dict.get('branch_name', '')} - {court_dict.get('game_type', '')} Court",
                "terms_and_conditions": court_dict.get('terms_and_conditions', ''),
                "amenities": court_dict.get('amenities', []) or [],
                "photos": court_dict.get('photos', []) or [],
                "videos": court_dict.get('videos', []) or [],
                "created_at": court_dict['created_at'].isoformat() if court_dict.get('created_at') else None,
                "updated_at": court_dict['updated_at'].isoformat() if court_dict.get('updated_at') else None,
                "branch_name": court_dict.get('branch_name', ''),
            })
        
        return result
    except Exception as e:
        print(f"[COURTS API] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{court_id}")
def get_court(court_id: str, db: Session = Depends(database.get_db)):
    """Get a single court by ID"""
    try:
        query_sql = """
            SELECT
                ac.id,
                ac.name as court_name,
                ac.price_per_hour as prices,
                ac.images as photos,
                ac.videos,
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
            WHERE ac.id = :court_id
        """
        
        result_proxy = db.execute(text(query_sql), {"court_id": court_id})
        court = result_proxy.fetchone()
        
        if not court:
            raise HTTPException(status_code=404, detail="Court not found")
        
        court_dict = dict(court._mapping)
        return {
            "id": str(court_dict['id']),
            "court_name": court_dict.get('court_name', ''),
            "location": f"{court_dict.get('location', '')}, {court_dict.get('city_name', '')}",
            "game_type": court_dict.get('game_type', ''),
            "prices": str(court_dict.get('prices', '0')),
            "description": court_dict.get('description', '') or f"{court_dict.get('branch_name', '')} - {court_dict.get('game_type', '')} Court",
            "terms_and_conditions": court_dict.get('terms_and_conditions', ''),
            "photos": court_dict.get('photos', []) or [],
            "videos": court_dict.get('videos', []) or [],
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
        from datetime import datetime, time, timedelta
        import json
        
        # Parse the date
        try:
            booking_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
        # Get court details with timing data from price_conditions and unavailability_slots
        court_query = """
            SELECT
                ac.id,
                ac.price_per_hour,
                ac.price_conditions,
                ac.unavailability_slots,
                ab.id as branch_id
            FROM admin_courts ac
            JOIN admin_branches ab ON ac.branch_id = ab.id
            WHERE ac.id = :court_id AND ac.is_active = true
        """

        result = db.execute(text(court_query), {"court_id": court_id})
        court = result.fetchone()

        if not court:
            raise HTTPException(status_code=404, detail="Court not found")

        court_dict = dict(court._mapping)
        price_per_hour = float(court_dict['price_per_hour'])
        timing_config = court_dict.get('price_conditions') or []  # Slot configurations with pricing
        unavailability_data = court_dict.get('unavailability_slots') or []  # Slots to disable



        # Get current day of week (lowercase 3-letter format)
        day_of_week = booking_date.strftime("%A").lower()[:3]  # mon, tue, wed, etc.
        date_str = date  # YYYY-MM-DD format for date-specific matching

        # Process all timing configurations that match the current day OR specific date
        matching_configs = []
        date_specific_configs = []
        day_specific_configs = []

        # Check if court has price_conditions data
        if isinstance(timing_config, list) and len(timing_config) > 0:
            print(f"[COURTS API] ✅ Court has {len(timing_config)} price_conditions for {court_id}")

            # Find ALL timing configs that match the current day OR specific date
            for i, timing in enumerate(timing_config):
                if isinstance(timing, dict):
                    # Priority 1: Check for specific date matches (highest priority)
                    if 'dates' in timing and isinstance(timing.get('dates'), list):
                        dates_list = timing.get('dates', [])
                        if date_str in dates_list:
                            slot_from = timing.get('slotFrom', '08:00')
                            slot_to = timing.get('slotTo', '22:00')
                            price_config = timing.get('price', str(price_per_hour))

                            print(f"[COURTS API] ✓ DATE-SPECIFIC Config {i+1}: {date_str}, {slot_from}-{slot_to}, ₹{price_config}")

                            try:
                                start_hour = int(slot_from.split(':')[0])
                                end_hour = int(slot_to.split(':')[0])
                                config_price = float(price_config)

                                date_specific_configs.append({
                                    'start_hour': start_hour,
                                    'end_hour': end_hour,
                                    'price': config_price,
                                    'id': timing.get('id'),
                                    'type': 'date-specific'
                                })
                            except (ValueError, IndexError) as e:
                                print(f"[COURTS API] ❌ Error parsing date-specific config {i+1}: {e}")
                    
                    # Priority 2: Check for day-of-week matches (lower priority)
                    elif 'days' in timing:
                        days_list = timing.get('days', [])
                        day_matches = [day.lower()[:3] for day in days_list] if isinstance(days_list, list) else []

                        if day_of_week in day_matches:
                            slot_from = timing.get('slotFrom', '08:00')
                            slot_to = timing.get('slotTo', '22:00')
                            price_config = timing.get('price', str(price_per_hour))

                            print(f"[COURTS API] ✓ DAY-SPECIFIC Config {i+1}: {slot_from}-{slot_to}, ₹{price_config}")

                            try:
                                start_hour = int(slot_from.split(':')[0])
                                end_hour = int(slot_to.split(':')[0])
                                config_price = float(price_config)

                                day_specific_configs.append({
                                    'start_hour': start_hour,
                                    'end_hour': end_hour,
                                    'price': config_price,
                                    'id': timing.get('id'),
                                    'type': 'day-specific'
                                })
                            except (ValueError, IndexError) as e:
                                print(f"[COURTS API] ❌ Error parsing day-specific config {i+1}: {e}")
            
            # Use date-specific configs if available, otherwise fall back to day-specific
            if date_specific_configs:
                matching_configs = date_specific_configs
                print(f"[COURTS API] Using {len(date_specific_configs)} DATE-SPECIFIC configurations")
            elif day_specific_configs:
                matching_configs = day_specific_configs
                print(f"[COURTS API] Using {len(day_specific_configs)} DAY-SPECIFIC configurations")
        
        # FALLBACK: Generate default slots if no configurations found
        if not matching_configs:
            print(f"[COURTS API] ⚠️ Court {court_id} has NO matching price_conditions - generating default slots")
            for hour in range(8, 22):  # 8 AM to 10 PM
                matching_configs.append({
                    'start_hour': hour,
                    'end_hour': hour + 1,  # Each slot is 1 hour
                    'price': price_per_hour,
                    'id': f'default-{hour}',
                    'type': 'default'
                })

        # Generate time slots from all matching configurations
        all_slots = []

        for config in matching_configs:
            print(f"[COURTS API] Generating slots: {config['start_hour']}-{config['end_hour']}h, ₹{config['price']}")
            for hour in range(config['start_hour'], config['end_hour']):
                time_str = f"{hour:02d}:00"
                period = "AM" if hour < 12 else "PM"
                display_hour = hour
                if display_hour > 12:
                    display_hour -= 12
                if display_hour == 0:
                    display_hour = 12

                # Calculate end time for display
                end_hour = (hour + 1) % 24
                end_period = "AM" if end_hour < 12 else "PM"
                if end_hour > 12:
                    end_display_hour = end_hour - 12
                elif end_hour == 0:
                    end_display_hour = 12
                else:
                    end_display_hour = end_hour

                slot = {
                    "time": time_str,
                    "end_time": f"{end_hour:02d}:00",
                    "display_time": f"{display_hour:02d}:00 {period} - {end_display_hour:02d}:00 {end_period}",
                    "price": config['price'],
                    "available": True
                }
                all_slots.append(slot)

        print(f"[COURTS API] Total slots generated: {len(all_slots)}")
        
        # Filter out unavailable slots from admin configuration (unavailability_slots column)
        day_of_week = booking_date.strftime("%A")  # Monday, Tuesday, etc.

        for unavail in unavailability_data:
            # Check if unavailability applies to this date
            if isinstance(unavail, dict):
                # Check days of week - disable slots on specific days
                if 'days' in unavail and isinstance(unavail['days'], list):
                    days_config = [day.lower().capitalize() for day in unavail['days']]  # Convert to title case
                    if day_of_week in days_config:
                        unavail_times = unavail.get('times', [])
                        if isinstance(unavail_times, list):
                            for slot in all_slots:
                                if slot['time'] in unavail_times:
                                    slot['available'] = False
                                    print(f"[COURTS API] Disabled slot {slot['time']} due to day unavailability")

                # Check specific dates - disable slots on specific dates
                if 'dates' in unavail and isinstance(unavail['dates'], list):
                    if date in unavail['dates']:
                        unavail_times = unavail.get('times', [])
                        if isinstance(unavail_times, list):
                            for slot in all_slots:
                                if slot['time'] in unavail_times:
                                    slot['available'] = False
                                    print(f"[COURTS API] Disabled slot {slot['time']} due to date unavailability")

        print(f"[COURTS API] Applied unavailability filters from {len(unavailability_data)} configurations")
        
        # Filter out already booked slots
        booked_query = """
            SELECT start_time
            FROM booking
            WHERE court_id = :court_id
              AND booking_date = :booking_date
              AND status != 'cancelled'
        """
        
        booked_result = db.execute(
            text(booked_query),
            {"court_id": court_id, "booking_date": booking_date}
        )
        booked_slots = [row[0] for row in booked_result]
        
        for slot in all_slots:
            if slot['time'] in booked_slots:
                slot['available'] = False
        
        # Return only available slots
        available_slots = [s for s in all_slots if s['available']]
        
        print(f"[COURTS API] Found {len(available_slots)} available slots for court {court_id} on {date}")
        
        return {
            "court_id": court_id,
            "date": date,
            "slots": available_slots
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[COURTS API] Error getting available slots: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
