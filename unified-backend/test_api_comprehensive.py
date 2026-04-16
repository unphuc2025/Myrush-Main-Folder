import requests
import json
import time
import os
import sys
import re
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text

# Add current directory to path so we can import local modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models

# Configuration
BASE_URL = "http://localhost:8000"
ADMIN_MOBILE = "9505049225"
ADMIN_PASS = "Admin"
USER_PHONE = "+919916299183"
USER_OTP = "12345"
API_MAP_FILE = "api_map.txt"
RESULTS_FILE = "audit_results.md"

class DbHelper:
    def __init__(self):
        self.db = SessionLocal()
        self.cache = {}

    def get_id(self, model_class):
        model_name = model_class.__name__
        if model_name in self.cache:
            return self.cache[model_name]
        
        try:
            record = self.db.query(model_class).first()
            if record:
                self.cache[model_name] = str(record.id)
                return self.cache[model_name]
        except Exception as e:
            print(f"DB Fetch Error for {model_name}: {e}")
        return None

    def get_first_value(self, model_class, field):
        try:
            record = self.db.query(model_class).first()
            if record:
                return str(getattr(record, field))
        except:
            pass
        return None

    def resolve_param(self, param_name):
        mapping = {
            "branch_id": models.Branch,
            "court_id": models.Court,
            "venue_id": models.AdminVenue,
            "amenity_id": models.Amenity,
            "area_id": models.Area,
            "admin_id": models.Admin,
            "block_id": models.CourtBlock,
            "booking_id": models.Booking,
            "city_id": models.City,
            "coupon_id": models.Coupon,
            "faq_id": models.FAQ,
            "game_type_id": models.GameType,
            "condition_id": models.GlobalPriceCondition,
            "partner_id": models.Partner,
            "role_id": models.Role,
            "policy_id": models.AdminPolicy,
            "user_id": models.User,
            "profile_id": models.Profile,
            "review_id": models.Review,
            "method_id": models.PaymentMethod,
            "webhook_id": models.PartnerWebhookConfig,
            "bookingId": models.Booking,
            "page_id": models.CMSPage,
        }
        
        if param_name in mapping:
            return self.get_id(mapping[param_name])
            
        if param_name == "slug":
            return self.get_first_value(models.CMSPage, "slug") or "about-us"
        if param_name == "display_id":
            return self.get_first_value(models.Booking, "booking_display_id")
        if param_name == "file_path:path":
            return "test_image.jpg"
            
        return "placeholder-id"

    def close(self):
        self.db.close()

