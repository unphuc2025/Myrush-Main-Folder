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

        # Find all target courts (this one + siblings in same shared group)
        target_court_ids = [str(court.id)]
        if court.shared_group_id:
            from uuid import UUID
            group_id = UUID(str(court.shared_group_id))
            siblings = db.query(models.Court).filter(
                models.Court.shared_group_id == group_id,
                models.Court.id != court.id
            ).all()
            target_court_ids = [str(court.id)] + [str(s.id) for s in siblings]

        partners = db.query(models.Partner).filter(models.Partner.is_active == True).all()
        
        for partner in partners:
            try:
                # 1. Validation Logic
                # We only queue events for partners we actually have adapters for.
                # In the future, we could also check if they have a global webhook_url set.
                try:
                    from .adapter_factory import AdapterFactory
                    AdapterFactory.get_adapter(partner.name, str(partner.id), db)
                except ValueError:
                    # No adapter for this vendor yet, skip queuing to avoid outbox bloat
                    continue

                for t_court_id in target_court_ids:
                    # 2. Raw Internal Payload
                    # This dictionary represents MyRush's internal state change.
                    event_data = {
                        "branch_id": str(court.branch_id),
                        "court_id": t_court_id,
                        "date": date,
                        "slot_start": slot_start,
                        "action": action
                    }
                    
                    # 3. Queue the RAW event
                    OutboxService.queue_inventory_update(db, str(partner.id), event_data, category="availability")
                    logger.info(f"Queued RAW {action} event for {partner.name} - Court: {t_court_id}, Slot: {slot_start}")
                
            except Exception as e:
                logger.error(f"Failed to queue inventory update for partner {partner.name}: {e}")

    @staticmethod
    def notify_court_schedule_change(db: Session, court_id: str, action: str):
        """
        Triggered when a court is created or updated.
        Categories as 'maintenance'.
        """
        court = db.query(models.Court).get(court_id)
        if not court: return

        partners = db.query(models.Partner).filter(models.Partner.is_active == True).all()
        for partner in partners:
            try:
                # Check for adapter support
                from .adapter_factory import AdapterFactory
                try:
                    AdapterFactory.get_adapter(partner.name, str(partner.id), db)
                except ValueError:
                    continue

                raw_data = {
                    "court_id": str(court.id),
                    "action": action
                }
                OutboxService.queue_inventory_update(db, str(partner.id), raw_data, category="maintenance")
                logger.info(f"Queued RAW schedule update for {partner.name} - Court: {court.name}")
            except Exception as e:
                logger.error(f"Failed to queue bulk maintenance update: {e}")

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
                
            logger.info(f"Synchronized manual {action} for Court {block.court_id} on {block.block_date}")
            
        except Exception as e:
            logger.error(f"Failed to synchronize manual block change: {e}")

    @staticmethod
    def notify_recurring_change(db: Session, court_id: str, day: int, slot_start: float, action: str, price: float = None):
        """
        Triggered when recurring schedules or prices change.
        Categorized as 'pricing'.
        """
        court = db.query(models.Court).get(court_id)
        if not court: return

        partners = db.query(models.Partner).filter(models.Partner.is_active == True).all()
        for partner in partners:
            try:
                from .adapter_factory import AdapterFactory
                try:
                    AdapterFactory.get_adapter(partner.name, str(partner.id), db)
                except ValueError:
                    continue

                event_data = {
                    "branch_id": str(court.branch_id),
                    "court_id": str(court.id),
                    "day": day,
                    "slot_start": slot_start,
                    "action": action,
                    "price": price
                }
                OutboxService.queue_inventory_update(db, str(partner.id), event_data, category="pricing")
                logger.info(f"Queued RAW pricing update for {partner.name} - Court: {court.id}, Day: {day}")
            except Exception as e:
                logger.error(f"Failed to queue recurring update: {e}")
