from fastapi import APIRouter, Depends, HTTPException, Query, Form, BackgroundTasks, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from datetime import datetime, date
from uuid import UUID
import json
import logging
import uuid
from datetime import datetime, date, timedelta

import models
import database
import schemas_district
from services.integrations.district_adapter import DistrictAdapter

router = APIRouter(
    prefix="/api",
    tags=["District Integration"],
)

# ============================================================================
# AUTHENTICATION DEPENDENCY
# ============================================================================

def verify_district_auth(id: str, apiKey: str, db: Session) -> models.Partner:
    """
    Validates the unique-id and api-key against the database.
    We hash apiKey in production, for now direct string matching for MVP if hashed strings not setup yet.
    """
    partner = db.query(models.Partner).filter(
        models.Partner.unique_id == id,
        models.Partner.name == 'District',
        models.Partner.is_active == True
    ).first()

    if not partner:
        # Fallback to hardcoded dev credentials if database isn't populated yet
        if id == "unique-id" and apiKey == "api-key":
             # Auto-create the partner for testing if missing
             partner = models.Partner(name="District", unique_id="unique-id", api_key_hash="api-key")
             db.add(partner)
             db.commit()
             db.refresh(partner)
             return partner
             
        logging.warning("District Integration Auth Failed: Invalid ID.")
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid Partner ID")
        
    # In a real scenario we use password hashes. Assuming api_key_hash stores plain text for this simple integration
    if partner.api_key_hash != apiKey:
        logging.warning("District Integration Auth Failed: Invalid API Key.")
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid API Key")
        
    return partner

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/checkAvailability/")
async def check_availability(
    request: Request,
    id: str = Query(...),
    apiKey: str = Query(...),
    facilityName: str = Query(...),
    sportName: str = Query(...),
    date: str = Query(..., description="DD-MM-YYYY"),
    db: Session = Depends(database.get_db)
):
    """
    Slot Availability API for District.
    """
    try:
        partner = verify_district_auth(id, apiKey, db)
        adapter = DistrictAdapter(db, partner_id=str(partner.id))
        
        # Log inbound request
        log_entry = models.IntegrationLog(
            partner_id=partner.id,
            direction="INBOUND",
            endpoint="/api/checkAvailability/",
            method="GET",
            request_payload={
                "facilityName": facilityName,
                "sportName": sportName,
                "date": date
            }
        )
        db.add(log_entry)
        db.commit()
        
        response_data = adapter.check_availability(
            facility_name=facilityName,
            sport_name=sportName,
            booking_date_str=date
        )
        
        log_entry.response_status = 200
        log_entry.response_payload = response_data
        db.commit()
        
        return response_data
        
    except HTTPException as he:
        raise he
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logging.error(f"District Availability Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post("/makeBatchBooking")
async def make_batch_booking(
    payload: schemas_district.DistrictBatchBookingRequest,
    db: Session = Depends(database.get_db)
):
    """
    Book Bulk Slots API with Idempotency and Locking
    """
    import hashlib
    try:
        partner = verify_district_auth(payload.id, payload.apiKey, db)
        adapter = DistrictAdapter(db, partner_id=str(partner.id))
        
        # 1. IDEMPOTENCY CHECK
        # We hash the static parts of the payload to detect duplicate requests
        idemp_payload = payload.dict(exclude={'id', 'apiKey'})
        payload_hash = hashlib.sha256(json.dumps(idemp_payload, sort_keys=True, default=str).encode()).hexdigest()
        
        existing_key = db.query(models.IdempotencyKey).filter(
            models.IdempotencyKey.partner_id == partner.id,
            models.IdempotencyKey.idempotency_key == payload_hash
        ).first()
        
        if existing_key:
            logging.info(f"Idempotency hit for partner {partner.id}, key {payload_hash}")
            return existing_key.response_body

        # 2. GENERATE BATCH ID
        batch_id = f"DIST-{uuid.uuid4().hex[:8].upper()}"
        
        # Log inbound
        log_entry = models.IntegrationLog(
            partner_id=partner.id,
            direction="INBOUND",
            endpoint="/api/makeBatchBooking",
            method="POST",
            request_payload=payload.dict()
        )
        db.add(log_entry)
        db.commit()
        
        # 3. EXECUTE BOOKING (with Adapter Locking)
        response_data = adapter.make_batch_booking(payload, batch_id=batch_id)
        response_data["batchBookingId"] = batch_id
        
        # 4. STORE IDEMPOTENCY KEY
        idemp_record = models.IdempotencyKey(
            partner_id=partner.id,
            idempotency_key=payload_hash,
            endpoint="/api/makeBatchBooking",
            response_status=200,
            response_body=response_data
        )
        db.add(idemp_record)
        
        log_entry.response_status = 200
        log_entry.response_payload = response_data
        db.commit()
        
        return response_data
        
    except HTTPException as he:
        raise he
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logging.error(f"District Batch Booking Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cancelBooking/")
async def cancel_booking(
    id: str = Form(...),
    apiKey: str = Form(...),
    facilityName: str = Form(...),
    bookingID: str = Form(...),
    db: Session = Depends(database.get_db)
):
    """
    Cancellation API - Supports both Batch ID and Individual Slot ID
    """
    try:
        partner = verify_district_auth(id, apiKey, db)
        adapter = DistrictAdapter(db, partner_id=str(partner.id))
        
        log_entry = models.IntegrationLog(
            partner_id=partner.id,
            direction="INBOUND",
            endpoint="/api/cancelBooking/",
            method="POST",
            request_payload={
                "facilityName": facilityName,
                "bookingID": bookingID
            }
        )
        db.add(log_entry)
        db.commit()

        response_data = adapter.cancel_booking(
            facility_name=facilityName,
            batch_booking_id=bookingID
        )
        
        log_entry.response_status = 200
        log_entry.response_payload = response_data
        db.commit()
        
        return response_data
        
    except HTTPException as he:
        raise he
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logging.error(f"District Cancellation Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/booking/{bookingId}")
async def get_booking_status(
    bookingId: str,
    id: str = Query(...),
    apiKey: str = Query(...),
    db: Session = Depends(database.get_db)
):
    """
    Check status and details for an individual booking
    """
    try:
        partner = verify_district_auth(id, apiKey, db)
        adapter = DistrictAdapter(db, partner_id=str(partner.id))
        
        return adapter.get_booking_status(bookingId)
    except HTTPException as he:
        raise he
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logging.error(f"District Status Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/bookings")
async def get_booking_history(
    facilityName: str = Query(...),
    date: str = Query(..., description="DD-MM-YYYY"),
    id: str = Query(...),
    apiKey: str = Query(...),
    db: Session = Depends(database.get_db)
):
    """
    Retrieve booking history for a facility/date for reconciliation
    """
    try:
        partner = verify_district_auth(id, apiKey, db)
        adapter = DistrictAdapter(db, partner_id=str(partner.id))
        
        return adapter.get_booking_history(facilityName, date)
    except HTTPException as he:
        raise he
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logging.error(f"District History Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/facilities")
async def discovery_api(
    id: str = Query(...),
    apiKey: str = Query(...),
    db: Session = Depends(database.get_db)
):
    """
    List all facilities and sports supported by MyRush for District
    """
    try:
        partner = verify_district_auth(id, apiKey, db)
        adapter = DistrictAdapter(db, partner_id=str(partner.id))
        
        facilities = adapter.get_facilities()
        return facilities
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"District Discovery Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")
