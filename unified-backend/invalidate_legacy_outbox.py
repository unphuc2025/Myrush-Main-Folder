from database import SessionLocal
import models
from datetime import datetime
import json

db = SessionLocal()
try:
    # 1. Identify legacy events
    # We identify them by category=None and status in ['pending', 'failed']
    legacy_events = db.query(models.OutboxEvent).filter(
        models.OutboxEvent.category.is_(None),
        models.OutboxEvent.status.in_(['pending', 'failed'])
    ).all()
    
    count = len(legacy_events)
    print(f"Found {count} legacy events for invalidation.")
    
    if count > 0:
        # 2. Bulk update
        for event in legacy_events:
            event.status = 'failed'
            event.error_message = 'Invalidated by modular refactor: legacy payload format detected'
            event.next_attempt_at = None # Prevent retries
            
        db.commit()
        print(f"Successfully invalidated {count} legacy events.")
    
    # 3. Final Verification
    remaining_pending = db.query(models.OutboxEvent).filter(
        models.OutboxEvent.status.in_(['pending', 'failed']),
        models.OutboxEvent.category.is_(None)
    ).count()
    
    total_active_new = db.query(models.OutboxEvent).filter(
        models.OutboxEvent.status.in_(['pending', 'failed']),
        models.OutboxEvent.category.isnot(None)
    ).count()
    
    print("\n--- OUTBOX STATUS ---")
    print(f"Pending/Failed Legacy Events: {remaining_pending}")
    print(f"Pending/Failed New (Categorized) Events: {total_active_new}")
    
    if remaining_pending == 0:
        print("\nSYSTEM READY: Outbox is clean of incompatible legacy data.")
    else:
        print("\nWARNING: Some legacy events might still be active.")

finally:
    db.close()
