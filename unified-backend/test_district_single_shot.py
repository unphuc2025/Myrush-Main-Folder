"""
Single-Pass District Webhook Test
Picks ONE pending event, sends it, reports result, and STOPS.
No retries, no worker loop.
"""
from database import SessionLocal
import models
import json
from datetime import datetime
from services.integrations.adapter_factory import AdapterFactory

db = SessionLocal()
try:
    # 1. Find District partner
    partner = db.query(models.Partner).filter(models.Partner.name == 'District').first()
    if not partner:
        print("ERROR: No District partner found")
        exit(1)

    # 2. Find first pending/failed categorized event for District
    event = db.query(models.OutboxEvent).filter(
        models.OutboxEvent.partner_id == partner.id,
        models.OutboxEvent.status.in_(['pending', 'failed']),
        models.OutboxEvent.category.isnot(None)
    ).first()

    if not event:
        print("No pending categorized District events found.")
        exit(0)

    print(f"Event ID:   {event.id}")
    print(f"Category:   {event.category}")
    print(f"Attempts:   {event.attempts}")
    print(f"Raw Payload:")
    print(json.dumps(event.payload, indent=2))
    print()

    # 3. Get adapter
    adapter = AdapterFactory.get_adapter('District', str(partner.id), db)

    # 4. Format payload
    print("=" * 60)
    print("STEP 1: Formatting payload...")
    formatted = adapter.format_webhook_payload(event.category, event.payload)
    if not formatted:
        print("RESULT: Empty payload returned (branch/court not found). Skipping send.")
        event.status = 'failed'
        event.error_message = 'Empty payload: branch or court not found in DB'
        db.commit()
        exit(0)
    print("Formatted Payload:")
    print(json.dumps(formatted, indent=2))
    print()

    # 5. Send webhook
    print("=" * 60)
    print("STEP 2: Sending to District callback...")
    target_url = partner.webhook_url
    print(f"URL: {target_url}")
    print(f"Headers:")
    print(f"  Content-Type: application/json")
    print(f"  User-Agent: RUSH-Webhook/1.0")
    print(f"  API-KEY: {partner.api_key_hash[:20]}...")
    print(f"  Authorization: Basic {partner.unique_id}")
    print()

    response = adapter.send_webhook(url=target_url, payload=formatted)

    # 6. Report
    print("=" * 60)
    print("RESULT:")
    print(f"  HTTP Status: {response.status_code}")
    print(f"  Response Body: {response.text[:500]}")
    print()

    # 7. Update event status
    if 200 <= response.status_code < 300:
        event.status = 'completed'
        event.error_message = None
        print("EVENT MARKED: completed")
    else:
        event.status = 'failed'
        event.error_message = f"HTTP {response.status_code}: {response.text[:200]}"
        print(f"EVENT MARKED: failed ({response.status_code})")

    event.last_attempt_at = datetime.utcnow()
    event.attempts += 1
    db.commit()

    # 8. Log to integration_logs
    try:
        res_body = response.json()
    except:
        res_body = {"raw": response.text[:500]}

    log = models.IntegrationLog(
        partner_id=partner.id,
        direction='OUTBOUND',
        endpoint=target_url,
        method='POST',
        request_payload=formatted,
        response_status=response.status_code,
        response_payload=res_body
    )
    db.add(log)
    db.commit()
    print("Integration log saved.")

except Exception as e:
    print(f"FATAL ERROR: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
    print("\nDone. Single-pass test complete.")
