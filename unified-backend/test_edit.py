import requests

token = "super-admin-token" # If there's an admin token
# wait, actually the backend requires admin authentication
headers = {
    "Authorization": "Bearer admin-token-12345"
}

# The backend route is /api/admin/amenities/{id}
res = requests.put(
    "http://localhost:8000/api/admin/amenities/test-id", 
    data={"name": "test"},
    headers=headers
)
print(res.status_code, res.text)
