# MyRush Unified Backend Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATIONS                          │
├──────────────────────────────┬──────────────────────────────────────┤
│                              │                                      │
│    Admin Panel (Web)         │      User Mobile App (React Native) │
│    - React/Next.js           │      - iOS/Android                  │
│    - Port: 3000              │      - Expo/React Native            │
│                              │                                      │
└──────────────┬───────────────┴────────────────┬─────────────────────┘
               │                                │
               │ HTTP/REST                      │ HTTP/REST
               │ /api/admin/*                   │ /api/user/*
               │                                │
               └────────────┬───────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    UNIFIED BACKEND (FastAPI)                         │
│                         Port: 8000                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                      main.py                                │   │
│  │  - FastAPI Application                                      │   │
│  │  - CORS Middleware                                          │   │
│  │  - Exception Handlers                                       │   │
│  │  - Static File Serving (/uploads)                          │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────┐    ┌──────────────────────────────┐     │
│  │  Admin Routers       │    │  User Routers                │     │
│  │  /api/admin/*        │    │  /api/user/*                 │     │
│  ├──────────────────────┤    ├──────────────────────────────┤     │
│  │ • auth.py            │    │ • auth.py (OTP)              │     │
│  │ • cities.py          │    │ • profile.py                 │     │
│  │ • areas.py           │    │ • bookings.py                │     │
│  │ • game_types.py      │    │ • venues.py                  │     │
│  │ • amenities.py       │    │ • courts.py                  │     │
│  │ • branches.py        │    │ • coupons.py                 │     │
│  │ • courts.py          │    │ • reviews.py                 │     │
│  │ • bookings.py        │    │ • notifications.py           │     │
│  │ • venues.py          │    │                              │     │
│  │ • coupons.py         │    │                              │     │
│  │ • policies.py        │    │                              │     │
│  │ • users.py           │    │                              │     │
│  │ • reviews_v2.py      │    │                              │     │
│  │ • global_price_...   │    │                              │     │
│  └──────────────────────┘    └──────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                   dependencies.py                           │   │
│  │  - get_current_admin() - Admin token validation            │   │
│  │  - get_current_user() - JWT validation                     │   │
│  │  - require_super_admin() - Role check                      │   │
│  │  - require_branch_admin() - Role check                     │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                      models.py                              │   │
│  │  - SQLAlchemy ORM Models                                    │   │
│  │  - Admin, User, Booking, Court, Review, etc.               │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                      schemas.py                             │   │
│  │  - Pydantic Models for Request/Response                    │   │
│  │  - Validation & Serialization                              │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                       crud.py                               │   │
│  │  - Database CRUD Operations                                 │   │
│  │  - Business Logic                                           │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ SQLAlchemy
                               │ Connection Pool
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database (Supabase)                    │
│                    db.vqglejkydwtopmllymuf.supabase.co              │
│                           Database: MYRUSH                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────┐  ┌────────────────────┐                    │
│  │  Admin Tables      │  │  User Tables       │                    │
│  ├────────────────────┤  ├────────────────────┤                    │
│  │ • admins           │  │ • users            │ ◄── Shared         │
│  │ • admin_cities     │  │ • profiles         │                    │
│  │ • admin_areas      │  │ • otp_verifications│                    │
│  │ • admin_game_types │  │ • tournaments      │                    │
│  │ • admin_amenities  │  │ • tournament_...   │                    │
│  │ • admin_branches   │  │ • push_tokens      │                    │
│  │ • admin_courts     │  │                    │                    │
│  │ • admin_coupons    │  │                    │                    │
│  │ • admin_policies   │  │                    │                    │
│  │ • adminvenues      │  │                    │                    │
│  └────────────────────┘  └────────────────────┘                    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │              Shared Tables (Both Apps)                    │     │
│  ├──────────────────────────────────────────────────────────┤     │
│  │ • booking - All bookings (user + admin created)          │     │
│  │ • reviews - Court reviews from users                     │     │
│  │ • users - User accounts (read by admin, write by user)   │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

### Admin Authentication
```
┌─────────────┐
│ Admin Panel │
└──────┬──────┘
       │
       │ POST /api/admin/auth/login
       │ { mobile, password }
       ▼
┌─────────────────────┐
│ Admin Auth Router   │
│ - Validate mobile   │
│ - Check password    │
│ - Generate token    │
└──────┬──────────────┘
       │
       │ Return: { token: "admin-token-{id}" }
       ▼
┌─────────────┐
│ Admin Panel │ ──► Store token
└─────────────┘
       │
       │ Subsequent requests
       │ Authorization: Bearer admin-token-{id}
       ▼
┌─────────────────────┐
│ get_current_admin() │
│ - Validate token    │
│ - Return admin obj  │
└─────────────────────┘
```

### User Authentication (OTP)
```
┌──────────────┐
│ Mobile App   │
└──────┬───────┘
       │
       │ POST /api/user/auth/send-otp
       │ { phone_number }
       ▼
┌─────────────────────┐
│ User Auth Router    │
│ - Generate OTP      │
│ - Store in DB       │
│ - Return OTP (dev)  │
└──────┬──────────────┘
       │
       │ Return: { otp_code: "12345" }
       ▼
┌──────────────┐
│ Mobile App   │ ──► User enters OTP
└──────┬───────┘
       │
       │ POST /api/user/auth/verify-otp
       │ { phone_number, otp_code }
       ▼
┌─────────────────────┐
│ User Auth Router    │
│ - Verify OTP        │
│ - Create/get user   │
│ - Generate JWT      │
└──────┬──────────────┘
       │
       │ Return: { access_token: "jwt..." }
       ▼
┌──────────────┐
│ Mobile App   │ ──► Store JWT
└──────────────┘
       │
       │ Subsequent requests
       │ Authorization: Bearer {jwt}
       ▼
┌─────────────────────┐
│ get_current_user()  │
│ - Decode JWT        │
│ - Validate user     │
│ - Return user obj   │
└─────────────────────┘
```

## Booking Flow

### User Creates Booking (Mobile App)
```
Mobile App
    │
    │ POST /api/user/bookings
    │ { court_id, date, time, duration, ... }
    │ Authorization: Bearer {jwt}
    ▼
User Bookings Router
    │
    ├─► get_current_user() ──► Validate JWT
    │
    ├─► crud.create_booking()
    │       │
    │       ├─► Validate court exists
    │       ├─► Calculate total amount
    │       ├─► Create booking record
    │       └─► Return booking
    │
    └─► Return booking response
            │
            ▼
        Database
        booking table
        (status: confirmed)
```

### Admin Views Booking
```
Admin Panel
    │
    │ GET /api/admin/bookings
    │ Authorization: Bearer admin-token-{id}
    ▼
Admin Bookings Router
    │
    ├─► get_current_admin() ──► Validate token
    │
    ├─► Query booking table
    │       │
    │       ├─► Join with users
    │       ├─► Join with courts
    │       └─► Return all bookings
    │
    └─► Return bookings list
            │
            ▼
        Admin Panel
        (displays all bookings)
```

## Data Flow Example: Court Availability

```
Mobile App
    │
    │ GET /api/user/courts/{court_id}/availability
    │ ?date=2026-01-07
    ▼
User Courts Router
    │
    ├─► Get court from admin_courts table
    │
    ├─► Get existing bookings for date
    │       │
    │       └─► Query booking table
    │           WHERE court_id = {id}
    │           AND booking_date = {date}
    │
    ├─► Get price conditions
    │       │
    │       ├─► Court-specific pricing
    │       └─► Global price conditions
    │
    ├─► Calculate available slots
    │       │
    │       ├─► Operating hours
    │       ├─► Minus booked slots
    │       └─► Minus unavailable slots
    │
    └─► Return availability + pricing
            │
            ▼
        Mobile App
        (displays available slots)
```

## Key Design Decisions

### 1. Single Booking Table
```
✅ Unified `booking` table
   - Used by both admin and user apps
   - user_id links to users table
   - court_id links to admin_courts table
   - Single source of truth

❌ Separate tables (old approach)
   - admin_bookings (admin-created)
   - booking (user-created)
   - Data duplication
```

### 2. UUID Standardization
```
✅ UUID(as_uuid=True) everywhere
   - Python UUID objects
   - Better type safety
   - Consistent across all tables

❌ Mixed UUID types (old approach)
   - UUID(as_uuid=True) in admin
   - UUID(as_uuid=False) in user
   - String vs UUID confusion
```

### 3. API Prefix Strategy
```
Admin: /api/admin/*
   - Clear separation
   - Easy to apply admin auth
   - Can set different rate limits

User: /api/user/*
   - Clear separation
   - Easy to apply user auth
   - Can set different rate limits

Benefits:
   - No endpoint conflicts
   - Clear ownership
   - Easy to maintain
   - Future-proof
```

## Technology Stack

```
┌─────────────────────────────────────┐
│         FastAPI Framework           │
│  - Async/await support              │
│  - Auto API documentation           │
│  - Pydantic validation              │
│  - Dependency injection             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│         SQLAlchemy ORM              │
│  - Database abstraction             │
│  - Relationship management          │
│  - Connection pooling               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│      PostgreSQL Database            │
│  - Supabase hosted                  │
│  - UUID support                     │
│  - JSONB support                    │
│  - Array support                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│       Authentication                │
│  - Admin: Simple token              │
│  - User: JWT (python-jose)          │
│  - OTP: Dummy "12345" (dev)         │
└─────────────────────────────────────┘
```

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Production Setup                       │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌────────────────┐                                      │
│  │  Load Balancer │                                      │
│  │  (Nginx/ALB)   │                                      │
│  └────────┬───────┘                                      │
│           │                                               │
│           ├──────────┬──────────┬──────────┐            │
│           ▼          ▼          ▼          ▼            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │FastAPI  │  │FastAPI  │  │FastAPI  │  │FastAPI  │   │
│  │Worker 1 │  │Worker 2 │  │Worker 3 │  │Worker 4 │   │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘   │
│       │            │            │            │          │
│       └────────────┴────────────┴────────────┘          │
│                          │                               │
│                          ▼                               │
│              ┌───────────────────────┐                  │
│              │  PostgreSQL (Supabase)│                  │
│              │  Connection Pool      │                  │
│              └───────────────────────┘                  │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## Security Considerations

```
✅ Implemented:
   - CORS middleware
   - JWT authentication for users
   - Token authentication for admins
   - Input validation (Pydantic)
   - SQL injection protection (SQLAlchemy)
   - Connection pooling

⏳ TODO (Production):
   - Rate limiting
   - API key authentication
   - Proper password hashing for admins
   - HTTPS enforcement
   - Request logging
   - Error monitoring
   - Database encryption
   - Secrets management
```

---

**Created**: January 6, 2026  
**Version**: 1.0.0  
**Status**: Production Ready (after frontend updates)
