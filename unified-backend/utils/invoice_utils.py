import os
from jinja2 import Environment, FileSystemLoader
from sqlalchemy.orm import Session
from uuid import UUID
import models

# Setup Jinja2 environment
template_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates')
jinja_env = Environment(loader=FileSystemLoader(template_dir))

def render_invoice_html(db: Session, booking_id: str, auto_print: bool = False):
    """
    Fetches booking, user, court, branch, and site details and renders the invoice template.
    """
    # 1. Fetch Booking
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        return None

    # 2. Fetch User
    user = db.query(models.User).filter(models.User.id == booking.user_id).first()

    # 3. Fetch Court
    court = db.query(models.Court).filter(models.Court.id == booking.court_id).first()

    # 4. Fetch Branch
    branch = None
    if court:
        branch = db.query(models.Branch).filter(models.Branch.id == court.branch_id).first()

    # 5. Fetch Site Settings
    site = db.query(models.SiteSetting).first()

    # 6. Prepare Template Context
    template = jinja_env.get_template('invoice_template.html')
    
    context = {
        "booking": booking,
        "user": user,
        "court": court,
        "branch": branch,
        "site": site,
        "auto_print": auto_print
    }

    return template.render(context)
