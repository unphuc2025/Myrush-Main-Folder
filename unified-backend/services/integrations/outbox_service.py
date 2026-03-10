from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import models
import json
from typing import Any, Dict

class OutboxService:
    @staticmethod
    def queue_inventory_update(db: Session, partner_id: str, payload: Dict[str, Any]):
        """
        Queues an inventory update event for a specific partner.
        Called by core booking/court logic whenever availability changes.
        """
        event = models.OutboxEvent(
            partner_id=partner_id,
            event_type="INVENTORY_UPDATE",
            payload=payload,
            status="pending",
            next_attempt_at=datetime.utcnow(),
            attempts=0,
            max_attempts=5
        )
        db.add(event)
        db.commit()
        return event

    @staticmethod
    def queue_event_for_all_partners(db: Session, event_type: str, payload_factory: Any):
        """
        Queues an event for ALL active integration partners.
        The payload_factory should be a callable that takes a Partner and returns the formatted payload.
        """
        partners = db.query(models.Partner).filter(models.Partner.is_active == True).all()
        for partner in partners:
            # We would use the Adapter for this partner to format the payload
            # For District, we'd use DistrictAdapter.format_inventory_webhook
            pass
