# Frontend Integration Status & Required Changes

## Current Status

### ✅ Unified Backend
- **Status**: ✅ RUNNING
- **Port**: 8000
- **Admin API**: http://localhost:8000/api/admin
- **User API**: http://localhost:8000/api/user

---

## Admin Panel Frontend

### Current Configuration
**File**: `Admin_Myrush/myrush-admin-frontend/.env`
```env
VITE_API_URL=http://localhost:8000/api/admin
```
✅ **CORRECT** - Environment variable is properly set

### API Client Status
**File**: `Admin_Myrush/myrush-admin-frontend/src/services/adminApi.js`

**Current Endpoints**: Using `/api/cities`, `/api/branches`, etc.
**Required Endpoints**: `/api/admin/cities`, `/api/admin/branches`, etc.

### ⚠️ **ISSUE FOUND**: API endpoints need `/admin` prefix

The admin frontend is correctly reading from `VITE_API_URL` but the API base is set to `http://127.0.0.1:8000` as fallback, and endpoints are using `/api/*` instead of being relative.

### 🔧 **FIX REQUIRED**:

The `adminApi.js` file needs to be updated. Since `API_BASE` is already set to include `/api/admin`, the endpoint calls should be relative (without `/api` prefix).

**Change needed in `adminApi.js`**:

```javascript
// BEFORE (Line 1):
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// AFTER:
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/admin';
```

**OR** update all endpoint calls to be relative:

```javascript
// BEFORE:
getAll: () => apiRequest('/api/cities'),

// AFTER:
getAll: () => apiRequest('/cities'),  // Remove /api prefix
```

**Recommended**: Update the fallback URL to include `/api/admin`:
```javascript
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/admin';
```

Then all endpoints will automatically use the correct prefix.

---

## User Mobile App

### Current Configuration
**File**: `Myrush-UserApp/mobile/.env` (gitignored)

The app uses `src/config/env.ts` which reads from `.env`:

```typescript
// Current fallback
return 'http://65.0.195.149:8000';
```

### ⚠️ **ISSUE FOUND**: Missing `/api/user` prefix

The mobile app needs to use `/api/user` prefix for all endpoints.

### 🔧 **FIX REQUIRED**:

**Option 1: Update .env file** (Recommended)
```env
API_BASE_URL=http://YOUR_LOCAL_IP:8000/api/user
```

**Option 2: Update env.ts fallback**:
```typescript
// File: Myrush-UserApp/mobile/src/config/env.ts
// Line 31 and 36
return 'http://65.0.195.149:8000/api/user';  // Add /api/user
```

### API Endpoint Changes Required

The mobile app currently uses:
- `/auth/register` → Should be `/auth/register` (relative, will become `/api/user/auth/register`)
- `/auth/login` → Should be `/auth/send-otp` and `/auth/verify-otp`
- `/auth/profile` → Should be `/auth/profile` (relative)
- `/bookings` → Should be `/bookings` (relative)
- `/venues` → Should be `/venues` (relative)

**Since the mobile app uses OTP login**, the auth endpoints need updating:

**File**: `Myrush-UserApp/mobile/src/api/otp.ts` (if exists) or create new OTP auth flow

The mobile app should use:
1. `POST /api/user/auth/send-otp` - Send OTP
2. `POST /api/user/auth/verify-otp` - Verify OTP and get JWT

---

## Summary of Required Changes

### Admin Panel ✅ (Almost Ready)
1. ✅ `.env` file configured correctly
2. ⚠️ **Update `adminApi.js` line 1**:
   ```javascript
   const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/admin';
   ```
3. ✅ Restart dev server to pick up .env changes

### User Mobile App ⚠️ (Needs Updates)
1. ⚠️ **Update `.env` file** or **`env.ts` fallback** to include `/api/user`
2. ⚠️ **Verify API endpoints** use relative paths (they already do)
3. ⚠️ **Update auth flow** to use OTP endpoints instead of email/password
4. ✅ Restart app to pick up changes

---

## Testing Checklist

### Admin Panel
- [ ] Restart dev server: `npm run dev`
- [ ] Test admin login
- [ ] Test viewing cities
- [ ] Test viewing branches
- [ ] Test viewing bookings
- [ ] Test creating a court
- [ ] Test managing coupons

### User Mobile App
- [ ] Update API base URL in .env or env.ts
- [ ] Rebuild app or restart Metro bundler
- [ ] Test OTP send
- [ ] Test OTP verify
- [ ] Test viewing venues
- [ ] Test creating booking
- [ ] Test viewing bookings
- [ ] Test submitting review

---

## Quick Fix Commands

### Admin Panel
```bash
cd Admin_Myrush/myrush-admin-frontend

# Edit src/services/adminApi.js line 1
# Change to:
# const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/admin';

# Restart dev server
npm run dev
```

### User Mobile App
```bash
cd Myrush-UserApp/mobile

# Edit src/config/env.ts
# Update line 31 and 36 to include /api/user

# Or create/update .env file:
echo "API_BASE_URL=http://YOUR_IP:8000/api/user" > .env

# Restart Metro bundler
npm start -- --reset-cache
```

---

## Expected API Calls After Fix

### Admin Panel
```
GET http://localhost:8000/api/admin/cities
GET http://localhost:8000/api/admin/branches
GET http://localhost:8000/api/admin/courts
GET http://localhost:8000/api/admin/bookings
POST http://localhost:8000/api/admin/auth/login
```

### User Mobile App
```
POST http://YOUR_IP:8000/api/user/auth/send-otp
POST http://YOUR_IP:8000/api/user/auth/verify-otp
GET http://YOUR_IP:8000/api/user/venues
POST http://YOUR_IP:8000/api/user/bookings
GET http://YOUR_IP:8000/api/user/bookings
```

---

## Next Steps

1. **Fix Admin Panel** (5 minutes)
   - Update `adminApi.js` line 1
   - Restart dev server
   - Test login and basic operations

2. **Fix User Mobile App** (10 minutes)
   - Update `.env` or `env.ts` with `/api/user` prefix
   - Verify OTP auth flow is implemented
   - Restart app
   - Test OTP login

3. **Integration Testing** (30 minutes)
   - Create booking from mobile app
   - Verify it appears in admin panel
   - Update booking status from admin
   - Verify changes work correctly

---

## Status: ⏳ IN PROGRESS

- ✅ Unified backend running
- ✅ Admin .env configured
- ⏳ Admin API client needs minor fix
- ⏳ User app needs API base URL update
- ⏳ User app may need OTP auth implementation check

**Estimated time to complete**: 15-30 minutes
