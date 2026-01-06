# MyRush Unified Backend

## Overview
This is the unified backend for MyRush, combining the Admin Panel and User App backends into a single FastAPI application.

### Architecture
- **Admin Routes**: `/api/admin/*` - For admin panel operations
- **User Routes**: `/api/user/*` - For mobile app operations
- **Database**: Single PostgreSQL database (Supabase)
- **Authentication**: 
  - Admin: Simple token-based auth
  - User: JWT-based auth with OTP login

## Project Structure
```
unified-backend/
├── main.py                    # Main FastAPI application
├── database.py                # Database configuration
├── models.py                  # SQLAlchemy models (all tables)
├── schemas.py                 # Pydantic schemas (all endpoints)
├── crud.py                    # CRUD operations
├── dependencies.py            # Authentication dependencies
├── utils/                     # Utility functions
│   └── email_sender.py        # Email utilities
├── routers/
│   ├── admin/                 # Admin routes
│   │   ├── auth.py            # Admin authentication
│   │   ├── cities.py
│   │   ├── areas.py
│   │   ├── game_types.py
│   │   ├── amenities.py
│   │   ├── branches.py
│   │   ├── courts.py
│   │   ├── bookings.py
│   │   ├── venues.py
│   │   ├── global_price_conditions.py
│   │   ├── coupons.py
│   │   ├── policies.py
│   │   ├── users.py
│   │   └── reviews_v2.py
│   └── user/                  # User routes
│       ├── auth.py            # OTP login
│       ├── profile.py
│       ├── bookings.py
│       ├── venues.py
│       ├── courts.py
│       ├── coupons.py
│       ├── reviews.py
│       └── notifications.py
├── uploads/                   # File uploads directory
├── .env                       # Environment variables
├── requirements.txt           # Python dependencies
└── README.md                  # This file
```

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.vqglejkydwtopmllymuf.supabase.co:5432/MYRUSH?sslmode=require

