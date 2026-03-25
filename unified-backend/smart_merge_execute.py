import json
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from uuid import uuid4

db = SessionLocal()

db_branches_raw = db.query(models.Branch).all()
db_sports_raw = db.query(models.GameType).all()

def fuzzy_match(search_query, entity_list):
    search_query = search_query.lower().strip().replace(" ", "").replace("-", "")
    for entity in entity_list:
        entity_clean = entity.name.lower().strip().replace(" ", "").replace("-", "")
        if search_query in entity_clean or entity_clean in search_query:
            return entity.id
    return None

def get_sport_id_strict(exact_name):
    for entity in db_sports_raw:
        if entity.name.lower() == exact_name.lower(): return str(entity.id)
    return fuzzy_match(exact_name, db_sports_raw)

complex_overrides = {
    "Rush Arena Cooke Town": {
        "Football/Boxcricket": {
            "logic": "divisible", "zones": 4,
            "slices": [
                {"name": "6 a side (Turf 1)", "mask": 1, "price": 2000},
                {"name": "6 a side (Turf 2)", "mask": 2, "price": 2000},
                {"name": "6 a side (Turf 3)", "mask": 4, "price": 2000},
                {"name": "6 a side (Turf 4)", "mask": 8, "price": 2000},
                {"name": "8 a side (Turf 1+2)", "mask": 3, "price": 3500},
                {"name": "8 a side (Turf 3+4)", "mask": 12, "price": 3500},
                {"name": "10 a side (Full Court)", "mask": 15, "price": 6000}
            ]
        }
    },
    "Kengeri": {
        "Football / Cricket": {
            "logic": "divisible", "zones": 3,
            "slices": [
                {"name": "5 a side (Turf 1)", "mask": 1, "price": 1200},
                {"name": "5 a side (Turf 2)", "mask": 2, "price": 1200},
                {"name": "5 a side (Turf 3)", "mask": 4, "price": 1200},
                {"name": "7 a side (Turf 1+2)", "mask": 3, "price": 2200},
                {"name": "10 a side (Full Court)", "mask": 7, "price": 3000}
            ]
        }
    },
    "Chennai": {
        "Football / Cricket": {
            "logic": "divisible", "zones": 2,
            "slices": [
                {"name": "5 a side (Turf 1)", "mask": 1, "price": 1500},
                {"name": "5 a side (Turf 2)", "mask": 2, "price": 1500},
                {"name": "7 a side (Full Court)", "mask": 3, "price": 2600}
            ]
        }
    },
    "Rush Arena Malleshwaram": {
        "Football/Boxcricket": {
            "logic": "divisible", "zones": 1,
            "slices": [
                {"name": "5 a side", "mask": 1, "price": 2000},
                {"name": "7 a side", "mask": 1, "price": 3500}
            ]
        }
    },
    "Rush Arena X KheloMore GT Mall": {
        "Football & Boxcricket": {
            "logic": "divisible", "zones": 2,
            "slices": [
                {"name": "Boxcricket Turf", "mask": 1, "price": 2000},
                {"name": "Football Turf", "mask": 2, "price": 2000}
            ]
        }
    }
}

with open('sheet_data.json', 'r', encoding='utf-8') as f:
    sheet_data = json.load(f)

current_location = None

for row in sheet_data:
    if len(row) < 8: continue
    
    loc_col = row[1].strip()
    sport_col = row[2].strip()
    type_col = row[3].strip()
    brief_col = row[4].strip()
    total_col = row[5].strip()
    timing_col = row[6].strip()
    price_col = row[7].strip()
    
    if loc_col: current_location = loc_col
    if not sport_col or not current_location: continue
         
    branch_id = fuzzy_match(current_location, db_branches_raw)
    if not branch_id: continue
        
    primary_sport = sport_col.split('/')[0].split(',')[0].strip()
    if primary_sport == "Football": primary_sport = "FootBall"
    sport_id = get_sport_id_strict(primary_sport)
    if not sport_id: continue

    matching_courts = db.query(models.Court).filter(
        models.Court.branch_id == branch_id,
        models.Court.game_type_id == sport_id
    ).all()
    
    # Identify override
    override = None
    for loc_key, sp_map in complex_overrides.items():
        if loc_key in current_location or current_location in loc_key:
            for sp_key, ob in sp_map.items():
                if sp_key in sport_col or sport_col in sp_key:
                    override = ob
                    break
            
    is_divisible = False
    total_z = 1
    slices_data = []
    independent_price = 0
    
    if override:
        is_divisible = override["logic"] == "divisible"
        total_z = override["zones"]
        slices_data = override.get("slices", [])
    else:
        try: total_z = int(total_col) if total_col else 1
        except: pass
        
        if "a side" in brief_col.lower() or "a side" in price_col.lower() or "turf" in type_col.lower():
            is_divisible = True
            try: independent_price = int(re.sub(r'[^0-9]', '', price_col)) if price_col else 0
            except: independent_price = 1000
            slices_data = [{"name": primary_sport, "mask": (1 << total_z) - 1, "price": independent_price}]
        else:
            is_divisible = False
            try: independent_price = int(re.sub(r'[^0-9]', '', price_col[:5])) if price_col else 0
            except: independent_price = 0

    if matching_courts:
        master_court = sorted(matching_courts, key=lambda c: c.created_at)[0]
        
        # update Master Court
        master_court.logic_type = "divisible" if is_divisible else "independent"
        master_court.total_zones = total_z
        if independent_price > 0 and not is_divisible:
            master_court.price_per_hour = independent_price
            master_court.is_active = True
            
        print(f"Updated {master_court.name} at {current_location}")
        
        db.query(models.SportSlice).filter(models.SportSlice.court_id == master_court.id).delete()
        if is_divisible:
            for sl in slices_data:
                db.add(models.SportSlice(
                    court_id=master_court.id,
                    name=sl["name"],
                    mask=sl["mask"],
                    sport_id=sport_id,
                    price_per_hour=sl["price"]
                ))
                
        # Hide fragments
        for rc in matching_courts:
            if rc.id != master_court.id:
                rc.is_active = False

    else:
        # Create missing courts (like Cricket Nets, Swimming)
        new_court = models.Court(
            branch_id=branch_id,
            game_type_id=sport_id,
            name=f"{primary_sport} - {current_location}",
            logic_type="divisible" if is_divisible else "independent",
            total_zones=total_z,
            price_per_hour=independent_price,
            is_active=True
        )
        db.add(new_court)
        db.flush()
        
        if is_divisible:
            for sl in slices_data:
                db.add(models.SportSlice(
                    court_id=new_court.id,
                    name=sl["name"],
                    mask=sl["mask"],
                    sport_id=sport_id,
                    price_per_hour=sl["price"]
                ))
        print(f"Created new court: {new_court.name}")

# Special timing parsing for Cooke Town & Malleshwaram unavailable hours could be added here
# Currently they will just have baseline 24/7 and Admin can manually block if needed.

db.commit()
print("DATABASE FULLY MERGED!")
