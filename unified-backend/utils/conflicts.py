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
    exclude_booking_id: Optional[UUID] = None,
    exclude_block_id: Optional[UUID] = None
) -> Optional[str]:

    """
    Universal conflict detection. Returns a string description of the conflict if found, else None.
    Checks:
    1. Other manual blocks (admin_court_blocks)
    2. Active user bookings (booking)
    Handles shared group siblings and overlaps.
    """
    # 1. Fetch the court and identify all related courts (shared groups)
    court = db.query(models.Court).filter(models.Court.id == court_id).first()
    if not court:
        return "Court not found"

    related_court_ids = [court_id]
    if court.shared_group_id:
        siblings = db.query(models.Court.id).filter(models.Court.shared_group_id == court.shared_group_id).all()
        related_court_ids = [c[0] for c in siblings]

    court_full_mask = (1 << (court.total_zones or 1)) - 1
    target_mask = slice_mask or 0

    log_msg = f"\n[{datetime.now()}] CONFLICT CHECK: Court={court.name}, Date={block_date}, Time={start_time}-{end_time}, Mask={target_mask}\n"
    log_msg += f"  Related Courts: {related_court_ids}\n"

    # 2. Check Existing Manual Blocks
    existing_blocks_q = db.query(models.CourtBlock).filter(
        models.CourtBlock.court_id.in_(related_court_ids),
        models.CourtBlock.block_date == block_date
    )
    if exclude_block_id:
        existing_blocks_q = existing_blocks_q.filter(models.CourtBlock.id != exclude_block_id)
    
    existing_blocks = existing_blocks_q.all()
    log_msg += f"  Found {len(existing_blocks)} manual blocks\n"

    for eb in existing_blocks:
        # Robust time comparison
        # Ensure eb.start_time and eb.end_time are not None
        if not eb.start_time or not eb.end_time:
             continue
             
        if max(eb.start_time, start_time) < min(eb.end_time, end_time):
            eb_mask = eb.slice_mask or 0
            # A mask of 0 in the DB usually means full court block (all bits)
            if eb_mask == 0: eb_mask = court_full_mask
            
            # Conflict if either is full-court OR if specific bits overlap
            if target_mask == 0 or eb_mask == 0 or (target_mask & eb_mask) != 0:
                msg = f"Conflict: Overlaps with manual block ({eb.start_time}-{eb.end_time}, Mask={eb_mask})"
                log_msg += f"  !! {msg}\n"
                with open("conflict_debug.log", "a") as f: f.write(log_msg)
                return msg

    # 3. Check Active User Bookings
    from sqlalchemy import or_
    # We check for all bookings that are NOT explicitly cancelled, failed, or refunded.
    # We also include specifically confirmed/paid ones as priority.
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
    log_msg += f"  Found {len(active_bookings)} active bookings\n"

    for ab in active_bookings:
        t_slots = ab.time_slots
        if isinstance(t_slots, str):
            try: t_slots = json.loads(t_slots)
            except: t_slots = []
        
        b_mask = ab.slice_mask or 0
        if b_mask == 0: b_mask = court_full_mask

        time_overlap = False
        conflict_details = ""

        # Check multi-slot configuration
        if isinstance(t_slots, list) and len(t_slots) > 0:
            for slot in t_slots:
                s_str = slot.get('start_time') or slot.get('time') or slot.get('start') or slot.get('startTime')
                e_str = slot.get('end_time') or slot.get('end') or slot.get('endTime')
                if not s_str or not e_str: continue

                try:
                    s_f = safe_parse_time_float(s_str)
                    e_f = safe_parse_time_float(e_str)
                    # Convert to time object for standard comparison
                    b_start = time(int(s_f), int(round((s_f % 1) * 60)))
                    # Handle midnight/24:00 edge case
                    if e_f >= 24.0:
                         b_end = time(23, 59, 59)
                    else:
                         b_end = time(int(e_f), int(round((e_f % 1) * 60)))
                    
                    if max(b_start, start_time) < min(b_end, end_time):
                        time_overlap = True
                        conflict_details = f"Slot:{s_str}-{e_str}"
                        break
                except Exception as e:
                    log_msg += f"    Error parsing slot {slot}: {e}\n"
                    continue
        else:
            # Fallback for legacy single-time bookings
            st = getattr(ab, 'start_time', None)
            et = getattr(ab, 'end_time', None)
            if st and et:
                if max(st, start_time) < min(et, end_time):
                    time_overlap = True
                    conflict_details = f"Legacy:{st}-{et}"

        if time_overlap:
            # If time overlaps, check if masks overlap
            if target_mask == 0 or b_mask == 0 or (target_mask & b_mask) != 0:
                msg = f"Conflict: Overlaps with Booking {ab.booking_display_id or ab.id} ({conflict_details}, Mask={b_mask})"
                log_msg += f"  !! {msg}\n"
                with open("conflict_debug.log", "a") as f: f.write(log_msg)
                return msg

    log_msg += "  PASSED\n"
    with open("conflict_debug.log", "a") as f: f.write(log_msg)
    return None

