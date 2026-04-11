from sqlalchemy.orm import Session
from typing import List, Dict, Any
import logging
import models
from .district_adapter import DistrictAdapter
from .outbox_service import OutboxService

logger = logging.getLogger("IntegrationOrchestrator")

class IntegrationOrchestrator:
    @staticmethod
    def notify_inventory_change(db: Session, court_id: str, date: str, slot_start: float, action: str):
        """
        Orchestrates notifying all active partners about an inventory change (available/block).
        Action: 'available' or 'block'
        Date: YYYY-MM-DD
        slot_start: 0.0, 0.5, ..., 23.5
        """
        # Use db.get for direct lookup (standard in 2.x, works in 1.4+)
        try:
            court = db.get(models.Court, court_id) if hasattr(db, 'get') else db.query(models.Court).get(court_id)
        except Exception as e:
            logger.error(f"Error fetching court {court_id}: {e}")
            return

        if not court:
            logger.error(f"Court {court_id} not found for inventory notification")
            return

        partners = db.query(models.Partner).filter(models.Partner.is_active == True).all()
        
        for partner in partners:
            try:
                adapter = None
                if partner.name.lower() == 'district':
                    adapter = DistrictAdapter(db, str(partner.id))
                
                if not adapter:
                    continue

                event_data = {
                    "branch_id": str(court.branch_id),
                    "court_id": str(court.id),
                    "date": date,
                    "slot_start": slot_start,
                    "action": action
                }
                
                payload = adapter.format_inventory_webhook(event_data)
                
                OutboxService.queue_inventory_update(db, str(partner.id), payload)
                logger.info(f"Queued {action} event for {partner.name} - Court: {court.name}, Slot: {slot_start}")
                
            except Exception as e:
                logger.error(f"Failed to queue inventory update for partner {partner.name}: {e}", exc_info=True)

    @staticmethod
    def notify_court_schedule_change(db: Session, court_id: str, action: str):
        """
        Triggered when a court is created or updated.
        Sends the FULL 7-day schedule in a single bulk webhook (District Type A).
        """
        court = db.query(models.Court).get(court_id)
        if not court: return

        partners = db.query(models.Partner).filter(models.Partner.is_active == True).all()
        for partner in partners:
            try:
                if partner.name.lower() == 'district':
                    adapter = DistrictAdapter(db, str(partner.id))
                    payload = adapter.format_court_schedule_webhook(court, action)
                    OutboxService.queue_inventory_update(db, str(partner.id), payload)
                    logger.info(f"Queued BULK schedule update for {partner.name} - Court: {court.name}")
            except Exception as e:
                logger.error(f"Failed to queue bulk recurring update: {e}")

    @staticmethod
    def notify_manual_block_change(db: Session, block: models.CourtBlock, action: str):
        """
        Triggered when a Manual Court Block is created or deleted.
        Action: 'block' or 'available'
        Maps the block's time range to 30-min slots for partner notification.
        """
        try:
            # Convert time objects to floats for our slot engine
            from utils.booking_utils import safe_parse_time_float
            s_f = safe_parse_time_float(str(block.start_time))
            e_f = safe_parse_time_float(str(block.end_time))
            
            if e_f <= s_f: # Handle midnight crossover or errors
                e_f = 24.0
            
            # Iterate through 30-min slots
            curr = s_f
            while curr < e_f:
                IntegrationOrchestrator.notify_inventory_change(
                    db=db,
                    court_id=str(block.court_id),
                    date=str(block.block_date),
                    slot_start=curr,
                    action=action
                )
                curr += 0.5
                
            logger.info(f"Synchronized manual {action} for Court {block.court_id} on {block.block_date} ({block.start_time}-{block.end_time})")
            
        except Exception as e:
            logger.error(f"Failed to synchronize manual block change: {e}", exc_info=True)

    @staticmethod
    def notify_recurring_change(db: Session, court_id: str, day: int, slot_start: float, action: str, price: float = None):
        """
        Triggered when recurring schedules or prices change (District Type A).
        day: 0(Sun) - 6(Sat)
        slot_start: 0.0, 0.5, ..., 23.5
        """
        court = db.query(models.Court).get(court_id)
        if not court: return

        partners = db.query(models.Partner).filter(models.Partner.is_active == True).all()
        for partner in partners:
            try:
                if partner.name.lower() == 'district':
                    adapter = DistrictAdapter(db, str(partner.id))
                    event_data = {
                        "branch_id": str(court.branch_id),
                        "court_id": str(court.id),
                        "day": day,
                        "slot_start": slot_start,
                        "action": action,
                        "price": price
                    }
                    payload = adapter.format_recurring_webhook(event_data)
                    OutboxService.queue_inventory_update(db, str(partner.id), payload)
            except Exception as e:
                logger.error(f"Failed to queue recurring update: {e}")
