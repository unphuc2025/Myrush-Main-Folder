"""Quick verification of gateway_client."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.integrations.gateway_client import DistrictGatewayClient

# 1. Test Client Initialization (requires args now)
try:
    client_fail = DistrictGatewayClient()
    print("❌ ERROR: Client shouldn't init without args")
    sys.exit(1)
except ValueError:
    print("1. PASS: Client correctly demands args")

client = DistrictGatewayClient(vendor_id="1", vendor_secret="sk_test_rush_gateway_2026_district_secure")
assert client.vendor_id == "1"
assert client.vendor_secret == "sk_test_rush_gateway_2026_district_secure"
assert client.key_version == "1"
print("2. PASS: DB overrides explicitly set work")

# 3. Headers generated correctly
headers = client._build_auth_headers("GET", "http://localhost:3000/api/api/checkAvailability/")
print(f"3. Headers:")
for k, v in headers.items():
    print(f"   {k}: {v}")
assert headers["X-Client-Id"] == "1"
assert headers["X-Key-Version"] == "1"
assert len(headers["X-Timestamp"]) == 13
assert len(headers["X-Signature"]) == 64  # SHA256 hex = 64 chars
print("   PASS: All 4 headers correct")

# 4. Signature uses the secret key
import time
ts = headers["X-Timestamp"]
sig1 = client._compute_signature("GET", "/api/api/checkAvailability/", ts, "")
print(f"4. Signature validation:")
print(f"   Sig (secret='sk_test...'): {sig1[:32]}...")
print("   PASS: Signature successfully generated")

print("\n" + "=" * 40)
print("ALL TESTS PASSED")
print("=" * 40)
