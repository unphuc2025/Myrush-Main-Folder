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

@router.post("", response_model=schemas.CourtBlock)
@router.post("/", response_model=schemas.CourtBlock)
def create_block(
    block: schemas.CourtBlockCreate,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin),
    _ = Depends(PermissionChecker("Court Blocks", "edit"))
):
    """Create a new manual court block with overlap detection"""
    # 1. ATOMIC LOCK & CONFLICT CHECK
    from uuid import UUID
    target_court_id = UUID(str(block.court_id))
    new_mask = block.slice_mask or 0

    # Lock the court and its siblings to prevent race conditions
    from sqlalchemy import or_
    court = db.query(models.Court).filter(models.Court.id == target_court_id).first()
    if not court:
        raise HTTPException(status_code=404, detail="Court not found")
        
    lock_query = db.query(models.Court).filter(
        or_(
            models.Court.id == target_court_id,
            models.Court.shared_group_id == court.shared_group_id if court.shared_group_id else False
        )
    ).with_for_update().all()

    # 2. Unified Conflict Check (Checks both Manual Blocks and User Bookings)
    from utils.conflicts import check_court_availability_conflict
    conflict = check_court_availability_conflict(
        db=db,
        court_id=target_court_id,
        block_date=block.block_date,
        start_time=block.start_time,
        end_time=block.end_time,
        slice_mask=new_mask
    )
    
    if conflict:
        raise HTTPException(status_code=409, detail=conflict)

    # 5. If no conflict, create the block
    db_block = models.CourtBlock(
        court_id=block.court_id,
        block_date=block.block_date,
        start_time=block.start_time,
        end_time=block.end_time,
        reason=block.reason,
        slice_mask=new_mask,
        synced_partners=block.synced_partners,
        blocked_by_id=current_admin.id
    )
    db.add(db_block)
    db.commit()
    db.refresh(db_block)
    
    # --- SYNC TRIGGER ---
    try:
        IntegrationOrchestrator.notify_manual_block_change(db, db_block, 'block')
    except Exception as e:
        print(f"[BLOCK SYNC] Warning: Failed to notify partners of new block: {e}")
        
    return db_block

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
