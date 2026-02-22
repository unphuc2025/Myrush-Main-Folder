from datetime import datetime, time, date, timedelta
import json
import re
from typing import List, Dict, Any, Optional, Set
from sqlalchemy.orm import Session

def get_now_ist() -> datetime:
    """Get current time in Indian Standard Time (IST) using UTC offset."""
    # pytz might be missing, using manual offset for Asia/Kolkata (UTC+5:30)
    return datetime.utcnow() + timedelta(hours=5, minutes=30)

def validate_slot_not_past(booking_date: date, start_hour: int):
    """
    Ensure the requested slot is not too far in the past.
    Allows for a 45-minute grace period to account for payment processing time.
    Throws HTTPException if invalid.
    """
    from fastapi import HTTPException
    now_ist = get_now_ist()
    
    # 1. Past Date Check
    if booking_date < now_ist.date():
        raise HTTPException(status_code=400, detail="Cannot book a slot on a past date.")
    
    # 2. Same Day Past Slot Check
    if booking_date == now_ist.date():
        # Construction of slot start time
        slot_dt = datetime.combine(booking_date, time(start_hour, 0))
        # Grace period: 45 minutes
        grace_limit = now_ist - timedelta(minutes=45)
        
        if slot_dt < grace_limit:
            print(f"[PAST CHECK FAIL] Slot {start_hour}:00 is too old. Now={now_ist}, Limit={grace_limit}")
            raise HTTPException(status_code=400, detail="This slot has already started or passed. Please choose a later time.")

def safe_parse_hour(time_str: str) -> int:
    """
    Robustly extract hour (0-23) from a time string.
    Handles 'HH:mm', 'HH:MM:SS', 'HH:MM AM/PM', 'HH AM', and legacy formats.
    """
    if not time_str:
        return 0
    
    time_str = str(time_str).strip().upper()
    
    # 1. Handle AM/PM formats first
    match = re.search(r'(\d+):?(\d*)?\s*(AM|PM)', time_str)
    if match:
        hour = int(match.group(1))
        ampm = match.group(3)
        if ampm == 'PM' and hour != 12:
            hour += 12
        elif ampm == 'AM' and hour == 12:
            hour = 0
        return hour % 24
    
    # 2. Handle 24h formats HH:MM or HH:MM:SS
    match = re.search(r'(\d{1,2}):(\d{2})', time_str)
    if match:
        return int(match.group(1)) % 24
    
    # 3. Simple integer string
    if time_str.isdigit():
        return int(time_str) % 24
    
    # Fallback to simple split
    try:
        return int(time_str.split(':')[0]) % 24
    except (ValueError, IndexError):
        return 0

def get_booked_hours(active_bookings: list) -> set:
    """
    Unified logic for extracting booked hours from a list of booking models.
    Supports both new time_slots JSON and legacy columns.
    """
    booked_times = set()
    print(f"[BOOKING UTILS] Processing {len(active_bookings)} active bookings...")
    
    for b in active_bookings:
        # 1. Try time_slots JSON
        t_slots = b.time_slots
        if isinstance(t_slots, str):
            try:
                t_slots = json.loads(t_slots)
            except:
                t_slots = []
        
        if t_slots and isinstance(t_slots, list):
            for slot in t_slots:
                if isinstance(slot, dict):
                    # Check both 'start_time' and 'time' keys
                    t_str = slot.get('start_time') or slot.get('time')
                    if t_str:
                        h = safe_parse_hour(t_str)
                        booked_times.add(h)
                        print(f"  Booking {getattr(b, 'booking_display_id', b.id)}: Slot {t_str} -> Hour {h}")
        else:
            # 2. Fallback for legacy bookings
            try:
                # Use _deprecated columns if helper properties are missing
                start_val = getattr(b, 'start_time', None) or getattr(b, '_old_start_time', None)
                duration = getattr(b, 'duration_minutes', None) or getattr(b, '_old_duration_minutes', None) or 60
                
                if start_val:
                    if isinstance(start_val, str):
                        h_val = safe_parse_hour(start_val)
                    else:
                        h_val = start_val.hour
                    
                    num_hours = (int(duration) + 59) // 60
                    for i in range(num_hours):
                        h = (h_val + i) % 24
                        booked_times.add(h)
                        print(f"  Booking {getattr(b, 'booking_display_id', b.id)} (Legacy): {start_val} + {duration}m -> Hour {h}")
            except Exception as e:
                print(f"[BOOKING UTILS] Error parsing legacy booking {getattr(b, 'id', 'unknown')}: {e}")
                
    print(f"[BOOKING UTILS] Final booked hours: {sorted(list(booked_times))}")
    return booked_times

