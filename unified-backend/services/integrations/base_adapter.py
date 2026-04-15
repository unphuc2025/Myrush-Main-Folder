from typing import Any, Dict, List
from abc import ABC, abstractmethod
from sqlalchemy.orm import Session
from datetime import date

class BaseIntegrationAdapter(ABC):
    """
    Abstract Base Class for all 3rd-party Partner Integrations (District, Playo, etc.).
    Enforces a standard contract for checking availability, booking, and cancelling.
    """
    
    def __init__(self, db: Session, partner_id: str):
        self.db = db
        self.partner_id = partner_id

    @abstractmethod
    def check_availability(self, facility_name: str, sport_name: str, booking_date: str) -> Dict[str, Any]:
        """
        Translates Partner's check availability request into MyRush DB query.
        Returns the specific JSON dictionary expected by the Partner.
        """
        pass

    @abstractmethod
    def make_batch_booking(self, payload: Any) -> Dict[str, Any]:
        """
        Translates Partner's booking payload into MyRush Court locks and Bookings.
        Handles checking Idempotency Keys and preventing race conditions via Row-Level Locks.
        Returns Partner's specific success JSON format.
        """
        pass

    @abstractmethod
    def cancel_booking(self, facility_name: str, batch_booking_id: str) -> Dict[str, Any]:
        """
        Translates Partner's cancellation payload to MyRush booking cancellation.
        Returns Partner's specific cancellation success JSON format.
        """
        pass

    @abstractmethod
    def format_inventory_webhook(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        [DEPRECATED] Use format_webhook_payload instead.
        Translates a MyRush internal `InventoryChangeEvent` into the specific
        JSON payload required by the Partner's webhook receiver.
        """
        pass

    @abstractmethod
    def format_webhook_payload(self, category: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Translates MyRush raw data into the specific JSON payload required by the Partner.
        category: 'availability', 'pricing', 'maintenance', etc.
        data: Raw dictionary of internal MyRush event data.
        """
        pass

    @abstractmethod
    def send_webhook(self, url: str, payload: Dict[str, Any], custom_headers: Dict[str, Any] = None) -> Any:
        """
        Executes the HTTP POST request to the Partner's webhook endpoint.
        Handles vendor-specific authentication (e.g., HMAC for District, Bearer tokens).
        """
        pass
