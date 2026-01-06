# Frontend Migration Guide

## Overview
This guide explains how to update your frontend applications (Admin Panel and User Mobile App) to work with the unified backend.

---

## API Endpoint Changes

### Admin Panel Frontend

**OLD**: `/api/*`  
**NEW**: `/api/admin/*`

#### Example Changes

**Before:**
```javascript
// Old admin API calls
const response = await fetch('http://localhost:8000/api/cities');
const response = await fetch('http://localhost:8000/api/bookings');
const response = await fetch('http://localhost:8000/api/auth/login');
```

**After:**
```javascript
// New admin API calls
const response = await fetch('http://localhost:8000/api/admin/cities');
const response = await fetch('http://localhost:8000/api/admin/bookings');
const response = await fetch('http://localhost:8000/api/admin/auth/login');
```

#### Recommended Approach

Update your API base URL configuration:

```javascript
// config/api.js or similar
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/admin';

export const apiClient = {
  get: (endpoint) => fetch(`${API_BASE_URL}${endpoint}`),
  post: (endpoint, data) => fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  // ... other methods
};
```

---

### User Mobile App

**OLD**: Direct routes (e.g., `/auth/send-otp`, `/bookings`)  
**NEW**: `/api/user/*`

#### Example Changes

**Before:**
```javascript
// Old user API calls
const response = await fetch('http://localhost:8000/auth/send-otp');
const response = await fetch('http://localhost:8000/bookings');
const response = await fetch('http://localhost:8000/profile');
```

**After:**
```javascript
// New user API calls
const response = await fetch('http://localhost:8000/api/user/auth/send-otp');
const response = await fetch('http://localhost:8000/api/user/bookings');
const response = await fetch('http://localhost:8000/api/user/profile');
```

#### Recommended Approach

Update your API configuration file:

```javascript
// src/config/api.js
export const API_BASE_URL = 'http://localhost:8000/api/user';

// src/services/api.js
import { API_BASE_URL } from '../config/api';

export const authApi = {
  sendOTP: (phoneNumber) => 
    fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber })
    }),
  
  verifyOTP: (phoneNumber, otpCode) =>
    fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber, otp_code: otpCode })
    })
};

export const bookingApi = {
  createBooking: (bookingData) =>
    fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(bookingData)
    }),
  
  getBookings: () =>
    fetch(`${API_BASE_URL}/bookings`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    })
};
```

---

## Complete Endpoint Mapping

### Admin Panel Endpoints

| Old Endpoint | New Endpoint | Method | Description |
|-------------|--------------|--------|-------------|
| `/api/auth/login` | `/api/admin/auth/login` | POST | Admin login |
| `/api/cities` | `/api/admin/cities` | GET/POST | City management |
| `/api/areas` | `/api/admin/areas` | GET/POST | Area management |
| `/api/game_types` | `/api/admin/game_types` | GET/POST | Game types |
| `/api/amenities` | `/api/admin/amenities` | GET/POST | Amenities |
| `/api/branches` | `/api/admin/branches` | GET/POST | Branches |
| `/api/courts` | `/api/admin/courts` | GET/POST | Courts |
| `/api/bookings` | `/api/admin/bookings` | GET | All bookings |
| `/api/venues` | `/api/admin/venues` | GET/POST | Venues |
| `/api/coupons` | `/api/admin/coupons` | GET/POST | Coupons |
| `/api/policies` | `/api/admin/policies` | GET/POST | Policies |
| `/api/users` | `/api/admin/users` | GET | User list |
| `/api/reviews` | `/api/admin/reviews` | GET | Reviews |

### User App Endpoints

| Old Endpoint | New Endpoint | Method | Description |
|-------------|--------------|--------|-------------|
| `/auth/send-otp` | `/api/user/auth/send-otp` | POST | Send OTP |
| `/auth/verify-otp` | `/api/user/auth/verify-otp` | POST | Verify OTP |
| `/auth/profile` | `/api/user/auth/profile` | GET | Get profile |
| `/profile` | `/api/user/profile` | GET/PUT | Profile management |
| `/bookings` | `/api/user/bookings` | GET/POST | User bookings |
| `/venues` | `/api/user/venues` | GET | Browse venues |
| `/courts` | `/api/user/courts` | GET | Browse courts |
| `/courts/{id}` | `/api/user/courts/{id}` | GET | Court details |
| `/coupons/validate` | `/api/user/coupons/validate` | POST | Validate coupon |
| `/reviews` | `/api/user/reviews` | GET/POST | Reviews |
| `/notifications/register-token` | `/api/user/notifications/register-token` | POST | Register push token |

---

## Testing the Migration

### 1. Test Admin Panel

```bash
# Test admin login
curl -X POST http://localhost:8000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobile": "1234567890", "password": "password"}'

# Test get cities
curl http://localhost:8000/api/admin/cities
```

### 2. Test User App

```bash
# Test send OTP
curl -X POST http://localhost:8000/api/user/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "9876543210"}'

# Test verify OTP (use dummy OTP: 12345)
curl -X POST http://localhost:8000/api/user/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "9876543210", "otp_code": "12345"}'
```

---

## Environment Variables

### Admin Panel (.env)
```env
REACT_APP_API_URL=http://localhost:8000/api/admin
```

### User Mobile App (.env)
```env
API_BASE_URL=http://localhost:8000/api/user
```

---

## Rollback Plan

If you need to rollback to the old backends:

1. Stop the unified backend
2. Start the old backends:
   ```bash
   # Admin backend (port 8000)
   cd Admin_Myrush/myrush-admin-backend-python
   uvicorn main:app --reload --port 8000
   
   # User backend (port 8001)
   cd Myrush-UserApp/backend_python
   uvicorn main:app --reload --port 8001
   ```
3. Revert frontend API URLs to old endpoints

---

## Common Issues

### Issue: CORS Errors
**Solution**: Ensure the unified backend has proper CORS configuration in `main.py`

### Issue: 404 Not Found
**Solution**: Double-check that you've updated ALL API calls to use the new prefixes

### Issue: Authentication Errors
**Solution**: Verify that tokens are being sent correctly in Authorization headers

### Issue: Different Response Format
**Solution**: The response formats should be identical. If not, check the schema definitions.

---

## Verification Checklist

### Admin Panel
- [ ] Admin login works
- [ ] Can view cities/areas/game types
- [ ] Can create/edit branches
- [ ] Can create/edit courts
- [ ] Can view bookings
- [ ] Can manage coupons
- [ ] Can view users
- [ ] Can view reviews

### User Mobile App
- [ ] OTP login works
- [ ] Can view profile
- [ ] Can create booking
- [ ] Can view bookings
- [ ] Can browse venues/courts
- [ ] Can validate coupons
- [ ] Can submit reviews
- [ ] Push notifications work

---

## Support

If you encounter any issues during migration:
1. Check the unified backend logs
2. Verify API endpoint URLs
3. Test with curl/Postman first
4. Check browser console for errors
5. Contact the backend team

---

## Timeline

**Recommended Migration Steps:**
1. Day 1: Deploy unified backend to staging
2. Day 2: Update admin panel frontend
3. Day 3: Update user mobile app
4. Day 4: Testing and bug fixes
5. Day 5: Production deployment

**Parallel Running Period:**
- Run both old and new backends in parallel for 1 week
- Gradually migrate traffic to new backend
- Monitor for issues
- Decommission old backends after successful migration
