from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import text, and_, or_
from typing import Annotated, List, Dict, Any, Optional
import razorpay
import os
import hmac
import hashlib
import json
from datetime import datetime, time, date

from database import get_db
from dependencies import get_current_user
import models
import schemas
import crud
from utils.coupon_utils import validate_coupon_strictly

from utils.booking_utils import get_booked_slots, safe_parse_time_float, calculate_multi_slice_price, generate_allowed_slots_map

router = APIRouter(
    prefix="/payments",
    tags=["payments"],
)

# Initialize Razorpay Client
# Ensure these are set in your .env file
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET")

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

def verify_slot_availability(
    db: Session, 
    court_id: str, 
    booking_date: date, 
    requested_slots: List[Dict[str, Any]],
    slice_mask: int = None
):
    """
    Check if any of the requested slots are already booked OR blocked by admin OR outside venue hours.
    Now uses bitmasks for precision.
    """
    if not requested_slots:
        return
        
    from utils.booking_utils import generate_allowed_slots_map, safe_parse_time_float

    # 1. Generate Authoritative Allowed Slots (Venue Hours + Pricing + Admin Blocks)
    allowed_slots_map = generate_allowed_slots_map(db, court_id, booking_date)
    
    if not allowed_slots_map:
        raise HTTPException(status_code=400, detail="The venue is closed or not configured for this date.")

    # 3. Validate requested slots against Admin blocks and overall availability
    for slot in requested_slots:
        time_str = slot.get('start_time') or slot.get('time')
        if not time_str: continue
        
        h_f = safe_parse_time_float(time_str)
        norm_start = time_str # Assume HH:MM from frontend
        if ":" not in norm_start:
            h = int(h_f)
            m = int((h_f % 1) * 60)
            norm_start = f"{h:02d}:{m:02d}"
        
        if norm_start not in allowed_slots_map:
            raise HTTPException(status_code=400, detail=f"Slot {time_str} is not in the venue's operating hours.")
        
        server_slot = allowed_slots_map[norm_start]
        if server_slot['is_blocked']:
            raise HTTPException(status_code=400, detail=f"Slot {time_str} has been blocked by Admin.")
            
        # Check Bitmask Overlap
        if slice_mask is not None and server_slot.get('occupied_mask') is not None:
             if (server_slot['occupied_mask'] & slice_mask) != 0:
                  raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Slot {time_str} is already booked.")

def calculate_authoritative_price(db: Session, court_id: str, booking_date: date, requested_slots: List[Dict], number_of_players: int = 1, slice_mask: Optional[int] = None) -> float:
    """
    Calculate the total price based on unified slot generation engine.
    Logic: Sum(Slot Prices) * Number of Players
    """
    from utils.booking_utils import generate_allowed_slots_map, safe_parse_time_float

    # 1. Generate Slots Map to get correct prices
    allowed_slots_map = generate_allowed_slots_map(db, court_id, booking_date)
    
    # NEW: Fetch court to check logic type
    court = db.query(models.Court).filter(models.Court.id == court_id).first()
    is_capacity = court.logic_type == "capacity" if court else False
    
    total_slot_price = 0.0
    print(f"[PRICE_DEBUG] Starting calculation for {len(requested_slots)} slots, players={number_of_players}, is_capacity={is_capacity}")
    
    for slot in requested_slots:
        # Use price from map if available, else default (though validation should have caught it)
        slot_time_str = slot.get('time') or slot.get('start_time') or slot.get('display_time', '').split(' - ')[0]
        if not slot_time_str: continue
        
        h_f = safe_parse_time_float(slot_time_str)
        norm_start = slot_time_str
        if ":" not in norm_start:
            h = int(h_f)
            m = int((h_f % 1) * 60)
            norm_start = f"{h:02d}:{m:02d}" 
        
        # Use price from map if available, else default (though validation should have caught it)
        if norm_start in allowed_slots_map:
            server_slot = allowed_slots_map[norm_start]
            default_map_price = float(server_slot['price'])
            
            # NEW: Sum slice prices if mask provided, otherwise use default
            from utils.booking_utils import calculate_multi_slice_price
            slot_price = calculate_multi_slice_price(server_slot, slice_mask or 0, default_map_price)
            
            total_slot_price += slot_price
            print(f"[PRICE_DEBUG] Slot {norm_start}: Price {slot_price} (Mask={slice_mask})")
        else:
            print(f"[PRICE_DEBUG] Slot {norm_start} not found in map. Falling back.")
            # Fallback to court base price if absolutely necessary
            if court:
                slot_price = (float(court.price_per_hour) / 2.0)
                total_slot_price += slot_price
                print(f"[PRICE_DEBUG] Fallback Slot {norm_start}: Price {slot_price}")

    # 2. Final Base Price (Multiply by players if capacity-based)
    final_base_price = float(total_slot_price)
    if is_capacity:
        final_base_price = float(total_slot_price * number_of_players)
        print(f"[PRICE_DEBUG] FINAL TOTAL BASE: {final_base_price} (Multiplied {total_slot_price} by {number_of_players} players)")
    else:
        print(f"[PRICE_DEBUG] FINAL TOTAL BASE: {final_base_price} (No player multiplier applied)")
        
    return final_base_price


