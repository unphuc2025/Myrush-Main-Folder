from datetime import datetime, time, date, timedelta
import json
import re
from typing import List, Dict, Any, Optional, Set
from sqlalchemy.orm import Session

def get_now_ist() -> datetime:
    """Get current time in Indian Standard Time (IST) using UTC offset."""
    # Asia/Kolkata is UTC+5:30
    return datetime.utcnow() + timedelta(hours=5, minutes=30)

def validate_slot_not_past(booking_date: date, start_time_str: str):
    """
    Ensure the requested slot is not too far in the past.
    Allows for a 45-minute grace period.
    """
    from fastapi import HTTPException
    now_ist = get_now_ist()
    
    if booking_date < now_ist.date():
        raise HTTPException(status_code=400, detail="Cannot book a slot on a past date.")
    
    if booking_date == now_ist.date():
        slot_start = safe_parse_time_float(start_time_str)
        hh = int(slot_start)
        mm = int((slot_start % 1) * 60)
        
        slot_dt = datetime.combine(booking_date, time(hh, mm))
        grace_limit = now_ist - timedelta(minutes=45)
        
        if slot_dt < grace_limit:
            print(f"[PAST CHECK FAIL] Slot {start_time_str} is too old. Now={now_ist}, Limit={grace_limit}")
            raise HTTPException(status_code=400, detail="This slot has already started or passed. Please choose a later time.")

def safe_parse_time_float(time_str: str) -> float:
    """
    Robustly extract time as float (e.g. 10:30 -> 10.5) from a time string.
    """
    if not time_str:
        return 0.0
    
    time_str = str(time_str).strip().upper()
    
    # 1. Handle AM/PM formats
    match = re.search(r'(\d+):?(\d*)?\s*(AM|PM)', time_str)
    if match:
        hour = int(match.group(1))
        minute = int(match.group(2) or 0)
        ampm = match.group(3)
        if ampm == 'PM' and hour != 12:
            hour += 12
        elif ampm == 'AM' and hour == 12:
            hour = 0
        return (hour % 24) + (minute / 60.0)
    
    # 2. Handle 24h formats HH:MM or HH:MM:SS
    match = re.search(r'(\d{1,2}):(\d{2})', time_str)
    if match:
        hour = int(match.group(1))
        minute = int(match.group(2))
        return (hour % 24) + (minute / 60.0)
    
    # 3. Simple integer string
    if time_str.isdigit():
        return float(time_str) % 24.0
    
    try:
        parts = time_str.split(':')
        h = int(parts[0]) % 24
        m = int(parts[1]) if len(parts) > 1 else 0
        return h + (m / 60.0)
    except:
        return 0.0

def safe_parse_hour(time_str: str) -> int:
    return int(safe_parse_time_float(time_str))

def get_booked_slots(active_bookings: list) -> set:
    """
    Unified logic for extracting booked 30-min slots from a list of booking models.
    Returns a set of slot start times (floats like 10.0, 10.5).
    """
    booked_slots = set()
    print(f"[BOOKING UTILS] Processing {len(active_bookings)} active bookings for 30-min granularity...")
    
    for b in active_bookings:
        # 1. Try time_slots JSON
        t_slots = b.time_slots
        if isinstance(t_slots, str):
            try: t_slots = json.loads(t_slots)
            except: t_slots = []
        
        if t_slots and isinstance(t_slots, list):
            for slot in t_slots:
                if isinstance(slot, dict):
                    t_str = slot.get('start_time') or slot.get('time') or slot.get('start')
                    if t_str:
                        slot_start = safe_parse_time_float(t_str)
                        booked_slots.add(slot_start)
                        print(f"  Booking {getattr(b, 'booking_display_id', b.id)}: Slot {t_str} -> {slot_start}")
        else:
            # 2. Fallback for legacy bookings
            try:
                start_val = getattr(b, 'start_time', None) or getattr(b, '_old_start_time', None)
                duration = getattr(b, 'duration_minutes', None) or getattr(b, '_old_duration_minutes', None) or 60
                
                if start_val:
                    if isinstance(start_val, str):
                        start_f = safe_parse_time_float(start_val)
                    else:
                        start_f = start_val.hour + (start_val.minute / 60.0)
                    
                    num_half_hours = (int(duration) + 29) // 30
                    for i in range(num_half_hours):
                        s = (start_f + (i * 0.5)) % 24
                        booked_slots.add(s)
                        print(f"  Booking {getattr(b, 'booking_display_id', b.id)} (Legacy): {start_val} + {duration}m -> Slot {s}")
            except Exception as e:
                print(f"[BOOKING UTILS] Error parsing legacy booking {getattr(b, 'id', 'unknown')}: {e}")
                
    print(f"[BOOKING UTILS] Final booked slots: {sorted(list(booked_slots))}")
    return booked_slots