# JWT Configuration (for user auth)
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# API Configuration
API_BASE_URL=http://127.0.0.1:8000
```

### 3. Run the Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The server will start on:
- **Admin API**: http://localhost:8000/api/admin
- **User API**: http://localhost:8000/api/user
- **API Docs**: http://localhost:8000/docs

## API Endpoints

### Admin Endpoints (`/api/admin`)
- **Authentication**
  - `POST /api/admin/auth/login` - Admin login
  - `POST /api/admin/auth/admins` - Create admin
  - `GET /api/admin/auth/admins` - List admins

- **Master Data**
  - `GET/POST/PUT/DELETE /api/admin/cities` - City management
  - `GET/POST/PUT/DELETE /api/admin/areas` - Area management
  - `GET/POST/PUT/DELETE /api/admin/game_types` - Game type management
  - `GET/POST/PUT/DELETE /api/admin/amenities` - Amenity management

- **Venue Management**
  - `GET/POST/PUT/DELETE /api/admin/branches` - Branch management
  - `GET/POST/PUT/DELETE /api/admin/courts` - Court management
  - `GET/POST/PUT/DELETE /api/admin/venues` - Venue management

- **Booking Management**
  - `GET /api/admin/bookings` - View all bookings
  - `GET /api/admin/bookings/{id}` - View booking details
  - `PUT /api/admin/bookings/{id}/status` - Update booking status
  - `PUT /api/admin/bookings/{id}/payment` - Update payment status

- **Pricing & Coupons**
  - `GET/POST/PUT/DELETE /api/admin/global_price_conditions` - Global pricing
  - `GET/POST/PUT/DELETE /api/admin/coupons` - Coupon management

- **Policies**
  - `GET/POST/PUT/DELETE /api/admin/policies` - Terms & cancellation policies

- **User Management**
  - `GET /api/admin/users` - View all users

- **Reviews**
  - `GET /api/admin/reviews` - View all reviews

### User Endpoints (`/api/user`)
- **Authentication**
  - `POST /api/user/auth/send-otp` - Send OTP to phone
  - `POST /api/user/auth/verify-otp` - Verify OTP and login
  - `GET /api/user/auth/profile` - Get current user profile

- **Profile**
  - `GET /api/user/profile` - Get user profile
  - `PUT /api/user/profile` - Update user profile

- **Bookings**
  - `POST /api/user/bookings` - Create booking
  - `GET /api/user/bookings` - Get user bookings

- **Venues & Courts**
  - `GET /api/user/venues` - Browse venues
  - `GET /api/user/courts` - Browse courts
  - `GET /api/user/courts/{id}` - Get court details
  - `GET /api/user/courts/{id}/availability` - Check availability

- **Coupons**
  - `POST /api/user/coupons/validate` - Validate coupon code

- **Reviews**
  - `POST /api/user/reviews` - Submit review
  - `GET /api/user/reviews` - Get user reviews
  - `GET /api/user/reviews/unreviewed` - Get unreviewed bookings

- **Notifications**
  - `POST /api/user/notifications/register-token` - Register push token
  - `POST /api/user/notifications/send` - Send notification

## Database Schema

### Shared Tables
- `users` - User accounts (used by both admin and user app)
- `booking` - All bookings (user-created and admin-created)
- `reviews` - Court reviews

### Admin Tables
- `admins` - Admin accounts
- `admin_cities` - Cities
- `admin_areas` - Areas within cities
- `admin_game_types` - Sports/game types
- `admin_amenities` - Amenities
- `admin_branches` - Venue branches
- `admin_courts` - Courts within branches
- `admin_coupons` - Discount coupons
- `admin_global_price_conditions` - Dynamic pricing rules
- `admin_cancellations_terms` - Policies
- `adminvenues` - Legacy venues table

### User Tables
- `profiles` - Extended user profiles
- `otp_verifications` - OTP records
- `tournaments` - Tournament listings
- `tournament_participants` - Tournament registrations
- `push_tokens` - FCM push notification tokens

## Authentication

### Admin Authentication
- Simple token-based authentication
- Login with mobile + password
- Returns token in format: `admin-token-{admin_id}`
- Use token in Authorization header: `Bearer admin-token-{admin_id}`

### User Authentication
- JWT-based authentication
- OTP login flow:
  1. Send OTP to phone number
  2. Verify OTP (dummy OTP: "12345" works in dev)
  3. Receive JWT access token
- Use token in Authorization header: `Bearer {jwt_token}`

## Development

### Running Tests
```bash
pytest
```

### Database Migrations
```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head
```

### Code Formatting
```bash
black .
isort .
```

## Deployment

### Production Checklist
- [ ] Update `SECRET_KEY` in .env
- [ ] Set proper `CORS` origins in main.py
- [ ] Enable HTTPS
- [ ] Set up proper logging
- [ ] Configure database connection pooling
- [ ] Set up monitoring and alerts
- [ ] Implement rate limiting
- [ ] Add API key authentication for admin
- [ ] Use proper password hashing for admins
- [ ] Set up backup strategy

### Deploy to Production
```bash
# Using Gunicorn
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Using Docker
docker build -t myrush-backend .
docker run -p 8000:8000 myrush-backend
```

## Frontend Integration

### Admin Frontend
Update API base URL from `/api` to `/api/admin`:
```javascript
const API_BASE_URL = 'http://localhost:8000/api/admin';
```

### User Mobile App
Update API base URL to `/api/user`:
```javascript
const API_BASE_URL = 'http://localhost:8000/api/user';
```

## Troubleshooting

### Database Connection Issues
- Check DATABASE_URL in .env
- Verify PostgreSQL is running
- Check firewall settings
- Test connection with psql

### Import Errors
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Check Python version (3.10+)

### CORS Errors
- Update CORS origins in main.py
- Ensure frontend is using correct API URLs

## Support
For issues or questions, contact the development team.

## License
Proprietary - MyRush 2026