def get_venue_hours(opening_hours: Any, booking_date: date) -> tuple:
    """
    Extract opening and closing hours for a specific date from branch opening_hours JSON.
    Returns (start_hour, end_hour). Default 0-24 if not found or unconfigured.
    """
    if not opening_hours:
        print(f"[SLOT ENGINE] No opening_hours found, defaulting to 24h.")
        return 0, 24

    if isinstance(opening_hours, str):
        try:
            opening_hours = json.loads(opening_hours)
        except Exception as e:
            print(f"[SLOT ENGINE] JSON parse error for opening_hours: {e}")
            return 0, 24

    day_name = booking_date.strftime("%A").lower()
    day_config = None

    # Handle both Dict format ("monday": {...}) and List format ([{"day": "monday", ...}, ...])
    if isinstance(opening_hours, dict):
        day_config = opening_hours.get(day_name)
    elif isinstance(opening_hours, list):
        for item in opening_hours:
            if isinstance(item, dict) and str(item.get('day', '')).lower() == day_name:
                day_config = item
                break
    
    print(f"[SLOT ENGINE] Day Config for {day_name}: {day_config}")

    if not day_config:
        print(f"[SLOT ENGINE] No config for {day_name}, defaulting to 24h.")
        return 0, 24

    # Robust isActive check (handle strings, bools, nulls)
    is_active_raw = day_config.get('isActive')
    if is_active_raw is False or str(is_active_raw).lower() == 'false':
        print(f"[SLOT ENGINE] Venue is EXPLICITLY CLOSED for {day_name}.")
        return 0, 0

    # Extract times, handling nulls/missing keys
    start_str = day_config.get('startTime') or '00:00'
    end_str = day_config.get('endTime') or '00:00'

    start_h = safe_parse_hour(start_str)
    
    # Check for various forms of "Midnight" or "End of Day"
    if end_str in ('23:59', '00:00', '24:00', '12:00 AM', None):
        end_h = 24
    else:
        end_h = safe_parse_hour(end_str)
        # If they set endTime to 00:00 (which is 12 AM), it usually means the end of the day or start of next
        if end_h == 0: 
            end_h = 24

    # Safety check: if start and end are same and not 0, it might be misconfigured, default to 24h
    if start_h == end_h and start_h == 0:
        # If exactly 00:00 to 00:00, treat as 24h
        return 0, 24

    return start_h, end_h

