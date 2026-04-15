from sqlalchemy.orm import Session
from .base_adapter import BaseIntegrationAdapter
from .district_adapter import DistrictAdapter

class AdapterFactory:
    @staticmethod
    def get_adapter(partner_name: str, partner_id: str, db: Session) -> BaseIntegrationAdapter:
        """
        Unified factory for retrieving 3rd-party integration adapters.
        This allows the worker and orchestrator to be vendor-agnostic.
        """
        name_upper = partner_name.upper()
        
        if name_upper == "DISTRICT":
            return DistrictAdapter(db, partner_id=partner_id)
        
        # Placeholder for future vendors:
        # if name_upper == "PLAYO":
        #     return PlayoAdapter(db, partner_id=partner_id)
            
        raise ValueError(f"No integration adapter found for partner: {partner_name}")
