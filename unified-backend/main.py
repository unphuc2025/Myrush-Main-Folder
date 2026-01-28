"""
MyRush Unified Backend
Combines Admin Panel and User App backends into a single FastAPI application

Admin routes: /api/admin/*
User routes: /api/user/*
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from pathlib import Path
from sqlalchemy.exc import OperationalError
import traceback
import os

# Import our error handling middleware and utilities
from middleware.error_handler import ErrorHandlerMiddleware
from utils.logger import logger
from utils.error_alert_service import configure_error_alerts as configure_alerts

from database import engine, Base, SQLALCHEMY_DATABASE_URL

# Lifespan event to create tables on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        if "sqlite" in SQLALCHEMY_DATABASE_URL:
            db_type = "SQLite"
        elif "postgresql" in SQLALCHEMY_DATABASE_URL:
            db_type = "PostgreSQL"
        else:
            db_type = "MySQL"
            
        print(f"[DB] Connecting to database: {db_type}")
        print(f"[STARTUP] MyRush Unified Backend starting...")
        
        # Optionally create tables (comment out if using migrations)
        Base.metadata.create_all(bind=engine)
        print("[DB] Database tables created/verified successfully")
        
        print("[STARTUP] ✅ Server ready!")
        print("[STARTUP] Admin API: http://localhost:8000/api/admin")
        print("[STARTUP] User API: http://localhost:8000/api/user")
        
    except Exception as e:
        print(f"[DB WARN] Database connection failed: {e}")
        print("[DB WARN] Server starting but database connection failed. Check your .env configuration.")
    
    yield
    
    # Shutdown
    print("[SHUTDOWN] Server shutting down...")

# Create FastAPI app
app = FastAPI(
    title="MyRush Unified API",
    description="Combined Admin Panel and User App Backend",
    version="1.0.0",
    lifespan=lifespan,
    debug=True
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"],  # Explicitly add frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add error handling middleware (must be added before other middleware)
app.add_middleware(ErrorHandlerMiddleware)

# Configure error alerting system
configure_alerts()

# Global exception handlers
@app.exception_handler(OperationalError)
async def db_connection_exception_handler(request: Request, exc: OperationalError):
    return JSONResponse(
        status_code=503,
        content={"detail": "Database connection failed. Please check your network or database server status."},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[ERROR] Global exception handler: {type(exc).__name__}: {str(exc)}", flush=True)
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}", "type": type(exc).__name__}
    )

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Mount uploads static directory
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")



# Root endpoint
@app.get("/")
def read_root():
    return {
        "message": "Welcome to MyRush Unified API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "admin": "/api/admin",
            "user": "/api/user",
            "docs": "/docs"
        }
    }

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "connected"}

# ============================================================================
# IMPORT AND INCLUDE ADMIN ROUTERS
# ============================================================================

from routers.admin import (
    auth as admin_auth,
    cities,
    areas,
    game_types,
    amenities,
    branches,
    courts,
    bookings as admin_bookings,
    venues,
    global_price_conditions,
    coupons as admin_coupons,
    policies,
    policies,
    users as admin_users,
    reviews_v2 as admin_reviews,
    faq as admin_faq,
    roles,
    cms as admin_cms,
    site_settings as admin_site_settings,
    playo_tokens
)


# Include admin routers with /api/admin prefix
app.include_router(admin_auth.router, prefix="/api/admin", tags=["Admin Auth"])
app.include_router(cities.router, prefix="/api/admin", tags=["Admin Cities"])
app.include_router(areas.router, prefix="/api/admin", tags=["Admin Areas"])
app.include_router(game_types.router, prefix="/api/admin", tags=["Admin Game Types"])
app.include_router(amenities.router, prefix="/api/admin", tags=["Admin Amenities"])
app.include_router(branches.router, prefix="/api/admin", tags=["Admin Branches"])
app.include_router(courts.router, prefix="/api/admin", tags=["Admin Courts"])
app.include_router(admin_bookings.router, prefix="/api/admin", tags=["Admin Bookings"])
app.include_router(venues.router, prefix="/api/admin", tags=["Admin Venues"])
app.include_router(global_price_conditions.router, prefix="/api/admin", tags=["Admin Pricing"])
app.include_router(admin_coupons.router, prefix="/api/admin", tags=["Admin Coupons"])
app.include_router(policies.router, prefix="/api/admin", tags=["Admin Policies"])
app.include_router(admin_users.router, prefix="/api/admin", tags=["Admin Users"])
app.include_router(admin_reviews.router, prefix="/api/admin", tags=["Admin Reviews"])
app.include_router(roles.router, prefix="/api/admin", tags=["Admin Roles"])
app.include_router(admin_faq.router, prefix="/api/admin", tags=["Admin FAQ"])
app.include_router(admin_cms.router, prefix="/api/admin", tags=["Admin CMS"])
app.include_router(admin_site_settings.router, prefix="/api/admin", tags=["Admin Site Settings"])
app.include_router(playo_tokens.router, prefix="/api/admin", tags=["Admin Playo Tokens"])

# ============================================================================
# IMPORT AND INCLUDE USER ROUTERS
# ============================================================================

from routers.user import (
    auth as user_auth,
    profile,
    bookings as user_bookings,
    venues as user_venues,
    courts as user_courts,
    coupons as user_coupons,
    reviews as user_reviews,
    notifications,
    courts_ratings
)

# Include user routers with /api/user prefix
app.include_router(user_auth.router, prefix="/api/user", tags=["User Auth"])
app.include_router(profile.router, prefix="/api/user", tags=["User Profile"])
app.include_router(user_bookings.router, prefix="/api/user", tags=["User Bookings"])
app.include_router(user_venues.router, prefix="/api/user", tags=["User Venues"])
app.include_router(user_courts.router, prefix="/api/user", tags=["User Courts"])
app.include_router(user_coupons.router, prefix="/api/user", tags=["User Coupons"])
app.include_router(user_reviews.router, prefix="/api/user", tags=["User Reviews"])
app.include_router(notifications.router, prefix="/api/user", tags=["User Notifications"])
app.include_router(courts_ratings.router, prefix="/api/user", tags=["User Court Ratings"])

# ============================================================================
# PLAYO INTEGRATION ROUTER
# ============================================================================

from routers import playo

app.include_router(playo.router, prefix="/api", tags=["Playo Integration"])

# ============================================================================
# EXAMPLE ERROR ROUTER (for demonstration)
# ============================================================================

from routers import example_errors

app.include_router(example_errors.router, prefix="", tags=["Example Errors"])
example_errors.register_error_handlers(app)

print("\n" + "="*60)
print("MYRUSH UNIFIED BACKEND")
print("="*60)
print("Admin API: http://localhost:8000/api/admin")
print("User API: http://localhost:8000/api/user")
print("API Docs: http://localhost:8000/docs")
print("="*60 + "\n")