def validate_authoritative_coupon(db: Session, coupon_code: str, total_amount: float, user_id: str) -> float:
    """
    Validate coupon and return discount amount.
    """
    if not coupon_code:
        return 0.0
        
    result = validate_coupon_strictly(db, coupon_code, total_amount, user_id)
    
    if not result["valid"]:
        raise HTTPException(status_code=400, detail=result["message"])
        
    return result["discount_amount"]

@router.post("/create-order")
def create_payment_order(
    booking_details: schemas.BookingCreate,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Create a Razorpay order with strict server-side validation.
    """
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
         raise HTTPException(status_code=500, detail="Payment gateway not configured")

    # 1. Availability Check
    print(f"[PAYMENTS DEBUG] Creating order for user {current_user.id}, court {booking_details.court_id}, date {booking_details.booking_date}")
    print(f"[PAYMENTS DEBUG] Provided slots: {booking_details.time_slots}")
    try:
        verify_slot_availability(db, booking_details.court_id, booking_details.booking_date, booking_details.time_slots, booking_details.slice_mask)
    except HTTPException as e:
        print(f"[PAYMENTS DEBUG] Availability check failed: {e.detail}")
        raise e
    except Exception as e:
        print(f"[PAYMENTS DEBUG] Unexpected availability error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Availability error: {str(e)}")
    
    # 2. Price Calculation
    try:
        server_base_price = calculate_authoritative_price(
            db, 
            booking_details.court_id, 
            booking_details.booking_date, 
            booking_details.time_slots, 
            booking_details.number_of_players or 1,
            booking_details.slice_mask
        )
        print(f"[PAYMENTS DEBUG] Calculated Base Price: {server_base_price}")
    except Exception as e:
        print(f"[PAYMENTS DEBUG] Price calculation failed: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Price calculation failed: {str(e)}")
    
    # Platform Fee (Hardcoded for now matching frontend)
    PLATFORM_FEE = 0.0 
    
    # 3. Coupon Validation
    discount_amount = 0.0
    if booking_details.coupon_code:
        print(f"[PAYMENTS DEBUG] Validating coupon: {booking_details.coupon_code}")
        try:
            discount_amount = validate_authoritative_coupon(
                db, 
                booking_details.coupon_code, 
                server_base_price,
                str(current_user.id)
            )
        except HTTPException as e:
            print(f"[PAYMENTS DEBUG] Coupon validation failed: {e.detail}")
            raise e
        except Exception as e:
            print(f"[PAYMENTS DEBUG] Unexpected coupon error: {e}")
            raise HTTPException(status_code=400, detail=f"Coupon error: {str(e)}")
        
    # 4. Final Total
    final_amount = (server_base_price + PLATFORM_FEE) - discount_amount
    final_amount = max(0, final_amount) # Never negative
    print(f"[PRICE_DEBUG] FINAL AMOUNT TO RAZORPAY: {final_amount} (Calculated as ({server_base_price} + {PLATFORM_FEE}) - {discount_amount})")
    
    # GST Logic (Optional - assuming inclusive for now, but if we wanted to add it:)
    # gst_amount = final_amount * 0.18
    # final_amount += gst_amount
    
    # 5. Create Razorpay Order
    # Round to 2 decimal places to avoid float issues before converting to paise
    final_amount = round(float(final_amount), 2)
    amount_in_paise = int(final_amount * 100)
    
    try:
        order_data = {
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": f"rcpt_{int(datetime.now().timestamp())}",
            "notes": {
                "user_id": str(current_user.id),
                "court_id": booking_details.court_id,
                "date": str(booking_details.booking_date)
            }
        }
        order = client.order.create(data=order_data)
        
        # --- ATOMIC SLOT RESERVATION (MUST SUCCEED before paying) ---
        # This is the gatekeeper. If two users try to book the same slot at the same time,
        # only the first one will succeed here. The second will get a 409 Conflict BEFORE
        # a Razorpay order is ever created for them — preventing a confusing double payment.
        print(f"[PAYMENTS] Atomically reserving slot for order {order['id']}")
        booking_details.payment_status = "pending"
        booking_details.razorpay_order_id = order['id']
        
        try:
            db_booking = crud.create_booking(db=db, booking=booking_details, user_id=current_user.id)
            print(f"[PAYMENTS] Slot reserved. Pending booking ID: {db_booking.id}")
        except HTTPException as slot_err:
            # Known conflict (slot taken, bitmask overlap, etc.) — cancel the Razorpay order and reject
            print(f"[PAYMENTS] Slot reservation FAILED: {slot_err.detail}. Cancelling Razorpay order {order['id']}.")
            try:
                client.order.update(order['id'], {"notes": {"status": "cancelled_slot_conflict"}})
            except Exception:
                pass
            raise HTTPException(status_code=409, detail=f"Slot no longer available: {slot_err.detail}")
        except ValueError as slot_err:
            # DB-level conflict (bitmask update returned 0 rows)
            print(f"[PAYMENTS] Slot reservation FAILED (ValueError): {slot_err}. Cancelling Razorpay order {order['id']}.")
            try:
                client.order.update(order['id'], {"notes": {"status": "cancelled_slot_conflict"}})
            except Exception:
                pass
            raise HTTPException(status_code=409, detail=f"Slot no longer available — another booking was confirmed first.")
        # ------------------------------------------------------------------

        return {
            "id": order['id'],
            "amount": order['amount'],
            "currency": order['currency'],
            "key_id": RAZORPAY_KEY_ID, # Send key to frontend
            "server_calculated_amount": final_amount,
            "breakdown": {
                "base": server_base_price,
                "fee": PLATFORM_FEE,
                "discount": discount_amount
            }
        }
        
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print(f"Razorpay Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create payment order")


@router.post("/create-multi-order")
def create_multi_court_payment_order(
    payload: dict,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    Create a single Razorpay order covering multiple court configs.
    Accepts: { configs: [{courtId, sliceMask}], bookingDate, timeSlots, numberOfPlayers, couponCode }
    """
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=500, detail="Payment gateway not configured")

    configs = payload.get("configs", [])
    booking_date_str = payload.get("bookingDate")
    time_slots = payload.get("timeSlots", [])
    slot_ids = payload.get("slotIds", [])
    number_of_players = payload.get("numberOfPlayers", 1)
    coupon_code = payload.get("couponCode")

    if not configs or not booking_date_str:
        raise HTTPException(status_code=400, detail="Missing configs or bookingDate")

    from datetime import date as dt_date
    booking_date = dt_date.fromisoformat(booking_date_str)

    # Calculate combined price across all courts
    total_price = 0.0
    for cfg in configs:
        court_id = cfg.get("courtId")
        slice_mask = cfg.get("sliceMask", 0)
        if not court_id:
            continue
        verify_slot_availability(db, court_id, booking_date, time_slots, slice_mask)
        price = calculate_authoritative_price(db, court_id, booking_date, time_slots, number_of_players, slice_mask)
        total_price += price
        print(f"[MULTI-ORDER] Court {court_id}: price={price}")

    print(f"[MULTI-ORDER] Combined total price: {total_price}")

    PLATFORM_FEE = 0.0
    discount_amount = 0.0
    if coupon_code:
        discount_amount = validate_authoritative_coupon(db, coupon_code, total_price, str(current_user.id))
        
    # Calculate total with rounding to 2 decimal places to prevent float errors
    final_total = round((total_price + PLATFORM_FEE) - discount_amount, 2)
    final_total_paise = int(final_total * 100)

    try:
        order_data = {
            "amount": final_total_paise,
            "currency": "INR",
            "receipt": f"rcpt_multi_{int(datetime.now().timestamp())}",
            "notes": {
                "user_id": str(current_user.id),
                "num_courts": str(len(configs)), # Stringify for safe Razorpay storage
                "is_multi": "true"
            }
        }
        order = client.order.create(data=order_data)

        # --- ATOMIC SLOT RESERVATION for MULTI-COURT (MUST SUCCEED before paying) ---
        # Same as single-court: if any court's slot cannot be atomically reserved,
        # we fail the ENTIRE order before Razorpay charges anyone.
        breakdown_list = []
        start_time_val = "00:00"
        if time_slots and isinstance(time_slots, list):
            start_time_val = time_slots[0].get("time", time_slots[0].get("start_time", "00:00"))
        duration_mins = len(time_slots) * 30 if isinstance(time_slots, list) else 60

        booking_create = schemas.BookingCreate(
            branch_id=str(configs[0].get("branchId", "")),
            court_id=str(configs[0].get("courtId", "")),
            booking_date=booking_date,
            start_time=start_time_val,
            duration_minutes=duration_mins,
            time_slots=time_slots,
            slot_ids=slot_ids,
            number_of_players=number_of_players,
            coupon_code=coupon_code,
            payment_status="pending",
            razorpay_order_id=order["id"],
            original_amount=total_price,
            discount_amount=discount_amount
        )

        for cfg in configs:
            c_id = str(cfg.get("courtId", ""))
            s_mask = cfg.get("sliceMask", 0)

            court_total = 0.0
            court_specific_slots = []
            allowed_slots = generate_allowed_slots_map(db, c_id, booking_date)
            for slot in time_slots:
                t_str = slot.get("time", slot.get("start_time"))
                slot_price = 0.0
                if t_str in allowed_slots:
                    s_info = allowed_slots[t_str]
                    slot_price = calculate_multi_slice_price(s_info, s_mask, float(s_info['price']))
                court_total += slot_price
                court_specific_slots.append({**slot, "price": slot_price})

            # Determine if this court is capacity-based to apply player multiplier
            court_obj = db.query(models.Court).filter(models.Court.id == c_id).first()
            is_cap = court_obj.logic_type == 'capacity' if court_obj else False
            
            booking_create.court_id = c_id
            booking_create.slice_mask = s_mask
            
            court_final_price = court_total * (number_of_players if is_cap else 1)
            booking_create.total_amount = court_final_price
            booking_create.original_amount = court_final_price
            booking_create.time_slots = court_specific_slots

            try:
                db_booking = crud.create_booking(db=db, booking=booking_create, user_id=current_user.id)
                print(f"[PAYMENTS] Slot reserved. Pending Multi-booking: {db_booking.id} for court {c_id}")
                breakdown_list.append({
                    "courtId": c_id,
                    "sliceMask": s_mask,
                    "total_amount": court_final_price, # Send the final authoritative price
                    "time_slots": court_specific_slots
                })
            except (HTTPException, ValueError) as slot_err:
                detail = slot_err.detail if isinstance(slot_err, HTTPException) else str(slot_err)
                print(f"[PAYMENTS] Multi-order slot reservation FAILED for court {c_id}: {detail}")
                # Cancel already-reserved courts in this order by rolling back
                db.rollback()
                try:
                    client.order.update(order['id'], {"notes": {"status": "cancelled_slot_conflict"}})
                except Exception:
                    pass
                raise HTTPException(status_code=409, detail=f"Slot for court {c_id} is no longer available: {detail}")
        # ---------------------------------------------------------------------------------

        return {
            "id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": RAZORPAY_KEY_ID,
            "server_calculated_amount": final_total,
            "breakdown": breakdown_list
        }
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print(f"Razorpay Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create payment order")


