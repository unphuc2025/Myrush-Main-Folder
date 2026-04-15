from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import models
import schemas
from database import get_db
from dependencies import PermissionChecker, get_current_admin
from datetime import date
from uuid import UUID
from services.integrations.orchestrator import IntegrationOrchestrator

router = APIRouter(
    prefix="/blocks",
    tags=["court-blocks"]
)

@router.get("", response_model=List[schemas.CourtBlock])
@router.get("/", response_model=List[schemas.CourtBlock])
def get_blocks(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    branch_id: Optional[str] = Query(None),
    court_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _ = Depends(PermissionChecker("Court Blocks", "view"))
):
    """Get manual court blocks with optional branch, court, and date filters"""
    query = db.query(models.CourtBlock)
    
    if start_date:
        query = query.filter(models.CourtBlock.block_date >= start_date)
    if end_date:
        query = query.filter(models.CourtBlock.block_date <= end_date)
    
    if court_id:
        # Check if the court belongs to a shared group
        from uuid import UUID
        cid = UUID(str(court_id))
        court = db.query(models.Court).filter(models.Court.id == cid).first()
        if court and court.shared_group_id:
            # Get all court IDs in this group
            group_id = UUID(str(court.shared_group_id))
            group_court_ids = db.query(models.Court.id).filter(
                models.Court.shared_group_id == group_id
            ).all()
            court_ids = [cid_val[0] for cid_val in group_court_ids]
            query = query.filter(models.CourtBlock.court_id.in_(court_ids))
        else:
            query = query.filter(models.CourtBlock.court_id == cid)
    elif branch_id:
        from uuid import UUID
        query = query.join(models.Court).filter(models.Court.branch_id == UUID(str(branch_id)))
        
    blocks = query.options(
        joinedload(models.CourtBlock.court),
        joinedload(models.CourtBlock.blocked_by)
    ).all()
    
    # Enrich for schema
    result = []
    for b in blocks:
        # Create a dictionary from the model
        block_data = {
            "id": str(b.id),
            "court_id": str(b.court_id),
            "block_date": b.block_date,
            "start_time": b.start_time,
            "end_time": b.end_time,
            "reason": b.reason,
            "slice_mask": b.slice_mask or 0,
            "synced_partners": b.synced_partners,
            "blocked_by_id": str(b.blocked_by_id) if b.blocked_by_id else None,
            "created_at": b.created_at,
            "court_name": b.court.name if b.court else "Unknown",
            "shared_group_id": str(b.court.shared_group_id) if b.court and b.court.shared_group_id else None,
            "blocked_by_name": b.blocked_by.name if b.blocked_by else "System"
        }
        result.append(block_data)
        
    return result

@router.post("", response_model=List[schemas.CourtBlock])
@router.post("/", response_model=List[schemas.CourtBlock])
def create_block(
    block: schemas.CourtBlockCreate,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin),
    _ = Depends(PermissionChecker("Court Blocks", "edit"))
):
    """Create one or more manual court blocks (supports date ranges)"""
    from uuid import UUID
    from datetime import timedelta
    
    court_id_str = str(block.court_id)
    if ":" in court_id_str:
        court_id_str = court_id_str.split(":")[0]
        
    target_court_id = UUID(court_id_str)
    new_mask = block.slice_mask or 0
    target_capacity = block.blocked_capacity # Can be None/0 for full block

    # 1. Determine date range
    start_date = block.block_date
    end_date = block.end_date or start_date
    
    if end_date < start_date:
        raise HTTPException(status_code=400, detail="End date cannot be before start date")
        
    # Limit max range to 31 days to prevent accidental massive DB spam
    if (end_date - start_date).days > 31:
        raise HTTPException(status_code=400, detail="Maximum block range is 31 days")

    # Lock the court and its siblings for the entire operation
    from sqlalchemy import or_
    court = db.query(models.Court).filter(models.Court.id == target_court_id).first()
    if not court:
        raise HTTPException(status_code=404, detail="Court not found")
        
    db.query(models.Court).filter(
        or_(
            models.Court.id == target_court_id,
            models.Court.shared_group_id == court.shared_group_id if court.shared_group_id else False
        )
    ).with_for_update().all()

    created_blocks = []
    current_date = start_date
    
    # Iterate through each day in the range
    from utils.conflicts import check_court_availability_conflict
    
    while current_date <= end_date:
        # Conflict Check for this specific day
        conflict = check_court_availability_conflict(
            db=db,
            court_id=target_court_id,
            block_date=current_date,
            start_time=block.start_time,
            end_time=block.end_time,
            slice_mask=new_mask,
            blocked_capacity=target_capacity
        )
        
        if conflict:
            # If any day in the range has a conflict, we abort the WHOLE request to maintain atomicity?
            # Or we could return a partial success? 
            # Industry standard for "Block" is usually all-or-nothing for a single request.
            db.rollback()
            raise HTTPException(status_code=409, detail=f"Conflict on {current_date}: {conflict}")

        # Create the block for this day
        db_block = models.CourtBlock(
            court_id=target_court_id,
            block_date=current_date,
            start_time=block.start_time,
            end_time=block.end_time,
            reason=block.reason,
            slice_mask=new_mask,
            blocked_capacity=target_capacity,
            synced_partners=block.synced_partners,
            blocked_by_id=current_admin.id
        )
        db.add(db_block)
        created_blocks.append(db_block)
        current_date += timedelta(days=1)

    db.commit()
    
    # Refresh and Notify for each block
    for b in created_blocks:
        db.refresh(b)
        try:
            IntegrationOrchestrator.notify_manual_block_change(db, b, 'block')
        except Exception as e:
            print(f"[BLOCK SYNC] Warning: Failed to notify partners for {b.block_date}: {e}")
        
    return created_blocks

@router.delete("/{block_id}")
def delete_block(
    block_id: str,
    db: Session = Depends(get_db),
    _ = Depends(PermissionChecker("Court Blocks", "delete"))
):
    """Remove a manual court block"""
    db_block = db.query(models.CourtBlock).filter(models.CourtBlock.id == block_id).first()
    if not db_block:
        raise HTTPException(status_code=404, detail="Block not found")
    
    # --- SYNC TRIGGER (Release partners before local deletion) ---
    try:
        IntegrationOrchestrator.notify_manual_block_change(db, db_block, 'available')
    except Exception as e:
        print(f"[BLOCK SYNC] Warning: Failed to notify partners of block release: {e}")

    db.delete(db_block)
    db.commit()
    return {"message": "Block removed successfully"}
