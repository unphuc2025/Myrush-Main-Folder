from sqlalchemy.orm import Session
from datetime import datetime, date, time
from typing import List, Optional, Tuple
import models
import json
from uuid import UUID
from utils.booking_utils import safe_parse_time_float

def check_court_availability_conflict(
    db: Session,
    court_id: UUID,
    block_date: date,
    start_time: time,
    end_time: time,
    slice_mask: int = 0,
    blocked_capacity: Optional[int] = None,
    exclude_booking_id: Optional[UUID] = None,
    exclude_block_id: Optional[UUID] = None
) -> Optional[str]:

    """
    Universal conflict detection. Returns a string description of the conflict if found, else None.
    Checks:
    1. Other manual blocks (admin_court_blocks)
    2. Active user bookings (booking)
    Handles shared group siblings, overlaps, and capacity-based logic.
    """
    # 1. Fetch the court and identify all related courts (shared groups)
    court = db.query(models.Court).filter(models.Court.id == court_id).first()
    if not court:
        return "Court not found"

    related_court_ids = [court_id]
    if court.shared_group_id:
        siblings = db.query(models.Court.id).filter(models.Court.shared_group_id == court.shared_group_id).all()
        related_court_ids = [c[0] for c in siblings]

    is_capacity_court = court.logic_type == 'capacity'
    total_capacity = court.capacity_limit or 1
    target_capacity = blocked_capacity or 0 
    # If it's a manual total block (target_capacity=0 on non-capacity or explicitly 0 on capacity), it means full block
    is_full_block = (target_capacity == 0)

    court_full_mask = (1 << (court.total_zones or 1)) - 1
    target_mask = slice_mask or 0

    log_msg = f"\n[{datetime.now()}] CONFLICT CHECK: Court={court.name}, Date={block_date}, Time={start_time}-{end_time}, Mask={target_mask}, Cap={target_capacity}\n"
    log_msg += f"  Type: {court.logic_type}, TotalCap: {total_capacity}\n"

    # 2. Check Existing Manual Blocks
    existing_blocks_q = db.query(models.CourtBlock).filter(
        models.CourtBlock.court_id.in_(related_court_ids),
        models.CourtBlock.block_date == block_date
    )
    if exclude_block_id:
        existing_blocks_q = existing_blocks_q.filter(models.CourtBlock.id != exclude_block_id)
    
    existing_blocks = existing_blocks_q.all()
    
    # NEW: Track occupied capacity in this time range for capacity courts
    current_blocked_capacity = 0

    for eb in existing_blocks:
        if not eb.start_time or not eb.end_time:
             continue
             
        if max(eb.start_time, start_time) < min(eb.end_time, end_time):
            if is_capacity_court:
                eb_cap = eb.blocked_capacity or 0
                if eb_cap == 0: # Full block
                    if is_full_block or target_capacity > 0:
                        return f"Conflict: Facility is already fully blocked by another admin ({eb.start_time}-{eb.end_time})"
                    # Should not reachable since we check cap below
                current_blocked_capacity += eb_cap or total_capacity
            else:
                eb_mask = eb.slice_mask or 0
                if eb_mask == 0: eb_mask = court_full_mask
                if target_mask == 0 or eb_mask == 0 or (target_mask & eb_mask) != 0:
                    return f"Conflict: Overlaps with manual block ({eb.start_time}-{eb.end_time}, Mask={eb_mask})"

    # 3. Check Active User Bookings
    from sqlalchemy import or_
    active_bookings_q = db.query(models.Booking).filter(
        models.Booking.court_id.in_(related_court_ids),
        models.Booking.booking_date == block_date,
        or_(
            models.Booking.status.is_(None),
            models.Booking.status.notin_(['cancelled', 'failed', 'refunded'])
        )
    )
    if exclude_booking_id:
        active_bookings_q = active_bookings_q.filter(models.Booking.id != exclude_booking_id)
        
    active_bookings = active_bookings_q.all()
    
    current_booked_capacity = 0

    for ab in active_bookings:
        t_slots = ab.time_slots
        if isinstance(t_slots, str):
            try: t_slots = json.loads(t_slots)
            except: t_slots = []
        
        b_mask = ab.slice_mask or 0
        if b_mask == 0: b_mask = court_full_mask

        time_overlap = False
        conflict_details = ""

        if isinstance(t_slots, list) and len(t_slots) > 0:
            for slot in t_slots:
                s_str = slot.get('start_time') or slot.get('time') or slot.get('start') or slot.get('startTime')
                e_str = slot.get('end_time') or slot.get('end') or slot.get('endTime')
                if not s_str or not e_str: continue

                try:
                    s_f = safe_parse_time_float(s_str)
                    e_f = safe_parse_time_float(e_str)
                    b_start = time(int(s_f), int(round((s_f % 1) * 60)))
                    b_end = time(23, 59, 59) if e_f >= 24.0 else time(int(e_f), int(round((e_f % 1) * 60)))
                    
                    if max(b_start, start_time) < min(b_end, end_time):
                        time_overlap = True
                        conflict_details = f"{s_str}-{e_str}"
                        break
                except Exception: continue
        else:
            st = getattr(ab, 'start_time', None)
            et = getattr(ab, 'end_time', None)
            if st and et:
                if max(st, start_time) < min(et, end_time):
                    time_overlap = True
                    conflict_details = f"{st}-{et}"

        if time_overlap:
            if is_capacity_court:
                # User bookings on capacity courts usually take 1 ticket/slot
                # However we need to check if they have a 'quantity' or something? 
                # Assuming 1 for now or taking sum of tickets.
                # If ab has 'num_tickets', use it. (Added for multi-booking support)
                num_tickets = getattr(ab, 'num_tickets', 1) or 1
                current_booked_capacity += num_tickets
            else:
                if target_mask == 0 or b_mask == 0 or (target_mask & b_mask) != 0:
                    return f"Conflict: Overlaps with Booking {ab.booking_display_id or ab.id} ({conflict_details}, Mask={b_mask})"

    # Final Capacity Validation
    if is_capacity_court:
        total_occupied = current_blocked_capacity + current_booked_capacity
        if is_full_block:
            if total_occupied > 0:
                return f"Conflict: Cannot block entire facility. {total_occupied} capacity is already occupied ({current_booked_capacity} by users, {current_blocked_capacity} by admin)."
        else:
            if total_occupied + target_capacity > total_capacity:
                available = total_capacity - total_occupied
                return f"Conflict: Only {available} capacity remaining. You requested to block {target_capacity}."

    return None

