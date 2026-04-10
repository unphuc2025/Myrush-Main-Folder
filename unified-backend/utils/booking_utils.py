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

    day_name_full = booking_date.strftime("%A").lower()
    day_name_short = day_name_full[:3]
    day_config = None

    if isinstance(opening_hours, dict):
        # 1. Broadest possible day-key match (lowercase, capitalized, short, etc.)
        possible_keys = [day_name_full, day_name_full.capitalize(), day_name_short, day_name_short.capitalize(), 'default']
        for key in possible_keys:
            if key in opening_hours:
                day_config = opening_hours[key]
                break
    elif isinstance(opening_hours, list):
        # 2. Iterate through list to find matching day
        for item in opening_hours:
            if isinstance(item, dict):
                item_day = str(item.get('day', '')).lower()
                if item_day in (day_name_full, day_name_short):
                    day_config = item
                    break
    
    # 3. Robust Config Field Extraction
    if not day_config:
        return 0.0, 24.0 # Default fallback for unconfigured days? Or 0.0, 0.0 for "Closed"?
        # User said they added timings, so if we can't find it, we might be hitting an unconfigured day.
        # But for 'perfect fetch', we assume unconfigured means closed, or 24h depending on project policy.
        # Given the 24h complaint, let's keep it 24h only if opening_hours is literally empty.

    # 4. Check Activity State
    # Support 'isActive', 'active', 'is_active', or presence of times
    is_active = day_config.get('isActive')
    if is_active is None: is_active = day_config.get('active')
    if is_active is None: is_active = day_config.get('is_active')
    if is_active is False:
        return 0.0, 0.0
    
    # 5. Support various start/end time formats: startTime, open, start, from, to...
    s_str = day_config.get('startTime') or day_config.get('open') or day_config.get('start') or day_config.get('from') or '00:00'
    e_str = day_config.get('endTime') or day_config.get('close') or day_config.get('end') or day_config.get('to')
    
    start_h = safe_parse_time_float(s_str)
    
    if e_str in ('23:59', '00:00', '24:00', '12:00 AM', None, '23:30'):
        end_h = 24.0
    else:
        end_h = safe_parse_time_float(e_str)
        if end_h == 0: end_h = 24.0

    return start_h, end_h

def get_consolidated_occupied_mask(db: Session, booking_date: date, shared_group_id: Any = None, court_id: Any = None) -> Dict[str, int]:
    """
    Calculate the aggregate occupied mask for a shared group OR a specific court.
    This ensures that the 'booking' table is the single source of truth,
    avoiding synchronization issues with the cached 'occupied_mask' in the 'slots' table.
    Returns a mapping of "HH:MM" -> mask.
    """
    import models
    from uuid import UUID
    
    # 1. Identify all courts that should contribute to this mask
    # 1. Identify all courts that should contribute to this mask
    if shared_group_id:
        from uuid import UUID
        cid_query = db.query(models.Court.id).filter(models.Court.shared_group_id == (UUID(str(shared_group_id)) if shared_group_id else None))
        group_courts = cid_query.all()
        court_ids = [c[0] for c in group_courts]
    elif court_id:
        # Standard: Just this court's ID
        court_ids = [court_id]
    else:
        return {}, {}

    # 2. Fetch all active bookings for these courts using RAW SQL as fail-safe for ORM issues
    # Join with admin_courts to get total_zones
    from sqlalchemy import text
    sql = text("""
        SELECT b.slice_mask, b.time_slots, c.total_zones, b.id, c.logic_type, c.capacity_limit, b.number_of_players
        FROM booking b
        LEFT JOIN admin_courts c ON b.court_id = c.id
        WHERE b.court_id = ANY(CAST(:c_ids AS uuid[]))
        AND b.booking_date = CAST(:d AS date)
        AND (
            (b.status NOT IN ('cancelled', 'failed') OR b.status IS NULL)
            AND (
                b.payment_status != 'pending' 
                OR b.created_at > (NOW() AT TIME ZONE 'UTC' - INTERVAL '10 minutes')
            )
        )
    """)
    
    group_bookings = db.execute(sql, {"c_ids": [str(cid) for cid in court_ids], "d": str(booking_date)}).fetchall()

    # 3. Build a map of 48 x 30-min slots
    aggregate_masks = {}
    aggregate_players = {}
    for i in range(48):
        h = i * 0.5
        time_key = f"{int(h):02d}:{int((h % 1) * 60):02d}"
        aggregate_masks[time_key] = 0
        aggregate_players[time_key] = 0

    # 4. Populate with booking masks
    for b_slice_mask, b_time_slots, c_total_zones, b_id, c_logic_type, c_capacity_limit, b_number_of_players in group_bookings:
        # Determine the mask for this booking
        mask = b_slice_mask
        if mask is None or mask == 0:
            mask = (1 << (c_total_zones or 1)) - 1
            
        n_players = b_number_of_players or 1
        is_capacity = (c_logic_type == 'capacity')
        
        t_slots = b_time_slots
        if isinstance(t_slots, str):
            try: 
                import json
                parsed = json.loads(t_slots)
                if isinstance(parsed, (list, dict)):
                    t_slots = parsed
            except: pass
        
        def apply_to_slot(tk):
            if is_capacity:
                aggregate_players[tk] += n_players
                # Fallback to mask if limit reached
                limit = c_capacity_limit or 1
                if aggregate_players[tk] >= limit:
                    aggregate_masks[tk] |= (mask or 0)
            else:
                aggregate_masks[tk] |= (mask or 0)

        if isinstance(t_slots, list):
            for slot in t_slots:
                if isinstance(slot, dict):
                    t_str = slot.get('start_time') or slot.get('time') or slot.get('start')
                    if t_str:
                        try:
                            f = safe_parse_time_float(t_str)
                            tk = f"{int(f):02d}:{int((f % 1) * 60):02d}"
                            if tk in aggregate_masks:
                                apply_to_slot(tk)
                        except: pass
        elif isinstance(t_slots, str) and "-" in t_slots:
            # Handle legacy range format like "11:00:00-12:00:00"
            try:
                start_part = t_slots.split("-")[0].strip()
                start_f = safe_parse_time_float(start_part)
                end_part = t_slots.split("-")[1].strip()
                end_f = safe_parse_time_float(end_part)
                
                # Assume 30-min increments for legacy ranges
                curr = start_f
                while curr < end_f:
                    tk = f"{int(curr):02d}:{int((curr % 1) * 60):02d}"
                    if tk in aggregate_masks:
                        apply_to_slot(tk)
                    curr += 0.5
            except: pass
    
    return aggregate_masks, aggregate_players

