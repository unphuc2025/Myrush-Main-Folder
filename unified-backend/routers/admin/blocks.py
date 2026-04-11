from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import models
import schemas
from database import get_db
from dependencies import PermissionChecker, get_current_admin
from datetime import date
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
        query = query.filter(models.CourtBlock.court_id == court_id)
    elif branch_id:
        query = query.join(models.Court).filter(models.Court.branch_id == branch_id)
        
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
    """Create a new manual court block"""
    db_block = models.CourtBlock(
        court_id=block.court_id,
        block_date=block.block_date,
        start_time=block.start_time,
        end_time=block.end_time,
        reason=block.reason,
        slice_mask=block.slice_mask or 0,
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
