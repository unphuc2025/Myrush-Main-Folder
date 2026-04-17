"""End-to-end test: Format a real categorized event and show the exact output District will receive"""
from database import SessionLocal
import models
import json
from services.integrations.adapter_factory import AdapterFactory

db = SessionLocal()
try:
    district_partner = db.query(models.Partner).filter(models.Partner.name == 'District').first()
    
    # Get a properly categorized event
    event = db.query(models.OutboxEvent).filter(
        models.OutboxEvent.partner_id == district_partner.id,
        models.OutboxEvent.category.isnot(None),
        models.OutboxEvent.status.in_(['pending', 'failed'])
    ).first()
    
    if not event:
        print("No categorized events to test")
        exit(0)
    
    print("=" * 60)
    print("RAW INTERNAL PAYLOAD (what MyRush stores):")
    print("=" * 60)
    print(json.dumps(event.payload, indent=2))
    
    # Format it through the adapter
    adapter = AdapterFactory.get_adapter('District', str(district_partner.id), db)
    formatted = adapter.format_webhook_payload(event.category, event.payload)
    
    print()
    print("=" * 60)
    print("FORMATTED PAYLOAD (what District callback will receive):")
    print("=" * 60)
    print(json.dumps(formatted, indent=2))
    
    print()
    print("=" * 60)
    print("REFERENCE (from District's spec):")
    print("=" * 60)
    reference = {
        "sourceType": "inventory",
        "action": "update",
        "data": [{
            "courtNumber": "0",
            "slotNumber": "0",
            "count": "1",
            "sport": "basketBall",
            "facilityName": "testHICAS",
            "day": "6",
            "price": 11
        }],
        "timestamp": 1761645965,
        "requestId": "reqId2225"
    }
    print(json.dumps(reference, indent=2))
    
    # Field-by-field comparison
    print()
    print("=" * 60)
    print("FIELD COMPARISON:")
    print("=" * 60)
    data_item = formatted.get("data", [{}])[0] if formatted.get("data") else {}
    ref_item = reference["data"][0]
    
    for key in ref_item:
        ours = data_item.get(key, "MISSING")
        print(f"  {key:15s}: ours={ours!r:30s}  ref={ref_item[key]!r}")
    
    # Check top-level keys
    for key in reference:
        if key == "data": continue
        ours = formatted.get(key, "MISSING")
        print(f"  {key:15s}: ours={ours!r:30s}  ref={reference[key]!r}")

finally:
    db.close()
