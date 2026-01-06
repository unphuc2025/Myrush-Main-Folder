# Unified Backend Merge Script
# This script automates the merging of Admin and User backends

import os
import shutil
from pathlib import Path

# Define paths
BASE_DIR = Path(r"c:\Users\ajayp\Desktop\myrush-Main-folder")
ADMIN_BACKEND = BASE_DIR / "Admin_Myrush" / "myrush-admin-backend-python"
USER_BACKEND = BASE_DIR / "Myrush-UserApp" / "backend_python"
UNIFIED_BACKEND = BASE_DIR / "unified-backend"

print("=" * 60)
print("MYRUSH BACKEND MERGE AUTOMATION")
print("=" * 60)

# Step 1: Copy crud.py from user backend
print("\n[1/10] Copying crud.py from user backend...")
shutil.copy2(USER_BACKEND / "crud.py", UNIFIED_BACKEND / "crud.py")
print("✅ crud.py copied")

# Step 2: Copy utils from admin backend
print("\n[2/10] Copying utils directory from admin backend...")
if (ADMIN_BACKEND / "utils").exists():
    shutil.copytree(ADMIN_BACKEND / "utils", UNIFIED_BACKEND / "utils", dirs_exist_ok=True)
    print("✅ utils directory copied")
else:
    print("⚠️  utils directory not found in admin backend, skipping...")

# Step 3: Copy all admin routers
print("\n[3/10] Copying admin routers...")
admin_routers_src = ADMIN_BACKEND / "routers"
admin_routers_dest = UNIFIED_BACKEND / "routers" / "admin"

if admin_routers_src.exists():
    # Create __init__.py for admin routers
    (admin_routers_dest / "__init__.py").touch()
    
    # Copy all router files
    for router_file in admin_routers_src.glob("*.py"):
        if router_file.name != "__init__.py" and not router_file.name.startswith("__pycache__"):
            shutil.copy2(router_file, admin_routers_dest / router_file.name)
            print(f"  ✅ Copied {router_file.name}")
else:
    print("❌ Admin routers directory not found!")

# Step 4: Copy all user routers
print("\n[4/10] Copying user routers...")
user_routers_src = USER_BACKEND / "routers"
user_routers_dest = UNIFIED_BACKEND / "routers" / "user"

if user_routers_src.exists():
    # Create __init__.py for user routers
    (user_routers_dest / "__init__.py").touch()
    
    # Copy all router files
    for router_file in user_routers_src.glob("*.py"):
        if router_file.name != "__init__.py" and not router_file.name.startswith("__pycache__"):
            shutil.copy2(router_file, user_routers_dest / router_file.name)
            print(f"  ✅ Copied {router_file.name}")
else:
    print("❌ User routers directory not found!")

# Step 5: Copy .env file from admin backend
print("\n[5/10] Copying .env file...")
if (ADMIN_BACKEND / ".env").exists():
    shutil.copy2(ADMIN_BACKEND / ".env", UNIFIED_BACKEND / ".env")
    print("✅ .env file copied from admin backend")
elif (USER_BACKEND / ".env").exists():
    shutil.copy2(USER_BACKEND / ".env", UNIFIED_BACKEND / ".env")
    print("✅ .env file copied from user backend")
else:
    print("⚠️  No .env file found, you'll need to create one")

# Step 6: Copy requirements.txt
print("\n[6/10] Merging requirements.txt...")
admin_reqs = set()
user_reqs = set()

if (ADMIN_BACKEND / "requirements.txt").exists():
    with open(ADMIN_BACKEND / "requirements.txt", "r") as f:
        admin_reqs = set(line.strip() for line in f if line.strip() and not line.startswith("#"))

if (USER_BACKEND / "requirements.txt").exists():
    with open(USER_BACKEND / "requirements.txt", "r") as f:
        user_reqs = set(line.strip() for line in f if line.strip() and not line.startswith("#"))

all_reqs = sorted(admin_reqs.union(user_reqs))

with open(UNIFIED_BACKEND / "requirements.txt", "w") as f:
    f.write("# Unified Backend Requirements\n")
    f.write("# Merged from Admin and User backends\n\n")
    for req in all_reqs:
        f.write(f"{req}\n")

print(f"✅ Merged {len(all_reqs)} unique requirements")

# Step 7: Create __init__.py files
print("\n[7/10] Creating __init__.py files...")
(UNIFIED_BACKEND / "routers" / "__init__.py").touch()
print("✅ Created routers/__init__.py")

# Step 8: Copy uploads directory if exists
print("\n[8/10] Copying uploads directory...")
if (ADMIN_BACKEND / "uploads").exists():
    shutil.copytree(ADMIN_BACKEND / "uploads", UNIFIED_BACKEND / "uploads", dirs_exist_ok=True)
    print("✅ Uploads directory copied")
else:
    (UNIFIED_BACKEND / "uploads").mkdir(exist_ok=True)
    print("✅ Created empty uploads directory")

print("\n[9/10] Files copied successfully!")
print("\n[10/10] Next steps:")
print("  1. Review and merge models.py manually (complex merge required)")
print("  2. Review and merge schemas.py manually (complex merge required)")
print("  3. Create dependencies.py for authentication")
print("  4. Create main.py with all router imports")
print("  5. Update router imports to use new structure")
print("  6. Test the unified backend")

print("\n" + "=" * 60)
print("MERGE AUTOMATION COMPLETE!")
print("=" * 60)
print(f"\nUnified backend location: {UNIFIED_BACKEND}")
print("\nManual steps required:")
print("  - Merge models.py (combining both backends)")
print("  - Merge schemas.py (combining both backends)")
print("  - Create dependencies.py (authentication logic)")
print("  - Create main.py (FastAPI app with all routers)")
print("  - Update router prefixes and imports")