def get_venue_hours(opening_hours: Any, booking_date: date) -> tuple:
    """
    Extract opening and closing hours for a specific date (HH.F format).
    """
    if not opening_hours:
        return 0.0, 24.0

    if isinstance(opening_hours, str):
        try: opening_hours = json.loads(opening_hours)
        except: return 0.0, 24.0

    day_name = booking_date.strftime("%A").lower()
    day_config = None

    if isinstance(opening_hours, dict):
        day_config = opening_hours.get(day_name)
    elif isinstance(opening_hours, list):
        for item in opening_hours:
            if isinstance(item, dict) and str(item.get('day', '')).lower() == day_name:
                day_config = item
                break
    
    if not day_config or not day_config.get('isActive'):
        return 0.0, 0.0

    start_h = safe_parse_time_float(day_config.get('startTime') or '00:00')
    end_str = day_config.get('endTime')
    if end_str in ('23:59', '00:00', '24:00', '12:00 AM', None, '23:30'):
        end_h = 24.0
    else:
        end_h = safe_parse_time_float(end_str)
        if end_h == 0: end_h = 24.0

    return start_h, end_h

def generate_allowed_slots_map(db: Session, court_id: Any, booking_date: date) -> Dict[str, Dict[str, Any]]:
    """
    30-Minute Slot Engine. 
    Halves the 'price_per_hour' to get the 30-min slot price by default.
    """
    import models
    
    court = db.query(models.Court).filter(models.Court.id == court_id).first()
    if not court: return {}
    
    day_short = booking_date.strftime("%a").lower()
    date_str = booking_date.isoformat()
    
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

    allowed_slots = {}
    branch = db.query(models.Branch).filter(models.Branch.id == court.branch_id).first()
    v_start, v_end = get_venue_hours(branch.opening_hours if branch else None, booking_date)
    
    # Generate 48 slots
    for i in range(0, 48):
        h_start = i * 0.5
        h_end = (i + 1) * 0.5
        
        hh = int(h_start)
        mm = int((h_start % 1) * 60)
        time_key = f"{hh:02d}:{mm:02d}"
        
        matched_rule = None
        
        # Priority: Court Date > Court Day > Global Date > Global Day
        # 1. Court Date
        for pc in court_rules:
            if date_str in (pc.get('dates') or []):
                if safe_parse_time_float(pc.get('slotFrom')) <= h_start < (safe_parse_time_float(pc.get('slotTo')) or 24.0):
                    matched_rule = pc; matched_rule['source'] = 'court_date'; break
        
        # 2. Court Day
        if not matched_rule:
            for pc in court_rules:
                if day_short in [d.lower()[:3] for d in (pc.get('days') or [])]:
                    if safe_parse_time_float(pc.get('slotFrom')) <= h_start < (safe_parse_time_float(pc.get('slotTo')) or 24.0):
                        matched_rule = pc; matched_rule['source'] = 'court_day'; break

        # 3. Global Date
        if not matched_rule:
            for gr in global_rules:
                if date_str in (gr.get('dates') or []):
                    if safe_parse_time_float(gr.get('slotFrom')) <= h_start < (safe_parse_time_float(gr.get('slotTo')) or 24.0):
                        matched_rule = gr; matched_rule['source'] = 'global_date'; break

        # 4. Global Day
        if not matched_rule:
            for gr in global_rules:
                if day_short in (gr.get('days') or []):
                    if safe_parse_time_float(gr.get('slotFrom')) <= h_start < (safe_parse_time_float(gr.get('slotTo')) or 24.0):
                        matched_rule = gr; matched_rule['source'] = 'global_day'; break
        
        # Check Venue Hours
        is_venue_open_now = (v_start <= h_start < v_end)
        
        if matched_rule or is_venue_open_now:
            is_blocked = False
            un_slots = court.unavailability_slots or []
            if isinstance(un_slots, str):
                try: un_slots = json.loads(un_slots)
                except: un_slots = []
            
            if isinstance(un_slots, list):
                for un in un_slots:
                    # Date specific block
                    if un.get('date') == date_str:
                        if safe_parse_time_float(un.get('from')) <= h_start < (safe_parse_time_float(un.get('to')) or 24.0):
                            is_blocked = True; break
                    # Recurring block
                    match = (date_str in (un.get('dates') or [])) or (day_short in [d.lower()[:3] for d in (un.get('days') or [])])
                    if match and any(safe_parse_time_float(t) == h_start for t in (un.get('times') or [])):
                        is_blocked = True; break
            
            if not is_blocked:
                base_price = float(court.price_per_hour)
                # Slot is 30 mins, so price is half of hourly rate
                price = (float(matched_rule.get('price', base_price)) if matched_rule else base_price) / 2.0
                
                ehh = int(h_end)
                emm = int((h_end % 1) * 60)
                allowed_slots[time_key] = {
                    "price": price,
                    "is_blocked": False,
                    "end_time": f"{ehh:02d}:{emm:02d}",
                    "source": matched_rule.get('source', 'venue_hours') if matched_rule else 'venue_hours'
                }

    print(f"[SLOT ENGINE] 30-MIN MODEL: Found {len(allowed_slots)} slots for {booking_date}")
    return allowed_slots

def validate_booking_duration(slots: list):
    """
    Enforces the 1-hour minimum booking requirement (at least 2 consecutive 30-min slots).
    """
    from fastapi import HTTPException
    if not slots or len(slots) < 2:
        raise HTTPException(status_code=400, detail="Minimum booking duration is 1 hour (2 slots).")