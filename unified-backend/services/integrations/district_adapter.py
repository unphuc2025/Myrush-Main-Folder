from typing import Any, Dict, List
from sqlalchemy.orm import Session
from uuid import UUID
import logging
from datetime import datetime, date, time as dt_time, timedelta
from .base_adapter import BaseIntegrationAdapter
import models
import schemas_district
from utils.booking_utils import generate_allowed_slots_map, get_booked_slots
import json
import uuid
import re

UUID_PATTERN = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)

class DistrictAdapter(BaseIntegrationAdapter):
    """
    Adapter specifically designed to handle District API translation and rules.
    Maps District's 30-min slot indices to MyRush's hourly slots.
    """

    def _get_branch_by_facility_name(self, facility_name: str) -> models.Branch:
        """Helper to find venue by exact District facility Name string"""
        branch = self.db.query(models.Branch).filter(models.Branch.name.ilike(facility_name)).first()
        if not branch:
            raise ValueError(f"Facility Name '{facility_name}' not found in MyRush.")
        return branch

    def _get_game_type_by_sport_name(self, sport_name: str) -> models.GameType:
        """Helper to find sport by exact District sport Name string"""
        st = self.db.query(models.GameType).filter(models.GameType.name.ilike(sport_name)).first()
        if not st:
            raise ValueError(f"Sport Name '{sport_name}' not found in MyRush.")
        return st

    def _get_slot_time_string(self, slot_number: int) -> str:
        """Converts slot number (30-min intervals) to ISO 24h format 'HH:MM - HH:MM'"""
        total_minutes_start = slot_number * 30
        total_minutes_end = (slot_number + 1) * 30
        
        def format_time_iso(minutes):
            h = (minutes // 60) % 24
            m = minutes % 60
            return f"{h:02d}:{m:02d}"

        return f"{format_time_iso(total_minutes_start)} - {format_time_iso(total_minutes_end)}"

    def _get_or_create_partner_user(self, name: str, phone: str, email: str) -> models.User:
        """Gets user by phone or creates a new one for District bookings"""
        user = self.db.query(models.User).filter(models.User.phone_number == phone).first()
        if not user:
            user = models.User(
                phone_number=phone,
                full_name=name,
                email=email if email else f"{phone}@district.temp",
                is_verified=True,  # Trusted via District
                is_active=True,
                profile_completed=False
            )
            self.db.add(user)
            self.db.flush()
        return user

    def __init__(self, db: Session, partner_id: str = None, skip_notifications: bool = False):
        self.db = db
        self.partner_id = partner_id
        self.skip_notifications = skip_notifications

    def check_availability(self, facility_name: str, sport_name: str, booking_date_str: str) -> Dict[str, Any]:
        """
        Implements GET /checkAvailability
        """
        branch = self._get_branch_by_facility_name(facility_name)
        sport = self._get_game_type_by_sport_name(sport_name)
        try:
            target_date = datetime.strptime(booking_date_str, "%d-%m-%Y").date()
        except ValueError:
            target_date = datetime.strptime(booking_date_str, "%Y-%m-%d").date()

        courts = self.db.query(models.Court).filter(
            models.Court.branch_id == branch.id,
            models.Court.game_type_id == sport.id,
            models.Court.is_active == True
        ).order_by(models.Court.created_at).all()
        
        if not courts:
            return {"date": booking_date_str, "slot_data": []}

        # Optimization 1: Pre-calculate availability maps
        court_allowed_maps = {}
        for court in courts:
            court_allowed_maps[court.id] = generate_allowed_slots_map(self.db, court.id, target_date)

        # Optimization 2: Fetch all bookings for the day for these courts AND their siblings in shared groups
        court_ids = [c.id for c in courts]
        
        # Find siblings in shared groups
        shared_group_ids = [UUID(str(c.shared_group_id)) for c in courts if c.shared_group_id]
        if shared_group_ids:
            all_relevant_courts = self.db.query(models.Court).filter(
                models.Court.shared_group_id.in_(shared_group_ids)
            ).all()
            relevant_court_ids = [c.id for c in all_relevant_courts]
            # Map for quick lookup: {sibling_id: parent_group_id}
            sibling_to_group = {c.id: UUID(str(c.shared_group_id)) for c in all_relevant_courts}
            court_id_to_obj = {c.id: c for c in all_relevant_courts}
        else:
            relevant_court_ids = court_ids
            sibling_to_group = {}
            court_id_to_obj = {c.id: c for c in courts}

        all_bookings = self.db.query(models.Booking).filter(
            models.Booking.court_id.in_(relevant_court_ids),
            models.Booking.booking_date == target_date,
            models.Booking.status.in_(['confirmed', 'pending', 'locked'])
        ).all()

        # New: Fetch manual admin blocks
        manual_blocks = self.db.query(models.CourtBlock).filter(
            models.CourtBlock.court_id.in_(relevant_court_ids),
            models.CourtBlock.block_date == target_date
        ).all()
        
        # Build lookup for blocks and bookings by court
        blocks_by_court = {cid: [] for cid in relevant_court_ids}
        for mb in manual_blocks:
            blocks_by_court[mb.court_id].append(mb)
        
        # Build lookup for booked slots by court: {court_id: {slot_start_f: slice_mask}}
        bookings_by_court_slots = {cid: {} for cid in relevant_court_ids}
        for b in all_bookings:
            for h in get_booked_slots([b]):
                bookings_by_court_slots[b.court_id][h] = b.slice_mask or 0

        slot_data_list = []
        
        for slot_num in range(0, 48):
            h = slot_num // 2
            m = (slot_num % 2) * 30
            time_key = f"{h:02d}:{m:02d}"
            slot_start_f = h + (m/60.0)
            slot_start_time = dt_time(h, m)
            
            try:
                court_entries = []
                for idx, court in enumerate(courts):
                    allowed_map = court_allowed_maps.get(court.id, {})
                    if time_key not in allowed_map:
                        continue
                    
                    # Check manual admin blocks (including siblings in shared group)
                    is_manual_blocked = False
                    relevant_block_court_ids = [court.id]
                    if court.shared_group_id:
                        c_group_id = UUID(str(court.shared_group_id))
                        relevant_block_court_ids = [cid for cid, gid in sibling_to_group.items() if gid == c_group_id]
                    
                    for bc_id in relevant_block_court_ids:
                        relevant_blocks = blocks_by_court.get(bc_id, [])
                        court_mask = court.slice_mask or 1
                        for block in relevant_blocks:
                            if block.start_time <= slot_start_time < block.end_time:
                                # Match by slice mask if present, otherwise assume it blocks the entire court
                                block_mask = block.slice_mask if block.slice_mask is not None and block.slice_mask > 0 else (1 << (court.total_zones or 1)) - 1
                                if (block_mask & court_mask) != 0:
                                    is_manual_blocked = True; break
                        if is_manual_blocked: break

                    # Check bookings (including siblings)
                    is_booked = False
                    court_mask = court.slice_mask or 1
                    for bc_id in relevant_block_court_ids:
                        booked_mask = bookings_by_court_slots.get(bc_id, {}).get(slot_start_f)
                        if booked_mask is not None:
                            # If booked_mask is 0, it means entire court
                            if booked_mask == 0:
                                booked_mask = (1 << (court_id_to_obj.get(bc_id).total_zones or 1)) - 1
                            
                            if (booked_mask & court_mask) != 0:
                                is_booked = True; break
                        if is_booked: break
                    
                    is_booked = is_booked or is_manual_blocked
                    
                    capacity = branch.max_players if branch.max_players and sport.name.lower() in ['basketball', 'cricket', 'football'] else 1
                    
                    court_entries.append({
                        "courtNumber": idx,
                        "court_name": court.name,
                        "price": float(allowed_map[time_key]['price']),
                        "booked": is_booked,
                        "capacity": capacity,
                        "available": 0 if is_booked else capacity
                    })
                
                if court_entries:
                    slot_data_list.append({
                        "slotNumber": slot_num,
                        "slot_time": self._get_slot_time_string(slot_num),
                        "courts": court_entries
                    })
            except Exception as e:
                print(f"Error in availability loop for slot {slot_num}: {e}")

        return {
            "date": booking_date_str,
            "slot_data": slot_data_list
        }

    def make_batch_booking(self, payload: schemas_district.DistrictBatchBookingRequest, batch_id: str) -> Dict[str, Any]:
        """
        Implements POST /makeBatchBooking with PESSIMISTIC LOCKING
        """
        target_branch = self._get_branch_by_facility_name(payload.facilityName)
        target_sport = self._get_game_type_by_sport_name(payload.sportName)
        
        all_courts = self.db.query(models.Court).filter(
            models.Court.branch_id == target_branch.id,
            models.Court.game_type_id == target_sport.id
        ).order_by(models.Court.created_at).all()
        
        if not all_courts:
            raise ValueError("No courts found for this facility/sport.")

        # Lock unique courts involved
        locked_court_ids = [c.id for c in all_courts]
        self.db.query(models.Court).filter(models.Court.id.in_(locked_court_ids)).with_for_update().all()

        user = self._get_or_create_partner_user(payload.userName, payload.userPhone, payload.userEmail)
        
        booking_ids = []
        total_slots = 0
        
        # Enforce 1-hour minimum: For District, this means at least 2 slots in the batch
        # (Though usually it should be 2 slots per specific court/date)
        if len(payload.slots) < 2:
             raise ValueError("Minimum booking duration is 1 hour (2 slots).")

        for slot_req in payload.slots:
            try:
                target_date = datetime.strptime(slot_req.date, '%d-%m-%Y').date()
            except ValueError:
                target_date = datetime.strptime(slot_req.date, '%Y-%m-%d').date()
            h = slot_req.slotNumber // 2
            m = (slot_req.slotNumber % 2) * 30
            time_key = f"{h:02d}:{m:02d}"
            slot_start_f = h + (m/60.0)
            
            if slot_req.courtNumber >= len(all_courts):
                raise ValueError(f"Invalid court index {slot_req.courtNumber}")
            
            court = all_courts[slot_req.courtNumber]
            
            allowed_map = generate_allowed_slots_map(self.db, court.id, target_date)
            if time_key not in allowed_map:
                raise ValueError(f"Slot {slot_req.slotNumber} ({time_key}) on {slot_req.date} is not available for {court.name}")
            
            # Conflict Check: Check this court AND siblings in same shared group
            from uuid import UUID
            conflict_court_ids = [court.id]
            if court.shared_group_id:
                group_id = UUID(str(court.shared_group_id))
                conflict_court_ids = [c[0] for c in self.db.query(models.Court.id).filter(models.Court.shared_group_id == group_id).all()]

            # Check for existing bookings
            active_bookings = self.db.query(models.Booking).filter(
                models.Booking.court_id.in_(conflict_court_ids),
                models.Booking.booking_date == target_date,
                models.Booking.status.in_(['confirmed', 'pending'])
            ).all()
            
            for b in active_bookings:
                if slot_start_f in get_booked_slots([b]):
                    # Simple rule: if any sibling has a 'Full Court' booking (mask 0), it's a conflict.
                    # If it's the same court, it's a conflict.
                    if b.court_id == court.id or not b.slice_mask:
                        raise ValueError(f"Conflict: Slot {slot_req.slotNumber} on {slot_req.date} for {court.name} is blocked by booking on {b.court_id}")
                    # If we had slice-specific logic for District here, we'd check masks.
                    # For now, if they share a group, we assume conflict to be safe.
                    raise ValueError(f"Conflict: Shared Group Slot occupied by {b.court_id}")

            # Check for existing manual blocks
            active_blocks = self.db.query(models.CourtBlock).filter(
                models.CourtBlock.court_id.in_(conflict_court_ids),
                models.CourtBlock.block_date == target_date
            ).all()
            for ab in active_blocks:
                if ab.start_time <= dt_time(h, m) < ab.end_time:
                    raise ValueError(f"Conflict: Slot {slot_req.slotNumber} on {slot_req.date} is under a Manual Block.")

            price = allowed_map[time_key]['price']
            ehh = int(h + (m+30)//60)
            emm = (m+30) % 60
            
            # Metadata tag for batch tracking
            source_tag = f"district|{batch_id}"
            
            booking = models.Booking(
                user_id=user.id,
                court_id=court.id,
                booking_date=target_date,
                time_slots=[{
                    "start": time_key,
                    "end": f"{ehh:02d}:{emm:02d}",
                    "price": float(price)
                }],
                total_duration_minutes=30,
                original_amount=price,
                total_amount=price,
                status='confirmed',
                payment_status='paid',
                booking_source=source_tag,
                _old_start_time=dt_time(h, m),
                _old_end_time=dt_time(ehh % 24, emm),
                _old_duration_minutes=30,
                _old_price_per_hour=float(price * 2) # Store logical hourly rate
            )
            self.db.add(booking)
            self.db.flush()
            booking_ids.append(str(booking.id))
            total_slots += 1

            # INTEGRATION TRIGGER
            if not self.skip_notifications:
                try:
                    from .orchestrator import IntegrationOrchestrator
                    IntegrationOrchestrator.notify_inventory_change(
                        db=self.db, 
                        court_id=str(court.id), 
                        date=str(target_date), 
                        slot_start=slot_start_f, 
                        action='block'
                    )
                except Exception as e:
                    print(f"[DISTRICT] Trigger failed: {e}")

        self.db.commit()
        
        # Prepare detailed response for each booking
        bookings_detail = []
        for b_id in booking_ids:
            b_obj = self.db.query(models.Booking).get(b_id)
            if b_obj:
                c_obj = self.db.query(models.Court).get(b_obj.court_id)
                # Find court index
                c_idx = 0
                for i, c in enumerate(all_courts):
                    if c.id == c_obj.id:
                        c_idx = i
                        break
                
                s_num = (b_obj._old_start_time.hour * 2) if b_obj._old_start_time else 0
                
                bookings_detail.append({
                    "bookingId": str(b_obj.id),
                    "facilityName": target_branch.name,
                    "courtName": c_obj.name,
                    "courtNumber": c_idx,
                    "date": b_obj.booking_date.strftime('%d-%m-%Y'),
                    "slotTime": self._get_slot_time_string(s_num),
                    "slotNumber": s_num,
                    "status": b_obj.status
                })

        return {
            "message": "Batch booking successful!",
            "bookingIDs": booking_ids,
            "batchBookingId": batch_id,
            "totalSlots": total_slots,
            "bookings": bookings_detail
        }

    def cancel_booking(self, facility_name: str, batch_booking_id: str) -> Dict[str, Any]:
        """Cancels all bookings associated with the given batch ID with exact District response format"""
        source_tag = f"district|{batch_booking_id}"
        
        # Try as batch_id first
        bookings = self.db.query(models.Booking).filter(
            models.Booking.booking_source == source_tag,
            models.Booking.status != 'cancelled'
        ).all()
        
        # If not, try as individual booking ID
        if not bookings and UUID_PATTERN.match(batch_booking_id):
            individual = self.db.query(models.Booking).filter(
                models.Booking.id == batch_booking_id,
                models.Booking.booking_source.like('district%'),
                models.Booking.status != 'cancelled'
            ).first()
            if individual:
                bookings = [individual]
                # If we're cancelling a single slot from a batch, the batch ID remains the same
                # but we only return this specific one.

        if not bookings:
             return {
                "batchBookingId": batch_booking_id,
                "totalBookingsCancelled": 0,
                "totalRefundAmount": 0,
                "cancellation_allowed": False,
                "bookings": [],
                "message": "No active bookings found for this ID"
            }

        cancelled_details = []
        total_cancelled = 0
        total_refund = 0.0

        for b in bookings:
            b.status = 'cancelled'
            total_cancelled += 1
            refund_amount = float(b.total_amount or 0)
            total_refund += refund_amount
            
            # INTEGRATION TRIGGER
            if not self.skip_notifications:
                try:
                    from .orchestrator import IntegrationOrchestrator
                    slot_start_f = (b._old_start_time.hour + b._old_start_time.minute/60.0) if b._old_start_time else 0.0
                    IntegrationOrchestrator.notify_inventory_change(
                        db=self.db, 
                        court_id=str(b.court_id), 
                        date=str(b.booking_date), 
                        slot_start=slot_start_f, 
                        action='available'
                    )
                except Exception: pass

            slot_num = (b._old_start_time.hour * 2) if b._old_start_time else 0
            
            # Lookup court name manually since relationship is commented out in models.py
            court_obj = self.db.query(models.Court).get(b.court_id)
            court_name = court_obj.name if court_obj else "N/A"

            cancelled_details.append({
                "bookingId": str(b.id),
                "date": b.booking_date.strftime('%d-%m-%Y'),
                "slot": {
                    "interval": {
                        "start": b._old_start_time.strftime('%H:%M') if b._old_start_time else "0:00",
                        "end": b._old_end_time.strftime('%H:%M') if b._old_end_time else "1:00"
                    },
                    "timeId": f"t{slot_num:03d}"
                },
                "court": court_name,
                "refundAmount": refund_amount,
                "cancelled": True
            })

        self.db.commit()

        return {
            "batchBookingId": batch_booking_id,
            "totalBookingsCancelled": total_cancelled,
            "totalRefundAmount": total_refund,
            "cancellation_allowed": True,
            "bookings": cancelled_details
        }

    def format_webhook_payload(self, category: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Primary entry point for the OutboxWorker to translate raw internal data 
        into District-specific JSON formats based on the event category.
        """
        if category == "availability":
            return self.format_inventory_webhook(data)
        elif category == "maintenance":
            return self.format_court_schedule_webhook_raw(data)
        elif category == "pricing":
            return self.format_recurring_webhook(data)
        
        # Fallback for unknown categories
        return data

    def send_webhook(self, url: str, payload: Dict[str, Any], custom_headers: Dict[str, Any] = None) -> Any:
        """
        Executes the HTTP POST request to District's Gateway, automatically 
        handling the required HMAC-SHA256 signatures.
        """
        from .gateway_client import DistrictGatewayClient
        
        partner = self.db.query(models.Partner).get(self.partner_id)
        if not partner:
            raise ValueError(f"Partner {self.partner_id} not found for webhook transmission.")

        client = DistrictGatewayClient(
            vendor_id=partner.unique_id,
            vendor_secret=partner.api_key_hash
        )
        
        headers = {"User-Agent": "RUSH-Webhook/1.0"}
        if custom_headers:
            headers.update(custom_headers)
            
        return client.post(url, json_data=payload, extra_headers=headers)

    def format_inventory_webhook(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Maps internal change to District Type B specific date webhook"""
        date_val = event_data['date']
        if isinstance(date_val, str):
            try:
                target_date_obj = datetime.strptime(date_val, '%Y-%m-%d')
            except ValueError:
                target_date_obj = datetime.strptime(date_val, '%d-%m-%Y')
        else:
            target_date_obj = date_val

        date_str = target_date_obj.strftime('%d-%m-%Y')
        
        branch = self.db.query(models.Branch).get(event_data['branch_id'])
        court = self.db.query(models.Court).get(event_data['court_id'])
        
        all_courts = self.db.query(models.Court).filter(
            models.Court.branch_id == branch.id,
            models.Court.game_type_id == court.game_type_id
        ).order_by(models.Court.created_at).all()
        
        court_index = 0
        for i, c in enumerate(all_courts):
            if str(c.id) == str(court.id):
                court_index = i
                break
        
        slot_start = event_data['slot_start']
        slot_idx = int(slot_start * 2)
        
        # Calculate remaining capacity for the slot
        from utils.booking_utils import safe_parse_time_float
        from sqlalchemy import or_
        from datetime import time as dt_time
        
        h = int(slot_start)
        m = int((slot_start % 1) * 60)
        slot_time = dt_time(h, m)
        
        if court.logic_type == 'capacity':
            total_cap = court.capacity_limit or 1
            
            # Sum Admin Blocks
            blocks = self.db.query(models.CourtBlock).filter(
                models.CourtBlock.court_id == court.id,
                models.CourtBlock.block_date == target_date_obj.date(),
                models.CourtBlock.start_time <= slot_time,
                models.CourtBlock.end_time > slot_time
            ).all()
            blocked_sum = sum((b.blocked_capacity if b.blocked_capacity is not None else total_cap) for b in blocks)
            
            # Sum User Bookings
            bookings = self.db.query(models.Booking).filter(
                models.Booking.court_id == court.id,
                models.Booking.booking_date == target_date_obj.date(),
                or_(models.Booking.status.is_(None), models.Booking.status.notin_(['cancelled', 'failed', 'refunded']))
            ).all()
            
            booked_sum = 0
            for bk in bookings:
                t_slots = bk.time_slots or []
                for s in t_slots:
                    try:
                        s_f = safe_parse_time_float(s.get('start_time') or s.get('time') or s.get('start'))
                        e_f = safe_parse_time_float(s.get('end_time') or s.get('end'))
                        if s_f <= slot_start < e_f:
                            booked_sum += getattr(bk, 'num_tickets', 1) or 1
                            break
                    except: continue
            
            final_count = max(0, total_cap - (blocked_sum + booked_sum))
        else:
            # Standard binary availability
            final_count = 0 if event_data['action'] == 'block' else 1

        webhook_data = [{
            "courtNumber": str(court_index),
            "slotNumber": str(slot_idx),
            "count": str(final_count),
            "sport": court.game_type.name,
            "facilityName": branch.name,
            "date": date_str
        }]

        return {
            "sourceType": "inventory",
            "action": event_data['action'],
            "data": webhook_data,
            "timestamp": int(datetime.utcnow().timestamp()),
            "requestId": f"req-B-{uuid.uuid4().hex[:8]}"
        }

    def format_court_schedule_webhook_raw(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Wraps the court object logic for the OutboxWorker which passes raw IDs."""
        court = self.db.query(models.Court).get(event_data['court_id'])
        return self.format_court_schedule_webhook(court, event_data['action'])

    def format_court_schedule_webhook(self, court: models.Court, action: str) -> Dict[str, Any]:
        """
        Maps a full court schedule change to a single bulk District Type A webhook.
        Processes all 7 days and 24 hours (168 hourly slots = 336 half-hour slots).
        """
        branch = court.branch
        if not branch:
            branch = self.db.query(models.Branch).get(court.branch_id)
            
        all_courts = self.db.query(models.Court).filter(
            models.Court.branch_id == branch.id,
            models.Court.game_type_id == court.game_type_id
        ).order_by(models.Court.created_at).all()
        
        court_index = 0
        for i, c in enumerate(all_courts):
            if str(c.id) == str(court.id):
                court_index = i
                break
        
        webhook_data = []
        for day in range(7):
            for hour in range(24):
                # District uses 30-min slots
                slot_indices = [hour * 2, hour * 2 + 1]
                for slot_idx in slot_indices:
                    slot_entry = {
                        "courtNumber": str(court_index),
                        "slotNumber": str(slot_idx),
                        "count": "1",
                        "sport": court.game_type.name,
                        "facilityName": branch.name,
                        "day": str(day)
                    }
                    # For recurring changes from create/update court, we don't necessarily send a specific price 
                    # for every slot unless we calculate it. Usually 'update' action tells them to re-fetch.
                    webhook_data.append(slot_entry)

        return {
            "sourceType": "inventory",
            "action": action,
            "data": webhook_data,
            "timestamp": int(datetime.utcnow().timestamp()),
            "requestId": f"req-A-bulk-{uuid.uuid4().hex[:8]}"
        }

    def format_recurring_webhook(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Maps internal change to District Type A recurring modification"""
        branch = self.db.query(models.Branch).get(event_data['branch_id'])
        court = self.db.query(models.Court).get(event_data['court_id'])
        
        all_courts = self.db.query(models.Court).filter(
            models.Court.branch_id == branch.id,
            models.Court.game_type_id == court.game_type_id
        ).order_by(models.Court.created_at).all()
        
        court_index = 0
        for i, c in enumerate(all_courts):
            if str(c.id) == str(court.id):
                court_index = i
                break
        
        slot_start = event_data['slot_start']
        hour = int(slot_start)
        slot_indices = [hour * 2, hour * 2 + 1]
        webhook_data = []
        for slot_idx in slot_indices:
            slot_entry = {
                "courtNumber": str(court_index),
                "slotNumber": str(slot_idx),
                "count": "1",
                "sport": court.game_type.name,
                "facilityName": branch.name,
                "day": str(event_data['day'])
            }
            if event_data.get('price') is not None:
                slot_entry["price"] = float(event_data['price'])
            webhook_data.append(slot_entry)

        return {
            "sourceType": "inventory",
            "action": event_data.get('action', 'update'),
            "data": webhook_data,
            "timestamp": int(datetime.utcnow().timestamp()),
            "requestId": f"req-A-{uuid.uuid4().hex[:8]}"
        }

    def get_booking_status(self, booking_id: str) -> Dict[str, Any]:
        """Implements GET /booking/{bookingId}"""
        if not UUID_PATTERN.match(booking_id):
            raise ValueError(f"Invalid Booking ID format: {booking_id}")
            
        booking = self.db.query(models.Booking).get(booking_id)
        if not booking:
            raise ValueError(f"Booking ID {booking_id} not found.")
        
        court = self.db.query(models.Court).get(booking.court_id)
        branch = self.db.query(models.Branch).get(court.branch_id)
        
        # Find court count/index
        all_courts = self.db.query(models.Court).filter(
            models.Court.branch_id == branch.id,
            models.Court.game_type_id == court.game_type_id
        ).order_by(models.Court.created_at).all()
        
        court_index = 0
        for i, c in enumerate(all_courts):
            if c.id == court.id:
                court_index = i
                break
        
        slot_num = (booking._old_start_time.hour * 2) if booking._old_start_time else 0
        
        return {
            "bookingId": str(booking.id),
            "facilityName": branch.name,
            "courtName": court.name,
            "courtNumber": court_index,
            "date": booking.booking_date.strftime('%d-%m-%Y'),
            "slotTime": self._get_slot_time_string(slot_num),
            "slotNumber": slot_num,
            "status": booking.status,
            "price": float(booking.total_amount),
            "paymentStatus": booking.payment_status
        }

    def get_booking_history(self, facility_name: str, booking_date_str: str) -> Dict[str, Any]:
        """Implements GET /bookings?facilityName=...&date=..."""
        branch = self._get_branch_by_facility_name(facility_name)
        try:
            target_date = datetime.strptime(booking_date_str, "%d-%m-%Y").date()
        except ValueError:
            target_date = datetime.strptime(booking_date_str, "%Y-%m-%d").date()
        
        # All courts for this branch
        court_ids = [c.id for c in branch.courts]
        
        bookings = self.db.query(models.Booking).filter(
            models.Booking.court_id.in_(court_ids),
            models.Booking.booking_date == target_date,
            models.Booking.booking_source.like('district%')
        ).all()
        
        history = []
        for b in bookings:
            # We can reuse the logic from get_booking_status but simplified
            c_obj = self.db.query(models.Court).get(b.court_id)
            
            # Sub-optimal but works for history volume
            all_courts_of_type = self.db.query(models.Court).filter(
                models.Court.branch_id == branch.id,
                models.Court.game_type_id == c_obj.game_type_id
            ).order_by(models.Court.created_at).all()
            
            c_idx = 0
            for i, c in enumerate(all_courts_of_type):
                if c.id == c_obj.id:
                    c_idx = i
                    break
            
            s_num = (b._old_start_time.hour * 2) if b._old_start_time else 0
            
            history.append({
                "bookingId": str(b.id),
                "facilityName": branch.name,
                "courtName": c_obj.name,
                "courtNumber": c_idx,
                "date": b.booking_date.strftime('%d-%m-%Y'),
                "slotTime": self._get_slot_time_string(s_num),
                "slotNumber": s_num,
                "status": b.status
            })
            
        return {
            "date": booking_date_str,
            "facilityName": facility_name,
            "totalBookings": len(history),
            "bookings": history
        }

    def get_facilities(self) -> List[Dict[str, Any]]:
        """Implements GET /facilities"""
        branches = self.db.query(models.Branch).filter(models.Branch.is_active == True).all()
        
        results = []
        for b in branches:
            # Get unique sport names and court counts for this branch
            sports_info = []
            
            # Get distinct game types for courts in this branch
            active_courts = [c for c in b.courts if c.is_active]
            gt_ids = set(c.game_type_id for c in active_courts)
            
            sports_list = []
            for gt_id in gt_ids:
                gt = self.db.query(models.GameType).get(gt_id)
                if gt:
                    sports_list.append(gt.name)
                    court_count = len([c for c in active_courts if c.game_type_id == gt_id])
                    sports_info.append({
                        "sportName": gt.name,
                        "courtsCount": court_count
                    })
            
            results.append({
                "facilityName": b.name,
                "sports": sports_list,
                "sportsInfo": sports_info
            })
            
        return results


