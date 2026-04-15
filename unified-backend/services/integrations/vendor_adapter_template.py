from typing import Any, Dict, List
from sqlalchemy.orm import Session
import requests
import logging

from .base_adapter import BaseIntegrationAdapter
import models

logger = logging.getLogger("NewVendorAdapter")

class NewVendorAdapter(BaseIntegrationAdapter):
    """
    TEMPLATE: Use this class to implement a new 3rd-party integration.
    
    Replace 'NewVendor' with the partner name (e.g. Playo, Hudle).
    1. Implement 'format_webhook_payload' for translation logic.
    2. Implement 'send_webhook' for protocol/auth logic.
    3. Register this class in 'AdapterFactory.py'.
    """

    def format_webhook_payload(self, category: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Translate MyRush internal data to the Vendor's required JSON format.
        
        Args:
            category: 'availability', 'pricing', or 'maintenance'
            data: The raw dictionary queued by the Orchestrator
                 - availability: {branch_id, court_id, date, slot_start, action}
                 - pricing: {branch_id, court_id, day, slot_start, action, price}
                 - maintenance: {court_id, action}
        """
        
        # Example: Availability translation
        if category == "availability":
            # Map MyRush 'block' action to Vendor's nomenclature
            vendor_status = "unavailable" if data["action"] == "block" else "available"
            
            return {
                "vendor_court_id": data["court_id"],
                "event_date": data["date"],
                "start_time": data["slot_start"],
                "status": vendor_status
            }

        # Example: Pricing translation
        if category == "pricing":
            return {
                "id": data["court_id"],
                "new_rate": data["price"],
                "effective_day": data["day"]
            }

        # Fallback: return raw data if no specific translation exists
        return data

    def send_webhook(self, url: str, payload: Dict[str, Any], custom_headers: Dict[str, Any] = None) -> requests.Response:
        """
        Handle the actual HTTP transmission and authentication.
        
        Args:
            url: The resolved destination URL
            payload: The JSON formatted by 'format_webhook_payload'
            custom_headers: Headers from PartnerWebhookConfig (if any)
        """
        
        # 1. Prepare Base Headers (e.g., API Key from Partner table)
        # self.partner refers to the DB record for this integration
        headers = {
            "Content-Type": "application/json",
            "X-Vendor-Key": self.partner.api_key_hash  # Usually stored as hash in DB
        }

        # 2. Inject Category-Specific Overrides (like Bearer tokens for specific URLs)
        if custom_headers:
            headers.update(custom_headers)

        # 3. Log the outbound attempt
        logger.info(f"Sending {self.partner.name} webhook to {url}")

        # 4. Transmit
        # Note: You can use any protocol here (REST, SOAP, gRPC, etc.)
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=30
        )
        
        return response