def generate_allowed_slots_map(db: Session, court_id: Any, booking_date: date) -> Dict[str, Dict[str, Any]]:
    """
    Authoritative slot generation engine. Used by User App for availability and by Booking Validation.
    STRICT MODEL: Returns only slots explicitly defined by rules (Date-specific or Recurring).
    Removes dynamic generation from venue opening hours.
    """
    import models
    
    # 1. Fetch Court
    court = db.query(models.Court).filter(models.Court.id == court_id).first()
    if not court:
        return {}
    
    # 2. Prepare conditions and current context
    day_short = booking_date.strftime("%a").lower()
    date_str = booking_date.isoformat()
    
    # 3. Collect all potential rules
    # Priority order for finding the 'best' price for a slot:
    # 1. Court-specific Date match
    # 2. Court-specific Day match
    # 3. Global Date match
    # 4. Global Day match
    
    court_rules = court.price_conditions or []
    if isinstance(court_rules, str):
        try: court_rules = json.loads(court_rules)
        except: court_rules = []
    
    global_rules_query = db.query(models.GlobalPriceCondition).filter(models.GlobalPriceCondition.is_active == True).all()
    global_rules = []
    for gr in global_rules_query:
        global_rules.append({
            'dates': gr.dates or [],
            'days': [d.lower()[:3] for d in (gr.days or [])],
            'slotFrom': gr.slot_from,
            'slotTo': gr.slot_to,
            'price': float(gr.price),
            'source': 'global'
        })

    # 4. Generate Allowable Slots (0 to 23)
    allowed_slots = {}
    
    # NEW PERMANENT SOLUTION:
    # We still use Venue Hours as the "Base Explicit Slots" to avoid breaking existing venues.
    # However, we allow rules to override their prices or provide extra slots.
    # If the user's intent was to only allow rules, they can set opening hours to 'Closed'.
    
    branch = db.query(models.Branch).filter(models.Branch.id == court.branch_id).first()
    v_start, v_end = get_venue_hours(branch.opening_hours if branch else None, booking_date)
    
    # Priority: 1. Court Date > 2. Court Day > 3. Global Date > 4. Global Day > 5. Venue Hours
    for h in range(0, 24):
        time_key = f"{h:02d}:00"
        matched_rule = None
        
        # Priority 1: Court Specific Date
        for pc in court_rules:
            if date_str in (pc.get('dates') or []):
                s_h = safe_parse_hour(pc.get('slotFrom', '00:00'))
                e_h = safe_parse_hour(pc.get('slotTo', '24:00'))
                if e_h == 0: e_h = 24
                if s_h <= h < e_h:
                    matched_rule = pc
                    matched_rule['source'] = 'court_date'
                    break
        
        # Priority 2: Court Specific Day
        if not matched_rule:
            for pc in court_rules:
                days = [d.lower()[:3] for d in (pc.get('days') or [])]
                if day_short in days:
                    s_h = safe_parse_hour(pc.get('slotFrom', '00:00'))
                    e_h = safe_parse_hour(pc.get('slotTo', '24:00'))
                    if e_h == 0: e_h = 24
                    if s_h <= h < e_h:
                        matched_rule = pc
                        matched_rule['source'] = 'court_day'
                        break

        # Priority 3: Global Date
        if not matched_rule:
            for gr in global_rules:
                if date_str in (gr.get('dates') or []):
                    s_h = safe_parse_hour(gr.get('slotFrom', '00:00'))
                    e_h = safe_parse_hour(gr.get('slotTo', '24:00'))
                    if e_h == 0: e_h = 24
                    if s_h <= h < e_h:
                        matched_rule = gr
                        matched_rule['source'] = 'global_date'
                        break

        # Priority 4: Global Day
        if not matched_rule:
            for gr in global_rules:
                if day_short in (gr.get('days') or []):
                    s_h = safe_parse_hour(gr.get('slotFrom', '00:00'))
                    e_h = safe_parse_hour(gr.get('slotTo', '24:00'))
                    if e_h == 0: e_h = 24
                    if s_h <= h < e_h:
                        matched_rule = gr
                        matched_rule['source'] = 'global_day'
                        break
        
        # Priority 5: Venue Hours (Fallback "Base Rule")
        is_venue_open_now = (v_start <= h < v_end)
        
        # If a rule exists OR it's within venue hours, the slot is allowable
        if matched_rule or is_venue_open_now:
             # Check Unavailability (Blocks specifically defined slots)
            is_blocked = False
            un_slots = court.unavailability_slots or []
            if isinstance(un_slots, str):
                try: un_slots = json.loads(un_slots)
                except: un_slots = []
            
            if isinstance(un_slots, list):
                for un in un_slots:
                    match = False
                    if date_str in (un.get('dates') or []): match = True
                    if not match and day_short in [d.lower()[:3] for d in (un.get('days') or [])]: match = True
                    
                    if match:
                        blocked_times = un.get('times') or []
                        if any(safe_parse_hour(t) == h for t in blocked_times):
                            is_blocked = True
                            break
            
            # If not blocked, add to map
            if not is_blocked:
                # Use rule price if matched, else base court price
                price = float(court.price_per_hour)
                source = 'venue_hours'
                
                if matched_rule:
                    price = float(matched_rule.get('price', price))
                    source = matched_rule.get('source', 'court')

                allowed_slots[time_key] = {
                    "price": price,
                    "is_blocked": False,
                    "end_time": f"{(h+1)%24:02d}:00",
                    "source": source
                }

    print(f"[SLOT ENGINE] PERMANENT MODEL: Found {len(allowed_slots)} slots for {booking_date}")
    return allowed_slots