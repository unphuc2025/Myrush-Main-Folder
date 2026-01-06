# Backend Merge Implementation Plan

## Overview
Merging two FastAPI backends (Admin_Myrush and Myrush-UserApp) into a single unified backend with role-based routing.

---

## Current Architecture Analysis

### **Admin_Myrush Backend** (`myrush-admin-backend-python`)
- **Port**: Likely 8000
- **Authentication**: Admin login with mobile + password (plaintext for dev)
- **Database**: PostgreSQL (Supabase) - MYRUSH database
- **Tables Used**:
  - `admins` - Admin users
  - `admin_cities`, `admin_areas`, `admin_game_types`, `admin_amenities`
  - `admin_branches`, `admin_courts`, `admin_bookings`
  - `admin_coupons`, `admin_cancellations_terms`, `admin_global_price_conditions`
  - `adminvenues`
  - `users`, `booking`, `reviews` (shared with user app - READ/WRITE)

**API Endpoints** (prefix: `/api`):
- `/api/auth/*` - Admin authentication, user/profile management
- `/api/cities/*` - City management
- `/api/areas/*` - Area management
- `/api/game_types/*` - Game type management
- `/api/amenities/*` - Amenity management
- `/api/branches/*` - Branch management
- `/api/courts/*` - Court management
- `/api/bookings/*` - Booking management (admin view of user bookings)
- `/api/venues/*` - Venue management
- `/api/global_price_conditions/*` - Global pricing
- `/api/coupons/*` - Coupon management
- `/api/policies/*` - Cancellation policies & terms
- `/api/users/*` - User management (read-only)
- `/api/reviews/*` - Review management

---

### **Myrush-UserApp Backend** (`backend_python`)
- **Port**: Likely 8001
- **Authentication**: OTP-based mobile login (JWT tokens)
- **Database**: Same PostgreSQL (Supabase) - MYRUSH database
- **Tables Used**:
  - `users`, `profiles`, `otp_verifications`
  - `booking` (shared - READ/WRITE)
  - `admin_courts`, `admin_cities`, `admin_game_types` (READ-ONLY)
  - `adminvenues` (READ-ONLY)
  - `reviews` (shared - READ/WRITE)
  - `tournaments`, `tournament_participants`
  - `push_tokens`

**API Endpoints** (no `/api` prefix):
- `/auth/*` - OTP login, user registration, JWT authentication
- `/profile/*` - User profile management
- `/bookings/*` - User booking creation and retrieval
- `/venues/*` - Venue browsing
- `/courts/*` - Court availability and pricing
- `/coupons/*` - Coupon validation and usage
- `/reviews/*` - Review submission
- `/notifications/*` - Push notification management

---

## Shared Tables (Both backends READ/WRITE)
1. **`users`** - User accounts
2. **`booking`** - User bookings (admin manages, users create)
3. **`reviews`** - Court reviews (admin moderates, users create)

---

## Merge Strategy: Single Unified Backend

### **Architecture**
```
unified-backend/
├── main.py                    # Main FastAPI app
├── database.py                # Database configuration
├── models.py                  # All SQLAlchemy models (merged)
├── schemas.py                 # All Pydantic schemas (merged)
├── crud.py                    # CRUD operations (from user app)
├── dependencies.py            # Shared dependencies (auth, role checks)
├── utils/
│   ├── email_sender.py        # Email utilities
│   └── jwt_handler.py         # JWT token handling
├── routers/
│   ├── admin/                 # Admin-only routes
│   │   ├── __init__.py
│   │   ├── auth.py            # Admin login
│   │   ├── cities.py
│   │   ├── areas.py
│   │   ├── game_types.py
│   │   ├── amenities.py
│   │   ├── branches.py
│   │   ├── courts.py
│   │   ├── bookings.py        # Admin booking management
│   │   ├── venues.py
│   │   ├── global_price_conditions.py
│   │   ├── coupons.py
│   │   ├── policies.py
│   │   ├── users.py           # User management
│   │   └── reviews.py         # Review moderation
│   └── user/                  # User-facing routes
│       ├── __init__.py
│       ├── auth.py            # OTP login
│       ├── profile.py
│       ├── bookings.py        # User booking creation
│       ├── venues.py
│       ├── courts.py
│       ├── coupons.py
│       ├── reviews.py
│       └── notifications.py
├── middleware/
│   └── role_middleware.py     # Role-based access control
└── .env                       # Environment variables
```

---

## Implementation Steps

### **Phase 1: Setup Unified Backend Structure**
1. Create new directory: `unified-backend`
2. Copy and merge configuration files:
   - Merge `database.py` (use better connection pooling from user app)
   - Merge `models.py` (combine all models, resolve UUID vs String conflicts)
   - Merge `schemas.py` (combine all Pydantic schemas)
   - Copy `crud.py` from user app
   - Create `dependencies.py` for shared auth logic

### **Phase 2: Merge Models**
**Key Conflicts to Resolve**:
- **UUID Type Mismatch**:
  - Admin backend: `UUID(as_uuid=True)` - Python UUID objects
  - User backend: `UUID(as_uuid=False)` - String UUIDs
  - **Solution**: Use `UUID(as_uuid=True)` consistently (better type safety)

- **User Model Differences**:
  - Admin: Has `password_hash`, `first_name`, `last_name`
  - User: Has `password_hash`, `first_name`, `last_name`, `email` (required)
  - **Solution**: Merge into single User model with all fields

