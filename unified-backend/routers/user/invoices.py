from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
import models
from utils.invoice_utils import render_invoice_html

router = APIRouter(
    prefix="/bookings",
    tags=["invoices"],
)

@router.get("/{booking_id}/invoice", response_class=HTMLResponse)
def get_booking_invoice(
    booking_id: str,
    print: bool = Query(False, alias="print"),
    db: Session = Depends(get_db),
    # For now, allowing anyone with the link to view for ease of printing/sharing, 
    # but we can add get_current_user later if strict security is needed.
):
    """
    Returns a rendered HTML invoice for the given booking ID.
    If ?print=true is provided, the browser print dialog will open automatically.
    """
    html_content = render_invoice_html(db, booking_id, auto_print=print)
    
    if not html_content:
        raise HTTPException(status_code=404, detail="Invoice not found or booking ID invalid")
        
    return html_content
