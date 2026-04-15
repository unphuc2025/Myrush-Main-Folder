from fastapi import APIRouter, Depends, HTTPException, Query, Form, BackgroundTasks, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from datetime import datetime, date
from uuid import UUID
import json
import logging
import uuid
from datetime import datetime, date, timedelta, time

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
        
    import hashlib
    incoming_hash = hashlib.sha256(apiKey.encode()).hexdigest()
    
    # Check both the raw value (for legacy dev keys) and securely hashed versions
    if partner.api_key_hash != apiKey and partner.api_key_hash != incoming_hash:
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
            response_body=response_data,
            expires_at=datetime.utcnow() + timedelta(days=1)
        )
        db.add(idemp_record)
        
        log_entry.response_status = 200
        log_entry.response_payload = response_data
        db.commit()
        
        return response_data
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"\n[CRITICAL ERROR] District Batch Booking Failure: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
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
    except Exception as e:
        logging.error(f"District Discovery Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")

# ============================================================================
# INBOUND CALLBACK (Sync from District to MyRush)
# ============================================================================

@router.post("/district/callback")
async def district_inventory_callback(
    request: Request,
    db: Session = Depends(database.get_db)
):
    """
    Inbound webhook from District Sports to update inventory availability.
    Expects X-API-Key header.
    Payload Example:
    {
      "court_id": "uuid",
      "date": "YYYY-MM-DD",
      "slot_start": 10.5,
      "available": false
    }
    """
    x_api_key = request.headers.get("X-API-Key")
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing API Key")
    
    import hashlib
    incoming_hash = hashlib.sha256(x_api_key.encode()).hexdigest()
    
    partner = db.query(models.Partner).filter(
        models.Partner.api_key_hash.in_([x_api_key, incoming_hash]),
        models.Partner.is_active == True
    ).first()
    
    if not partner:
        raise HTTPException(status_code=403, detail="Invalid API Key")

    try:
        data = await request.json()
        logging.info(f"[DISTRICT CALLBACK] Received: {data}")
        
        court_id = data.get("court_id")
        block_date = data.get("date")
        slot_start = data.get("slot_start")
        is_available = data.get("available", True)

        if not all([court_id, block_date, slot_start is not None]):
            raise HTTPException(status_code=422, detail="Missing required fields")

        hh = int(slot_start)
        mm = int((slot_start % 1) * 60)
        start_t = time(hh, mm)
        
        end_dt = datetime.combine(date.today(), start_t) + timedelta(minutes=30)
        end_t = end_dt.time()

        if is_available:
            # Release Block: Delete local manual block that matches this exact slot
            db.query(models.CourtBlock).filter(
                models.CourtBlock.court_id == court_id,
                models.CourtBlock.block_date == block_date,
                models.CourtBlock.start_time == start_t,
                models.CourtBlock.reason == "District Partner Sync"
            ).delete()
            logging.info(f"Released District-side block for court {court_id} at {start_t}")
        else:
            # Add Block: Create new local manual block IF no conflict exists
            from utils.conflicts import check_court_availability_conflict
            conflict = check_court_availability_conflict(
                db=db,
                court_id=UUID(str(court_id)),
                block_date=datetime.strptime(block_date, "%Y-%m-%d").date() if isinstance(block_date, str) else block_date,
                start_time=start_t,
                end_time=end_t,
                slice_mask=0 # District blocks usually apply to the whole allocated unit
            )
            
            if conflict:
                logging.warning(f"[DISTRICT CALLBACK] Conflict detected, skipping block: {conflict}")
                return {"status": "ignored", "message": f"Conflict: {conflict}"}

            new_block = models.CourtBlock(
                court_id=court_id,
                block_date=block_date,
                start_time=start_t,
                end_time=end_t,
                reason="District Partner Sync",
                synced_partners=["district"]
            )
            db.add(new_block)
            logging.info(f"Added District-side block for court {court_id} at {start_t}")

        db.commit()
        return {"status": "success", "message": "Inventory synchronized"}

    except Exception as e:
        print(f"\n[CRITICAL ERROR] District Callback Failure: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        logging.error(f"Error processing District callback: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