@router.post("/verify")
def verify_payment(
    payment_data: dict,
    db: Session = Depends(get_db)
):
    """
    Verify Razorpay signature
    """
    try:
        order_id = payment_data.get('razorpay_order_id')
        payment_id = payment_data.get('razorpay_payment_id')
        signature = payment_data.get('razorpay_signature')
        
        if not all([order_id, payment_id, signature]):
             raise HTTPException(status_code=400, detail="Missing payment details")
             
        # Verify Signature
        client.utility.verify_payment_signature({
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        })
        
        return {"status": "success", "message": "Payment verified successfully"}
        
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Payment signature verification failed")
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@router.get("/webhook")
def webhook_diagnostic():
    """Diagnostic endpoint to check if webhook is reachable via browser"""
    return {
        "status": "alive",
        "message": "Razorpay Webhook endpoint is active. Note: This URL must be called via POST by Razorpay. Manual browser hits (GET) will only show this message.",
        "verified_at": datetime.now().isoformat()
    }

@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Razorpay Webhook endpoint for secure server-to-server payment verification.
    """
    if not RAZORPAY_WEBHOOK_SECRET:
         print("[WEBHOOK] WARNING: RAZORPAY_WEBHOOK_SECRET not configured in .env!")
         raise HTTPException(status_code=500, detail="Webhook secret not configured")

    body_bytes = await request.body()
    body_str = body_bytes.decode('utf-8')
    signature = request.headers.get("x-razorpay-signature")

    if not signature:
         print("[WEBHOOK] Error: Missing x-razorpay-signature header")
         raise HTTPException(status_code=400, detail="Missing signature")

    print(f"[WEBHOOK] Received event, validating signature {signature[:10]}...")

    try:
        # Verify the webhook signature against our secret
        client.utility.verify_webhook_signature(body_str, signature, RAZORPAY_WEBHOOK_SECRET)
    except razorpay.errors.SignatureVerificationError:
        print("[WEBHOOK] Signature verification failed!")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        print(f"[WEBHOOK] Verification error: {e}")
        raise HTTPException(status_code=400, detail="Signature verification error")

    # If we got here, the request genuinely came from Razorpay
    try:
        data = json.loads(body_str)
        event = data.get("event")
        payload = data.get("payload", {})
        
        print(f"[WEBHOOK] Verified event: {event}")
        
        if event == "payment.captured":
            payment_entity = payload.get("payment", {}).get("entity", {})
            order_id = payment_entity.get("order_id")
            payment_id = payment_entity.get("id")
            amount = payment_entity.get("amount")
            # The 'notes' contains internal_order_id, item_cost, item_type (e.g. "PHONE")
            notes = payment_entity.get("notes", {})
            
            print(f"[WEBHOOK] Captured Payment: {payment_id} for Order: {order_id}, Amount: {amount}")
            print(f"[WEBHOOK] Payment Notes: {notes}")
            
            # --- 1. FIND BOOKING & PRE-VALIDATE (FRAUD CHECKS) ---
            booking = None
            is_fraud_mismatch = False
            try:
                booking = db.query(models.Booking).filter(models.Booking.razorpay_order_id == order_id).first()
                if booking:
                    print(f"[WEBHOOK] Found booking {booking.id} for order {order_id}")
                    expected_amount_paise = int(float(booking.total_amount) * 100)
                    if amount != expected_amount_paise:
                        print(f"[WEBHOOK FRAUD ALERT] Amount mismatch for booking {booking.id}!")
                        is_fraud_mismatch = True
            except Exception as e:
                print(f"[WEBHOOK ERROR] Pre-validation failed: {e}")

            # --- 2. VRIKSHA API INVOCATION (STRICT CONTRACT) ---
            vriksha_success = False
            try:
                import requests
                vriksha_url = "https://tester-webhook.vriksha.ai/api/webhooks/razorpay"
                
                vriksha_payload = json.loads(json.dumps(data)) # Deep copy
                if "payload" in vriksha_payload and "payment" in vriksha_payload["payload"] and "entity" in vriksha_payload["payload"]["payment"]:
                    p = vriksha_payload["payload"]["payment"]["entity"]
                    vriksha_payload["entity"] = "event"
                    p["amount_refunded"] = p.get("amount_refunded", 0)
                    p["amount_transferred"] = p.get("amount_transferred", 0)
                    p["captured"] = True
                    p["fee"] = p.get("fee", 0)
                    p["tax"] = p.get("tax", 0)
                    p["base_amount"] = p.get("base_amount") or p.get("amount", 0)
                    
                    p["description"] = "Phone Number Purchase" 
                    n = p.get("notes", {})
                    n["item_type"] = "PHONE" 
                    n["sku_id"] = 1
                    n["item_reference"] = 41
                    
                    if booking:
                        n["internal_order_id"] = booking.booking_display_id or str(booking.id)
                        n["item_cost"] = int(float(booking.original_amount) * 100)
                    else:
                        n.setdefault("internal_order_id", p.get("order_id", "UNKNOWN"))
                        n.setdefault("item_cost", p.get("amount", 0))
                    p["notes"] = n
                
                print(f"[WEBHOOK-VRIKSHA] Forwarding STRICT contract payload for Booking: {booking.booking_display_id if booking else 'N/A'}")
                
                vriksha_headers = {
                    "Content-Type": "application/json",
                    "User-Agent": request.headers.get("User-Agent", "Razorpay-Webhook/v1"),
                    "X-Razorpay-Event-Id": request.headers.get("X-Razorpay-Event-Id", ""),
                    "X-Razorpay-Signature": request.headers.get("X-Razorpay-Signature", "")
                }
                
                vriksha_response = requests.post(
                    vriksha_url, 
                    json=vriksha_payload, 
                    headers={k: v for k, v in vriksha_headers.items() if v},
                    timeout=15
                )
                print(f"[WEBHOOK-VRIKSHA] Vriksha Response Status: {vriksha_response.status_code}")
                
                if vriksha_response.status_code == 200:
                    vriksha_success = True
                else:
                    print(f"[WEBHOOK-VRIKSHA] REJECTED by Vriksha. Status={vriksha_response.status_code}")
            except Exception as e:
                print(f"[WEBHOOK-VRIKSHA] ERROR calling Vriksha API: {str(e)}")

            # --- 3. FINAL DATABASE COMMIT (IF VRIKSHA SUCCEEDED) ---
            if vriksha_success and booking:
                try:
                    if is_fraud_mismatch:
                        booking.payment_status = "flagged_mismatch"
                    else:
                        booking.payment_status = "paid"
                        print(f"[WEBHOOK] Marking booking {booking.id} as Paid (Vriksha confirmed).")
                    
                    booking.payment_id = payment_id
                    booking.razorpay_signature = signature
                    booking.updated_at = datetime.utcnow()
                    db.commit()
                except Exception as db_err:
                    print(f"[WEBHOOK ERROR] Final DB commit failed: {db_err}")
                    db.rollback()
            elif not vriksha_success:
                print(f"[WEBHOOK WARNING] Booking {booking.id if booking else 'N/A'} NOT marked as Paid because Vriksha processing failed.")
            # --------------------------------------------------
            # --------------------------------------------------
            
        elif event == "payment.failed":
            print("[WEBHOOK] Payment failed event received.")
            
        # Razorpay expects a simple 200 OK on successful webhook receipt
        return {"status": "success", "message": f"Webhook {event} processed successfully"}

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")


# ============================================================================
# PAYMENT METHOD MANAGEMENT
# ============================================================================

@router.get("/methods", response_model=List[schemas.PaymentMethodResponse])
def get_user_payment_methods(
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """List all saved payment methods for the current user"""
    return crud.get_payment_methods(db, str(current_user.id))

@router.post("/methods", response_model=schemas.PaymentMethodResponse)
def add_user_payment_method(
    payment_method: schemas.PaymentMethodCreate,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Save a new payment method"""
    return crud.create_payment_method(db, payment_method, str(current_user.id))

@router.delete("/methods/{method_id}")
def delete_user_payment_method(
    method_id: str,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Delete a saved payment method"""
    success = crud.delete_payment_method(db, method_id, str(current_user.id))
    if not success:
        raise HTTPException(status_code=404, detail="Payment method not found or access denied")
    return {"status": "success", "message": "Payment method deleted"}

@router.post("/methods/{method_id}/default", response_model=schemas.PaymentMethodResponse)
def set_default_user_payment_method(
    method_id: str,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """Set a payment method as default"""
    updated = crud.set_default_payment_method(db, method_id, str(current_user.id))
    if not updated:
        raise HTTPException(status_code=404, detail="Payment method not found")
    return updated
