import json
import re
from sqlalchemy.orm import Session
from database import SessionLocal
import models

db = SessionLocal()

# Hardcoded DB lookup tables for reliable exact matching
db_branches_raw = db.query(models.Branch).all()
db_sports_raw = db.query(models.GameType).all()

# Build fuzzy search dictionaries
def fuzzy_match(search_query, entity_list):
    search_query = search_query.lower().strip().replace(" ", "").replace("-", "")
    # Try exact substring match first
    for entity in entity_list:
        entity_clean = entity.name.lower().strip().replace(" ", "").replace("-", "")
        if search_query in entity_clean or entity_clean in search_query:
            return entity.id
    return None

# Load the json
with open('sheet_data.json', 'r', encoding='utf-8') as f:
    sheet_data = json.load(f)

with open('dryrun_output.txt', 'w', encoding='utf-8') as logger:
    def log(msg):
        logger.write(str(msg) + '\n')
        
    log("--- SMART MERGE DRY RUN ---")
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
        
        if loc_col:
            current_location = loc_col
            
        if not sport_col:
            continue # Empty row
            
        if not current_location:
             continue
             
        # Attempt to match Branch
        branch_id = fuzzy_match(current_location, db_branches_raw)
        if not branch_id:
            log(f"[ERROR] Could not match branch: {current_location}")
            continue
            
        # Attempt to match Sport (take primary sport if multiple listed like Football/Boxcricket)
        primary_sport = sport_col.split('/')[0].split(',')[0].strip()
        sport_id = fuzzy_match(primary_sport, db_sports_raw)
        if not sport_id:
            log(f"[ERROR] Could not match sport: {primary_sport} for row {current_location}")
            continue
            
        total_zones = 1
        try:
            total_zones = int(total_col) if total_col else 1
        except: pass
        
        log(f"\n[TARGET] {current_location} -> {sport_col}")
        log(f"   Zones: {total_zones}, Type: {type_col}")
        log(f"   Pricing/Rules: {repr(price_col)}")
        
        # Find existing courts at this branch matching this primary sport
        matching_courts = db.query(models.Court).filter(
            models.Court.branch_id == branch_id,
            models.Court.game_type_id == sport_id
        ).all()
        
        if not matching_courts:
            log(f"   [ACTION] No existing court found! Script would CREATE a new one.")
        else:
            # Pick the oldest created one (most likely to have images/original text)
            master_court = sorted(matching_courts, key=lambda c: c.created_at)[0]
            log(f"   [MERGE] Selected Master Court: '{master_court.name}' (ID: {master_court.id})")
            
            # Decide if Divisible or Independent
            is_divisible = False
            if "a side" in brief_col.lower() or "a side" in price_col.lower() or "turf" in type_col.lower():
                if total_zones > 0:
                    is_divisible = True
                    
            log(f"   [UPDATE] Set logic_type = {'divisible' if is_divisible else 'independent'}")
            log(f"   [UPDATE] Set total_zones = {total_zones}")
            
            if is_divisible:
                log(f"   [UPDATE] Will inject specific sport_slices derived from Brief and Price text.")
                
            remaining_courts = [c for c in matching_courts if c.id != master_court.id]
            if remaining_courts:
                log(f"   [HIDE] Will set is_active=False on {len(remaining_courts)} redundant fragmented courts:")
                for rc in remaining_courts:
                    log(f"      - {rc.name}")

    log("\n--- END OF DRY RUN ---")