def ensure_slots_for_date(db: Session, court_id: Any, booking_date: date):
    import models
    existing_slots = db.query(models.Slot).filter(
        models.Slot.court_id == court_id,
        models.Slot.slot_date == booking_date
    ).all()
    
    if len(existing_slots) < 48:
        existing_times = {s.start_time.strftime("%H:%M") for s in existing_slots}
        new_slots = []
        for i in range(48):
            h_start = i * 0.5
            hh = int(h_start)
            mm = int((h_start % 1) * 60)
            t_str = f"{hh:02d}:{mm:02d}"
            
            if t_str not in existing_times:
                s_time = time(hh, mm)
                ehh = int((i + 1) * 0.5) % 24
                emm = int((((i + 1) * 0.5) % 1) * 60)
                e_time = time(ehh, emm)
                new_slots.append(
                    models.Slot(
                        court_id=court_id,
                        slot_date=booking_date,
                        start_time=s_time,
                        end_time=e_time,
                        occupied_mask=0
                    )
                )
        if new_slots:
            db.bulk_save_objects(new_slots)
            db.commit()
            
        existing_slots = db.query(models.Slot).filter(
            models.Slot.court_id == court_id,
            models.Slot.slot_date == booking_date
        ).all()
    
    return {s.start_time.strftime("%H:%M"): s for s in existing_slots}

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
    
    # NEW: Fetch DB Slots & Slices
    slots_db_map = ensure_slots_for_date(db, court_id, booking_date)
    sport_slices = db.query(models.SportSlice).filter(models.SportSlice.court_id == court_id).all()
    slices_data = [{"id": str(s.id), "name": s.name, "mask": s.mask, "sport_id": str(s.sport_id), "sport_name": s.sport.name if s.sport else None, "price_per_hour": float(s.price_per_hour) if s.price_per_hour is not None else None} for s in sport_slices]
    
    price_rules = court.price_conditions or []
    if isinstance(price_rules, str):
        try: price_rules = json.loads(price_rules)
        except: price_rules = []
    
    # NEW: Fetch Consolidated Occupied Mask (Source of Truth)
    # This replaces the need for per-court caching in the 'slots' table
    # or separate group aggregation calls.
    group_aggregate_masks, group_aggregate_players = get_consolidated_occupied_mask(
        db, 
        booking_date, 
        shared_group_id=court.shared_group_id,
        court_id=court.id if not court.shared_group_id else None
    )

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
    
    now_ist = get_now_ist()
    is_today = (booking_date == now_ist.date())

    # Generate 48 slots
    for i in range(0, 48):
        h_start = i * 0.5
        
        # Past slots filter - DO INSIDE GENERATION ENGINE BEFORE ANY OTHER LOGIC
        if is_today:
            if h_start < (now_ist.hour + now_ist.minute/60.0):
                continue
        h_end = (i + 1) * 0.5
        
        hh = int(h_start)
        mm = int((h_start % 1) * 60)
        time_key = f"{hh:02d}:{mm:02d}"
        
        matched_rule = None
        
        # Priority: Court Date > Court Day > Global Date > Global Day
        # 1. Court Date
        for pc in price_rules:
            if date_str in (pc.get('dates') or []):
                if safe_parse_time_float(pc.get('slotFrom')) <= h_start < (safe_parse_time_float(pc.get('slotTo')) or 24.0):
                    matched_rule = pc; matched_rule['source'] = 'court_date'; break
        
        # 2. Court Day
        if not matched_rule:
            for pc in price_rules:
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
        
        # Determine if court has ANY specific timings (rules) for this day
        # If it does, we should ONLY allow slots that match those rules.
        # If it doesn't, we follow the Branch hours.
        court_has_specific_timings = any(
            (date_str in (pc.get('dates') or [])) or 
            (day_short in [d.lower()[:3] for d in (pc.get('days') or [])])
            for pc in price_rules
        )
        
        # Check Venue Hours Boundary
        is_venue_open_now = (v_start <= h_start < v_end)
        
        # FINAL ALLOWANCE LOGIC:
        # A slot is visible IF:
        # 1. It is within venue (branch) opening hours boundary
        # 2. IF court has specific timings added, it MUST match one (matched_rule is court-specific)
        is_allowed = is_venue_open_now
        if is_allowed and court_has_specific_timings:
            # If rules exist, only allow if matched_rule is from a court-specific source
            is_allowed = (matched_rule and matched_rule['source'] in ('court_date', 'court_day'))

        if is_allowed:
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
                price = float(matched_rule.get('price', base_price)) if matched_rule else base_price
                
                ehh = int(h_end)
                emm = int((h_end % 1) * 60)
                
                # Fetch Consolidated Bitmask State
                occupied = group_aggregate_masks.get(time_key, 0)
                booked_capacity = group_aggregate_players.get(time_key, 0)
                slot_row = slots_db_map.get(time_key)
                
                total_zones = court.total_zones or 1
                
                slices_status = []
                for s in slices_data:
                    s_mask = s.get('mask') or s.get('slice_mask') or 0
                    slices_status.append({
                        "id": s['id'],
                        "name": s['name'],
                        "mask": s_mask,
                        "sport_id": s.get('sport_id'),
                        "sport_name": s.get('sport_name'),
                        "price_per_hour": float(s['price_per_hour']) if s.get('price_per_hour') else None,
                        "is_available": (occupied & s_mask) == 0 if s_mask else True
                    })
                
                # Calculate display times for 12-hour format
                sh_disp = hh % 12 or 12
                ampm_s = "AM" if hh < 12 else "PM"
                
                eh_full = int(h_end)
                m_e = int((h_end % 1) * 60)
                eh_disp = eh_full % 12 or 12
                ampm_e = "AM" if eh_full < 12 else "PM"

                allowed_slots[time_key] = {
                    "time": time_key,
                    "display_time": f"{sh_disp:02d}:{mm:02d} {ampm_s} - {eh_disp:02d}:{m_e:02d} {ampm_e}",
                    "price": (float(matched_rule['price']) if matched_rule else float(court.price_per_hour)) / 2.0,
                    "is_blocked": is_blocked,
                    "source": matched_rule.get('source', 'venue_hours') if matched_rule else 'venue_hours',
                    "slot_id": str(slot_row.id) if slot_row else None,
                    "occupied_mask": occupied,
                    "booked_capacity": booked_capacity,
                    "capacity_limit": court.capacity_limit or 1,
                    "logic_type": court.logic_type or 'independent',
                    "total_zones": total_zones,
                    "slices": slices_status
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

def calculate_multi_slice_price(server_slot: dict, slice_mask: int, default_base_price: float) -> float:
    """
    Sum the prices of all slices that match the given mask.
    If no slices are provided or mask is 0, use the base price.
    """
    if not slice_mask:
        return default_base_price
    
    slices = server_slot.get('slices', [])
    if not slices:
        return default_base_price
    
    # 1. Look for an exact mask match (e.g., "Full Court")
    exact_match = next((s for s in slices if s['mask'] == slice_mask), None)
    if exact_match and exact_match.get('price_per_hour') is not None:
        return float(exact_match['price_per_hour']) / 2.0
        
    # 2. Sum disjoint individual slices
    total_price = 0.0
    matched_any = False
    
    # We iterate through the slices to find the "smallest" units.
    # Slices with single-bit masks are prioritized for summing to avoid double counting
    # if a larger aggregate slice exists but doesn't exactly match the multi-select mask.
    for s in slices:
        s_mask = s.get('mask', 0)
        # Check if this slice is a subset of the requested mask
        if s_mask > 0 and (s_mask & slice_mask) == s_mask:
             # Check if it's a "leaf" slice (single bit) - this is a heuristic
             # for multi-court venues where users select Court 1, Court 2, etc.
             # If the mask has only one bit set, it's definitely a leaf.
             is_single_bit = (s_mask & (s_mask - 1)) == 0
             if is_single_bit:
                 if s.get('price_per_hour') is not None:
                     total_price += float(s['price_per_hour']) / 2.0
                     matched_any = True
    
    if matched_any:
        return total_price
        
    # 3. Final Fallback
    return default_base_price