class MyRushApiAuditor:
    def __init__(self):
        self.admin_token = None
        self.user_token = None
        self.admin_headers = {}
        self.user_headers = {}
        self.routes = []
        self.results = []
        self.stats = {"total": 0, "success": 0, "fail": 0, "unauthorized": 0, "skipped": 0}
        self.db_helper = DbHelper()

    def authenticate(self):
        print("--- Authenticating ---")
        try:
            res = requests.post(f"{BASE_URL}/api/admin/auth/admins/login", json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASS}, timeout=10)
            if res.status_code == 200:
                data = res.json()
                self.admin_token = data.get("data", {}).get("token")
                if self.admin_token:
                    self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
                    print(f"Admin Authenticated")
        except Exception as e:
            print(f"Admin Auth Error: {e}")

        try:
            requests.post(f"{BASE_URL}/api/user/auth/send-otp", json={"phone_number": USER_PHONE}, timeout=10)
            res = requests.post(f"{BASE_URL}/api/user/auth/verify-otp", json={"phone_number": USER_PHONE, "otp_code": USER_OTP}, timeout=10)
            if res.status_code == 200:
                data = res.json()
                self.user_token = data.get("data", {}).get("access_token")
                if self.user_token:
                    self.user_headers = {"Authorization": f"Bearer {self.user_token}"}
                    print(f"User Authenticated")
        except Exception as e:
            print(f"User Auth Error: {e}")

    def load_routes(self):
        print("--- Loading Routes ---")
        if not os.path.exists(API_MAP_FILE):
             sys.exit(1)
        
        with open(API_MAP_FILE, "r") as f:
            for line in f:
                line = line.strip()
                if not line or " -> " not in line: continue
                parts = line.split(" -> ")
                method = parts[0].split("} ")[0].replace("{","").replace("'","").replace(" ","")
                path = parts[0].split("} ")[1].strip()
                self.routes.append({"method": method, "path": path})
        print(f"Loaded {len(self.routes)} routes.")

    def resolve_path(self, path):
        placeholders = re.findall(r"\{([a-zA-Z0-9_:]+)\}", path)
        resolved_path = path
        for param in placeholders:
            resolved_val = self.db_helper.resolve_param(param)
            resolved_path = resolved_path.replace(f"{{{param}}}", str(resolved_val or "placeholder"))
        return resolved_path

    def run_audit(self):
        self.authenticate()
        self.load_routes()
        
        report = open(RESULTS_FILE, "w", encoding="utf-8")
        report.write("# API Audit Results\n\n| Method | Path | Status | Code | Duration | Notes |\n| --- | --- | --- | --- | --- | --- |\n")
        
        print(f"--- Starting Audit of {len(self.routes)} routes ---")
        
        for route in self.routes:
            method = route["method"]
            path = route["path"]
            resolved_path = self.resolve_path(path)
            
            if method != "GET":
                self.stats["skipped"] += 1
                report.write(f"| {method} | `{path}` | **SKIPPED** | None | -s | Write operation bypassed |\n")
                continue

            headers = self.admin_headers if "/api/admin/" in path else self.user_headers
            
            start_time = time.time()
            try:
                res = requests.get(f"{BASE_URL}{resolved_path}", headers=headers, timeout=10)
                duration = time.time() - start_time
                status_code = res.status_code
                
                status = "PASS" if status_code == 200 else ("UNAUTHORIZED" if status_code == 401 else "FAIL")
                if status == "PASS": self.stats["success"] += 1
                elif status == "UNAUTHORIZED": self.stats["unauthorized"] += 1
                else: self.stats["fail"] += 1
                
                notes = "Resolved: " + resolved_path if resolved_path != path else "OK"
                if status == "FAIL": notes = res.text[:100].replace("|", "\\|")
                
                report.write(f"| {method} | `{path}` | **{status}** | {status_code} | {duration:.3f}s | {notes} |\n")
                print(f"[{status_code}] {method} {resolved_path}")
                
            except Exception as e:
                report.write(f"| {method} | `{path}` | **ERROR** | 0 | 0s | {str(e)} |\n")
                print(f"[ERR] {method} {resolved_path}: {e}")
                self.stats["fail"] += 1
            
            self.stats["total"] += 1
            report.flush()

        report.close()
        
        # Prepend Summary
        with open(RESULTS_FILE, "r") as f: content = f.read()
        summary = f"**Summary:** Total: {self.stats['total']} | Pass: {self.stats['success']} | Fail: {self.stats['fail']} | Unauthorized: {self.stats['unauthorized']} | Skipped: {self.stats['skipped']}\n\n"
        with open(RESULTS_FILE, "w") as f:
            f.write("# API Audit Results\n\n" + summary + content.split("\n\n")[1])
            
        print(f"\n--- Audit Complete ---\n{summary}")

    def verify_outbound_integration(self):
        print("\n--- Verifying Outbound Integration ---")
        court_id = self.db_helper.get_id(models.Court)
        if not court_id: return

        payload = {
            "court_id": court_id,
            "block_date": datetime.now().strftime("%Y-%m-%d"),
            "start_time": "22:00",
            "end_time": "23:00",
            "reason": "Test Block",
            "slice_mask": 0,
            "synced_partners": ["playo"]
        }
        
        try:
            res = requests.post(f"{BASE_URL}/api/admin/blocks", json=payload, headers=self.admin_headers)
            if res.status_code in [200, 201]:
                block_id = res.json().get("data", {}).get("id")
                print(f"Manual Block Created: {block_id}")
                time.sleep(2)
                # Correctly search for block_id within payload JSONB
                from sqlalchemy import cast, String
                event = self.db_helper.db.query(models.OutboxEvent).filter(
                    cast(models.OutboxEvent.payload, String).contains(str(block_id))
                ).first()
                if event: print(f"Outbox Event Captured: {event.action if hasattr(event, 'action') else event.event_type}")
                
                log = self.db_helper.db.query(models.IntegrationLog).filter(
                    models.IntegrationLog.endpoint.contains(str(block_id)) |
                    cast(models.IntegrationLog.request_payload, String).contains(str(block_id))
                ).first()
                if log: print(f"Integration Log Captured: {log.partner_id} -> {log.response_status}")
                
                requests.delete(f"{BASE_URL}/api/admin/blocks/{block_id}", headers=self.admin_headers)
                print("Cleanup done.")
            else:
                print(f"Block Failed: {res.status_code}")
        except Exception as e:
            print(f"Verification Error: {e}")

if __name__ == "__main__":
    auditor = MyRushApiAuditor()
    try:
        auditor.run_audit()
        auditor.verify_outbound_integration()
    finally:
        auditor.db_helper.close()
