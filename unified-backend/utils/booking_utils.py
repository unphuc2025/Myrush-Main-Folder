from sqlalchemy.orm import Session
from datetime import datetime, date, timezone, timedelta
from typing import List, Any, Dict, Set

def get_now_ist() -> datetime:
    """Returns the current current time in IST timezone"""
    ist = timezone(timedelta(hours=5, minutes=30))
    return datetime.now(ist)

def safe_parse_hour(time_str: str) -> int:
    """Safely extracts the hour integer from a time string."""
    try:
        if isinstance(time_str, int):
            return time_str
        return int(str(time_str).split(':')[0])
    except:
        raise ValueError(f"Invalid time format: {time_str}")

def get_booked_hours(active_bookings: List[Any]) -> Set[int]:
    """Extracts a set of booked hours from a list of active bookings."""
    booked_times = set()
    for b in active_bookings:
        if hasattr(b, 'time_slots') and b.time_slots:
            if isinstance(b.time_slots, list):
                for slot in b.time_slots:
                    if isinstance(slot, dict):
                        t_str = slot.get('start_time') or slot.get('time')
                    else:
                        t_str = str(slot)
                    if t_str:
                        try:
                            booked_times.add(safe_parse_hour(t_str))
                        except Exception:
                            pass
        else:
            # Fallback for legacy format if any
            if hasattr(b, 'start_time') and getattr(b, 'start_time'):
                try:
                    booked_times.add(b.start_time.hour)
                except:
                    pass
    return booked_times

def generate_allowed_slots_map(db: Session, court_id: str, booking_date: date) -> Dict[str, Dict[str, Any]]:
    """
    Generate authoritative allowed slots map with real prices and admin block status.
    Takes into account venue opening hours, court specific price conditions and unavailability.
    """
    from models import Court, Branch
    court = db.query(Court).filter(Court.id == court_id).first()
    if not court:
        return {}
    
    branch = db.query(Branch).filter(Branch.id == court.branch_id).first()
    if not branch:
        return {}

    # 1. Base slots from venue opening hours
    day_name = booking_date.strftime("%A").lower()
    day_short = booking_date.strftime("%a").lower()
    date_str = booking_date.strftime("%Y-%m-%d")

    opening_hours = branch.opening_hours or {}
    day_hours = opening_hours.get(day_name, {})
    
    if not day_hours or day_hours.get('is_closed', False):
        return {}
    
    open_time = day_hours.get('open', '00:00')
    close_time = day_hours.get('close', '23:59')
    
    start_hour = safe_parse_hour(open_time)
    end_hour = safe_parse_hour(close_time)
    if end_hour == 0 and close_time != "00:00":
        end_hour = 24
        
    slots_map = {}
    
    # Set default prices
    court_base_price = float(court.price_per_hour or 0)
    for h in range(start_hour, end_hour):
        h_str = f"{h:02d}:00"
        slots_map[h_str] = {
            "price": court_base_price,
            "is_blocked": False
        }
    
    # 2. Apply custom price conditions from admin panel
    price_conditions = court.price_conditions or []
    for pc in price_conditions:
        applies = False
        if 'dates' in pc and date_str in pc['dates']:
            applies = True
        elif 'days' in pc and day_short[:3] in [str(d).lower()[:3] for d in pc.get('days', [])]:
            applies = True
            
        if applies:
            pc_start = safe_parse_hour(pc.get('slotFrom', '00:00'))
            pc_end = safe_parse_hour(pc.get('slotTo', '24:00'))
            if pc_end == 0: pc_end = 24
            pc_price = float(pc.get('price', court_base_price))
            
            for h in range(pc_start, pc_end):
                h_str = f"{h:02d}:00"
                if h_str in slots_map:
                    slots_map[h_str]["price"] = pc_price

    # 3. Apply admin unavailability blocks
    unavail_slots = court.unavailability_slots or []
    for us in unavail_slots:
        applies = False
        if 'dates' in us and date_str in us['dates']:
            applies = True
        elif 'days' in us and day_short[:3] in [str(d).lower()[:3] for d in us.get('days', [])]:
            applies = True
            
        if applies:
            us_start = safe_parse_hour(us.get('slotFrom', '00:00'))
            us_end = safe_parse_hour(us.get('slotTo', '24:00'))
            if us_end == 0: us_end = 24
            
            for h in range(us_start, us_end):
                h_str = f"{h:02d}:00"
                if h_str in slots_map:
                    slots_map[h_str]["is_blocked"] = True

    return slots_map