- **Booking Model**:
  - Admin: `AdminBooking` (separate table `admin_bookings`)
  - User: `Booking` (table `booking`)
  - **Solution**: Keep both tables, use `Booking` for user bookings, `AdminBooking` for admin-created bookings

### **Phase 3: Reorganize Routers**
1. **Admin Routes** (prefix: `/api/admin`):
   - Move all admin routes to `routers/admin/`
   - Add admin authentication middleware
   - Endpoints: `/api/admin/auth/login`, `/api/admin/cities`, etc.

2. **User Routes** (prefix: `/api/user`):
   - Move all user routes to `routers/user/`
   - Add JWT authentication middleware
   - Endpoints: `/api/user/auth/send-otp`, `/api/user/bookings`, etc.

### **Phase 4: Authentication & Authorization**
1. **Create `dependencies.py`**:
   ```python
   # Admin authentication
   def get_current_admin(token: str, db: Session):
       # Validate admin token
       # Return admin object
   
   # User authentication (JWT)
   def get_current_user(token: str, db: Session):
       # Validate JWT token
       # Return user object
   
   # Role-based access
   def require_super_admin(admin: Admin):
       # Check if admin is super_admin
   
   def require_branch_admin(admin: Admin):
       # Check if admin is branch_admin
   ```

2. **Update all admin routes** to use `Depends(get_current_admin)`
3. **Update all user routes** to use `Depends(get_current_user)`

### **Phase 5: Update main.py**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base

app = FastAPI(title="MyRush Unified API")

# CORS
app.add_middleware(CORSMiddleware, ...)

# Include Admin Routers
from routers.admin import (
    auth as admin_auth,
    cities, areas, game_types, amenities,
    branches, courts, bookings as admin_bookings,
    venues, global_price_conditions, coupons,
    policies, users, reviews as admin_reviews
)

app.include_router(admin_auth.router, prefix="/api/admin")
app.include_router(cities.router, prefix="/api/admin")
# ... all admin routers

# Include User Routers
from routers.user import (
    auth as user_auth,
    profile, bookings as user_bookings,
    venues as user_venues, courts as user_courts,
    coupons as user_coupons, reviews as user_reviews,
    notifications
)

app.include_router(user_auth.router, prefix="/api/user")
app.include_router(profile.router, prefix="/api/user")
# ... all user routers
```

### **Phase 6: Testing**
1. **Test Admin Endpoints**:
   - Admin login: `POST /api/admin/auth/login`
   - City CRUD: `GET/POST/PUT/DELETE /api/admin/cities`
   - Booking management: `GET /api/admin/bookings`

2. **Test User Endpoints**:
   - OTP login: `POST /api/user/auth/send-otp`, `POST /api/user/auth/verify-otp`
   - Create booking: `POST /api/user/bookings`
   - Get user bookings: `GET /api/user/bookings`

3. **Test Shared Resources**:
   - Admin creates booking → User sees it
   - User creates review → Admin can moderate it

### **Phase 7: Frontend Integration**
1. **Update Admin Frontend**:
   - Change API base URL from `/api` to `/api/admin`
   - Update all API calls

2. **Update User Mobile App**:
   - Change API base URL to `/api/user`
   - Update all API calls

---

## Migration Checklist

### Pre-Migration
- [ ] Backup current database
- [ ] Document all current API endpoints
- [ ] Test both backends independently
- [ ] Note down any custom middleware/dependencies

### During Migration
- [ ] Create unified-backend directory
- [ ] Merge models.py (resolve UUID conflicts)
- [ ] Merge schemas.py
- [ ] Merge database.py
- [ ] Create dependencies.py
- [ ] Reorganize routers into admin/ and user/
- [ ] Update all router imports in main.py
- [ ] Add authentication to all routes
- [ ] Test locally

### Post-Migration
- [ ] Update frontend API endpoints
- [ ] Update mobile app API endpoints
- [ ] Test all CRUD operations
- [ ] Test authentication flows
- [ ] Deploy unified backend
- [ ] Monitor for errors

---

## Benefits of This Approach

1. **Single Codebase**: Easier to maintain and deploy
2. **Shared Database Logic**: No duplication of models/schemas
3. **Clear Separation**: Admin and user routes are clearly separated
4. **Role-Based Access**: Proper authentication and authorization
5. **Scalability**: Easy to add new roles (e.g., branch_admin routes)
6. **Type Safety**: Consistent UUID handling across the app

---

## Potential Challenges

1. **UUID Type Mismatch**: Need to standardize on `UUID(as_uuid=True)`
2. **Frontend Updates**: Both frontends need API endpoint updates
3. **Authentication**: Two different auth systems (admin token vs JWT)
4. **Testing**: Need comprehensive testing of all endpoints
5. **Deployment**: Need to update deployment configuration

---

## Timeline Estimate

- **Phase 1-2** (Setup & Models): 2-3 hours
- **Phase 3-4** (Routers & Auth): 3-4 hours
- **Phase 5** (Main App): 1 hour
- **Phase 6** (Testing): 2-3 hours
- **Phase 7** (Frontend Integration): 2-3 hours

**Total**: 10-14 hours

---

## Next Steps

1. Review this plan and confirm approach
2. Create backup of both backends
3. Start with Phase 1: Create unified-backend structure
4. Proceed step-by-step with testing at each phase

---

## Questions to Confirm

1. Should we keep both `admin_bookings` and `booking` tables, or merge them?
2. Do you want to standardize on JWT tokens for both admin and user auth?
3. Should we implement proper password hashing for admins?
4. Do you want to add rate limiting or other security features?
5. Should we maintain backward compatibility with old API endpoints during transition?
