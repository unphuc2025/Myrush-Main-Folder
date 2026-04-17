from database import SessionLocal, engine
from sqlalchemy import text
import models

db = SessionLocal()
try:
    partners = db.query(models.Partner).all()
    print(f"Found {len(partners)} partners:")
    for p in partners:
        print(f"  ID: {p.id}")
        print(f"  Name: {p.name}")
        print(f"  unique_id: {p.unique_id}")
        print(f"  api_key_hash: {p.api_key_hash[:20]}...")
        print(f"  webhook_url: {p.webhook_url}")
        print(f"  is_active: {p.is_active}")
        
        # Check webhook configs
        configs = db.query(models.PartnerWebhookConfig).filter(
            models.PartnerWebhookConfig.partner_id == p.id
        ).all()
        print(f"  Webhook configs: {len(configs)}")
        for c in configs:
            print(f"    - {c.event_name}: {c.webhook_url} (active={c.is_active}, headers={c.headers})")
        print()
    
    # Check pending outbox events
    pending = db.query(models.OutboxEvent).filter(
        models.OutboxEvent.status.in_(['pending', 'failed'])
    ).count()
    print(f"Pending outbox events: {pending}")
    
finally:
    db.close()
