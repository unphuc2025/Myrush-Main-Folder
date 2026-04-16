from database import SessionLocal
import models

db = SessionLocal()

# List of branches that should only have 1 active turf for both Football/Box Cricket
# Based on the user's sheet and previous audit.
targets = [
    "KheloMore GT Mall",
    "South United GVH",
    "Kasavanahalli",
    "Grid Game",
    "Omega Circuit By RUSH - Hyderabad",
    "Railways",
    "Malleshwaram",
    "Kengeri",
    "Gunjur",
    "Gateway office" # Chennai
]

def consolidate_branch(branch_name):
    print(f"\nAUDITING BRANCH: {branch_name}")
    branch = db.query(models.Branch).filter(models.Branch.name.like(f"%{branch_name}%")).first()
    if not branch:
        print(f"  [Error] Branch not found!")
        return

    active_courts = db.query(models.Court).filter(
        models.Court.branch_id == branch.id,
        models.Court.is_active == True,
        models.Court.game_type_id.in_([
            "91eca5ba-7d72-4db3-93bb-0b14f1c7b15e", # Football
            "55b67f44-205a-4f9f-9490-a4ab1e717fed"  # Boxcricket
        ])
    ).all()

    if len(active_courts) > 1:
        print(f"  [Found] {len(active_courts)} active overlapping courts.")
        # Select the master (Divisible one preferred, otherwise oldest)
        divisibles = [c for c in active_courts if c.logic_type == "divisible"]
        if divisibles:
            master = sorted(divisibles, key=lambda c: c.created_at)[0]
        else:
            master = sorted(active_courts, key=lambda c: c.created_at)[0]
            
        print(f"  [Master] '{master.name}' (ID: {master.id})")
        # Rename to be inclusive
        if "Football" in master.name and "Box" not in master.name:
            master.name = master.name.replace("Football", "Football / Box Cricket")
        elif "Box" in master.name and "Football" not in master.name:
            master.name = master.name.replace("Boxcricket", "Football / Box Cricket").replace("Box Cricket", "Football / Box Cricket")

        for c in active_courts:
            if c.id != master.id:
                print(f"  [Hide] Fragment '{c.name}' (ID: {c.id})")
                c.is_active = False
                # If the fragment has the OTHER sport, make sure the master has a slice for it!
                if c.game_type_id != master.game_type_id:
                     print(f"  [Sync] Adding '{c.game_type.name}' slices to master.")
                     # Add a default slice for this sport if master is divisible
                     if master.logic_type == "divisible":
                         # Get or create slice
                         exists = db.query(models.SportSlice).filter(
                            models.SportSlice.court_id == master.id,
                            models.SportSlice.sport_id == c.game_type_id
                         ).first()
                         if not exists:
                             db.add(models.SportSlice(
                                court_id=master.id,
                                sport_id=c.game_type_id,
                                name=c.game_type.name,
                                mask=(1 << master.total_zones) - 1,
                                price_per_hour=c.price_per_hour
                             ))
    else:
        print("  [OK] No overlapping active segments found.")

for t in targets:
    consolidate_branch(t)

db.commit()
print("\nCONSOLIDATION COMPLETE!")
