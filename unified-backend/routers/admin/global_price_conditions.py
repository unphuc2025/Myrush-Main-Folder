from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from typing import List, Optional
from decimal import Decimal
import models, schemas
from database import get_db
import json

router = APIRouter(
    prefix="/global-price-conditions",
    tags=["global-price-conditions"]
)

@router.get("", response_model=List[dict])
@router.get("/", response_model=List[dict])
def get_all_global_conditions(db: Session = Depends(get_db)):
    """Get all global price conditions"""
    conditions = db.query(models.GlobalPriceCondition).filter(
        models.GlobalPriceCondition.is_active == True
    ).all()
    
    return [{
        "id": str(c.id),
        "days": c.days or [],
        "dates": c.dates or [],
        "slot_from": c.slot_from,
        "slot_to": c.slot_to,
        "price": float(c.price),
        "condition_type": c.condition_type or 'recurring',
        "is_active": c.is_active
    } for c in conditions]

@router.post("", response_model=dict)
@router.post("/", response_model=dict)
async def create_global_condition(
    days: Optional[str] = Form(None),  # JSON array string for recurring
    dates: Optional[str] = Form(None),  # JSON array string for date-specific
    slot_from: str = Form(...),
    slot_to: str = Form(...),
    price: str = Form(...),
    condition_type: str = Form('recurring'),  # 'recurring' or 'date'
    db: Session = Depends(get_db)
):
    """Create a new global price condition"""
    days_list = []
    dates_list = []
    
    # Debug: Print received values
    print(f"DEBUG - Received: condition_type={condition_type}, days={days} (type: {type(days)}), dates={dates} (type: {type(dates)}), slot_from={slot_from}, slot_to={slot_to}, price={price}")
    
    try:
        if condition_type == 'date':
            if not dates or dates == '[]' or dates == '' or dates is None:
                raise HTTPException(status_code=400, detail="At least one date is required for date-specific condition")
            try:
                # Handle both string and list formats
                if isinstance(dates, str):
                    dates_list = json.loads(dates)
                elif isinstance(dates, list):
                    dates_list = dates
                else:
                    raise ValueError("Dates must be a JSON string or array")
                    
                if not isinstance(dates_list, list):
                    raise ValueError("Dates must be an array")
                if len(dates_list) == 0:
                    raise ValueError("At least one date is required")
            except json.JSONDecodeError as e:
                raise HTTPException(status_code=400, detail=f"Invalid dates JSON format: {str(e)}. Received: {dates}")
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid dates format: {str(e)}")
        else:
            if not days or days == '[]' or days == '' or days is None:
                raise HTTPException(status_code=400, detail="At least one day is required for recurring condition")
            try:
                # Handle both string and list formats
                if isinstance(days, str):
                    days_list = json.loads(days)
                elif isinstance(days, list):
                    days_list = days
                else:
                    raise ValueError("Days must be a JSON string or array")
                    
                if not isinstance(days_list, list):
                    raise ValueError("Days must be an array")
                if len(days_list) == 0:
                    raise ValueError("At least one day is required")
            except json.JSONDecodeError as e:
                raise HTTPException(status_code=400, detail=f"Invalid days JSON format: {str(e)}. Received: {days}")
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid days format: {str(e)}")
        
        db_condition = models.GlobalPriceCondition(
            days=days_list if days_list else None,
            dates=dates_list if dates_list else None,
            slot_from=slot_from,
            slot_to=slot_to,
            price=Decimal(price),
            condition_type=condition_type,
            is_active=True
        )
        db.add(db_condition)
        db.commit()
        db.refresh(db_condition)
        
        # Apply to all active courts
        apply_global_condition_to_all_courts(db_condition, db)
        
        return {
            "id": str(db_condition.id),
            "days": db_condition.days or [],
            "dates": db_condition.dates or [],
            "slot_from": db_condition.slot_from,
            "slot_to": db_condition.slot_to,
            "price": float(db_condition.price),
            "condition_type": db_condition.condition_type,
            "is_active": db_condition.is_active
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR creating global condition: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error creating global condition: {str(e)}")

@router.put("/{condition_id}", response_model=dict)
def update_global_condition(
    condition_id: str,
    days: Optional[str] = None,
    slot_from: Optional[str] = None,
    slot_to: Optional[str] = None,
    price: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Update a global price condition"""
    db_condition = db.query(models.GlobalPriceCondition).filter(
        models.GlobalPriceCondition.id == condition_id
    ).first()
    
    if not db_condition:
        raise HTTPException(status_code=404, detail="Global condition not found")
    
    if days is not None:
        try:
            days_list = json.loads(days) if isinstance(days, str) else days
            db_condition.days = days_list
        except:
            raise HTTPException(status_code=400, detail="Invalid days format")
    
    if slot_from is not None:
        db_condition.slot_from = slot_from
    if slot_to is not None:
        db_condition.slot_to = slot_to
    if price is not None:
        db_condition.price = Decimal(price)
    if is_active is not None:
        db_condition.is_active = is_active
    
    db.commit()
    db.refresh(db_condition)
    
    # Re-apply to all courts if active
    if db_condition.is_active:
        apply_global_condition_to_all_courts(db_condition, db)
    
    return {
        "id": str(db_condition.id),
        "days": db_condition.days or [],
        "slot_from": db_condition.slot_from,
        "slot_to": db_condition.slot_to,
        "price": float(db_condition.price),
        "is_active": db_condition.is_active
    }

@router.delete("/{condition_id}")
def delete_global_condition(condition_id: str, db: Session = Depends(get_db)):
    """Delete a global price condition"""
    db_condition = db.query(models.GlobalPriceCondition).filter(
        models.GlobalPriceCondition.id == condition_id
    ).first()
    
    if not db_condition:
        raise HTTPException(status_code=404, detail="Global condition not found")
    
    db.delete(db_condition)
    db.commit()
    
    # Remove from all courts
    remove_global_condition_from_all_courts(condition_id, db)
    
    return {"message": "Global condition deleted successfully"}

@router.post("/apply-to-all-courts")
def apply_all_global_conditions_to_courts(db: Session = Depends(get_db)):
    """Manually trigger applying all global conditions to all courts"""
    conditions = db.query(models.GlobalPriceCondition).filter(
        models.GlobalPriceCondition.is_active == True
    ).all()
    
    updated_count = 0
    for condition in conditions:
        count = apply_global_condition_to_all_courts(condition, db)
        updated_count += count
    
    return {
        "message": f"Applied {len(conditions)} global conditions to all courts",
        "courts_updated": updated_count
    }

def apply_global_condition_to_all_courts(condition, db: Session):
    """Apply a global price condition to all active courts"""
    courts = db.query(models.Court).filter(models.Court.is_active == True).all()
    updated_count = 0
    
    print(f"DEBUG: Applying global condition {condition.id} to all courts...")
    for court in courts:
        # Get existing price conditions
        price_conditions = court.price_conditions or []
        if isinstance(price_conditions, str):
            try:
                price_conditions = json.loads(price_conditions)
            except:
                price_conditions = []
        
        # Check if this condition already exists
        condition_exists = False
        target_id = f"global-{condition.id}"
        
        for pc in price_conditions:
            # First try to match by ID
            if pc.get('id') == target_id:
                # Update existing global condition
                pc['days'] = condition.days or []
                pc['dates'] = condition.dates or []
                pc['slotFrom'] = condition.slot_from
                pc['slotTo'] = condition.slot_to
                # Ensure price is string to match JSON serialization
                pc['price'] = str(condition.price)
                pc['type'] = condition.condition_type or 'recurring'
                condition_exists = True
                break
                
            # Fallback: Match by type and time slot (for backward compatibility or manual entries)
            # Only if ID doesn't match (user might have manually added similar slot)
            if pc.get('id') != target_id:
                if condition.condition_type == 'date':
                    # Date-specific: match by dates and time
                    if (pc.get('dates') == condition.dates and 
                        pc.get('slotFrom') == condition.slot_from and 
                        pc.get('slotTo') == condition.slot_to):
                        # Link it to this global ID
                        pc['id'] = target_id
                        pc['price'] = str(condition.price)
                        condition_exists = True
                        break
                else:
                    # Recurring: match by days and time
                    if (pc.get('days') == condition.days and 
                        pc.get('slotFrom') == condition.slot_from and 
                        pc.get('slotTo') == condition.slot_to):
                        # Link it to this global ID
                        pc['id'] = target_id
                        pc['price'] = str(condition.price)
                        condition_exists = True
                        break
        
        # Add if doesn't exist
        if not condition_exists:
            if condition.condition_type == 'date':
                new_condition = {
                    'id': target_id,
                    'type': 'date',
                    'dates': condition.dates or [],
                    'slotFrom': condition.slot_from,
                    'slotTo': condition.slot_to,
                    'price': str(condition.price)
                }
            else:
                new_condition = {
                    'id': target_id,
                    'type': 'recurring',
                    'days': condition.days or [],
                    'slotFrom': condition.slot_from,
                    'slotTo': condition.slot_to,
                    'price': str(condition.price)
                }
            price_conditions.append(new_condition)
        
        # Force SQLAlchemy to detect the change by assigning a new list and flagging modified
        court.price_conditions = list(price_conditions)
        flag_modified(court, "price_conditions")
        updated_count += 1
    
    db.commit()
    return updated_count

def remove_global_condition_from_all_courts(condition_id: str, db: Session):
    """Remove a global price condition from all courts"""
    courts = db.query(models.Court).all()
    target_id = f"global-{condition_id}"
    updated_count = 0
    print(f"DEBUG: Removing global condition {target_id} from all courts...")
    
    for court in courts:
        price_conditions = court.price_conditions or []
        if isinstance(price_conditions, str):
            try:
                price_conditions = json.loads(price_conditions)
            except:
                price_conditions = []
        
        # Filter out the deleted condition
        original_len = len(price_conditions)
        price_conditions = [pc for pc in price_conditions if pc.get('id') != target_id]
        
        if len(price_conditions) != original_len:
            court.price_conditions = list(price_conditions)
            flag_modified(court, "price_conditions")
            updated_count += 1
            
    db.commit()
    return updated_count

