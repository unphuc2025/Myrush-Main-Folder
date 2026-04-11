from sqlalchemy import Column, String, Boolean, Text, ForeignKey, DECIMAL, Date, Time, Integer, TIMESTAMP, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid
from datetime import datetime

def generate_uuid():
    return uuid.uuid4()

# ============================================================================
# ADMIN MODELS
# ============================================================================

class Role(Base):
    __tablename__ = "admin_roles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, unique=True)
    permissions = Column(JSONB, default={})  # { 'users': { 'view': True, 'edit': False }, ... }
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    admins = relationship("Admin", back_populates="role_rel")

class AdminBranchAccess(Base):
    __tablename__ = "admin_branch_access"
    admin_id = Column(UUID(as_uuid=True), ForeignKey("admins.id", ondelete="CASCADE"), primary_key=True)
    branch_id = Column(UUID(as_uuid=True), ForeignKey("admin_branches.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

class Admin(Base):
    __tablename__ = "admins"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    name = Column(String(255))
    mobile = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default='super_admin') # Legacy role field
    role_id = Column(UUID(as_uuid=True), ForeignKey("admin_roles.id"), nullable=True) # New role system
    branch_id = Column(UUID(as_uuid=True), ForeignKey("admin_branches.id"), nullable=True) # Deprecated, use m2m
    email = Column(String(255), nullable=True)
    must_change_password = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    branch = relationship("Branch", foreign_keys=[branch_id])
    accessible_branches = relationship("Branch", secondary="admin_branch_access")
    role_rel = relationship("Role", back_populates="admins")

class GlobalPriceCondition(Base):
    __tablename__ = "admin_global_price_conditions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    days = Column(ARRAY(String))  # ['mon', 'tue', etc.] - for recurring conditions
    dates = Column(ARRAY(String))  # ['2024-12-25', '2024-12-26'] - for date-specific conditions
    slot_from = Column(String(10), nullable=False)  # '06:00'
    slot_to = Column(String(10), nullable=False)  # '07:00'
    price = Column(DECIMAL(10, 2), nullable=False)
    condition_type = Column(String(20), default='recurring')  # 'recurring' or 'date'
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

# ============================================================================
# SHARED ADMIN/USER MODELS
# ============================================================================

class City(Base):
    __tablename__ = "admin_cities"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    short_code = Column(String(10), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    areas = relationship("Area", back_populates="city", cascade="all, delete-orphan")
    branches = relationship("Branch", back_populates="city")

class Area(Base):
    __tablename__ = "admin_areas"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    city_id = Column(UUID(as_uuid=True), ForeignKey("admin_cities.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    city = relationship("City", back_populates="areas")
    branches = relationship("Branch", back_populates="area")

class GameType(Base):
    __tablename__ = "admin_game_types"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    short_code = Column(String(10), nullable=False)
    description = Column(Text)
    icon = Column(String(255))
    icon_url = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

class FacilityType(Base):
    __tablename__ = "admin_facility_types"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False) # 'Turf', 'Court', 'Pool', 'Table', 'Nets'
    short_code = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

class SharedGroup(Base):
    """Groups multiple courts that share the same physical inventory/space"""
    __tablename__ = "admin_shared_groups"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    branch_id = Column(UUID(as_uuid=True), ForeignKey("admin_branches.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    branch = relationship("Branch")
    courts = relationship("Court", back_populates="shared_group")

class Amenity(Base):
    __tablename__ = "admin_amenities"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    icon = Column(String(255))
    icon_url = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

class Branch(Base):
    __tablename__ = "admin_branches"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    city_id = Column(UUID(as_uuid=True), ForeignKey("admin_cities.id", ondelete="CASCADE"), nullable=False)
    area_id = Column(UUID(as_uuid=True), ForeignKey("admin_areas.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    address_line1 = Column(String(255))
    address_line2 = Column(String(255))
    landmark = Column(String(255))
    search_location = Column(Text)
    ground_overview = Column(Text)
    terms_condition = Column(Text)
    rule = Column(Text)
    google_map_url = Column(Text)
    location_url = Column(Text)
    price = Column(DECIMAL(10, 2), nullable=True) # Optional base price if needed, though Court has price
    max_players = Column(Integer)
    phone_number = Column(String(50))
    email = Column(String(255))
    ground_type = Column(String(50), default='single')
    images = Column(ARRAY(Text))
    videos = Column(ARRAY(Text))
    opening_hours = Column(JSONB)
    latitude = Column(DECIMAL(10, 8))
    longitude = Column(DECIMAL(11, 8))
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    city = relationship("City", back_populates="branches")
    area = relationship("Area", back_populates="branches")
    courts = relationship("Court", back_populates="branch", cascade="all, delete-orphan")
    
    # Many-to-many relationships
    game_types = relationship("GameType", secondary="admin_branch_game_types")
    amenities = relationship("Amenity", secondary="admin_branch_amenities")

class BranchGameType(Base):
    __tablename__ = "admin_branch_game_types"
    branch_id = Column(UUID(as_uuid=True), ForeignKey("admin_branches.id", ondelete="CASCADE"), primary_key=True)
    game_type_id = Column(UUID(as_uuid=True), ForeignKey("admin_game_types.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

class BranchAmenity(Base):
    __tablename__ = "admin_branch_amenities"
    branch_id = Column(UUID(as_uuid=True), ForeignKey("admin_branches.id", ondelete="CASCADE"), primary_key=True)
    amenity_id = Column(UUID(as_uuid=True), ForeignKey("admin_amenities.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

class Court(Base):
    __tablename__ = "admin_courts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    branch_id = Column(UUID(as_uuid=True), ForeignKey("admin_branches.id", ondelete="CASCADE"), nullable=False)
    game_type_id = Column(UUID(as_uuid=True), ForeignKey("admin_game_types.id", ondelete="CASCADE"), nullable=False)
    facility_type_id = Column(UUID(as_uuid=True), ForeignKey("admin_facility_types.id"), nullable=True)
    
    name = Column(String(255), nullable=False)
    logic_type = Column(String(50), default='independent') # 'independent', 'shared', 'divisible', 'capacity'
    shared_group_id = Column(UUID(as_uuid=True), ForeignKey("admin_shared_groups.id"), nullable=True)
    capacity_limit = Column(Integer, default=1) # Member limit (e.g., 20 for pool)
    total_zones = Column(Integer, default=1)
    
    price_per_hour = Column(DECIMAL(10, 2), nullable=False)
    price_overrides = Column(JSONB, nullable=True) # { "sport_name": price } for shared courts
    
    price_conditions = Column(JSONB)
    unavailability_slots = Column(JSONB)
    images = Column(ARRAY(Text))
    videos = Column(ARRAY(Text))
    terms_and_conditions = Column(Text)
    amenities = Column(ARRAY(String))
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    branch = relationship("Branch", back_populates="courts")
    game_type = relationship("GameType")
    facility_type = relationship("FacilityType")
    shared_group = relationship("SharedGroup", back_populates="courts")
    zones = relationship("CourtZone", back_populates="court", cascade="all, delete-orphan")
    sport_slices = relationship("SportSlice", back_populates="court", cascade="all, delete-orphan")
    rental_items = relationship("RentalItem", secondary="admin_court_rental_items")

class CourtZone(Base):
    __tablename__ = "admin_court_zones"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    court_id = Column(UUID(as_uuid=True), ForeignKey("admin_courts.id", ondelete="CASCADE"), nullable=False)
    zone_index = Column(Integer, nullable=False)
    zone_name = Column(String(50), nullable=False)
    
    court = relationship("Court", back_populates="zones")
    __table_args__ = (UniqueConstraint('court_id', 'zone_index', name='unique_court_zone'),)

class SportSlice(Base):
    __tablename__ = "admin_sport_slices"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    sport_id = Column(UUID(as_uuid=True), ForeignKey("admin_game_types.id", ondelete="CASCADE"), nullable=False)
    court_id = Column(UUID(as_uuid=True), ForeignKey("admin_courts.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    mask = Column(Integer, nullable=False)
    price_per_hour = Column(DECIMAL(10, 2), nullable=True)
    
    court = relationship("Court", back_populates="sport_slices")
    sport = relationship("GameType")
    __table_args__ = (UniqueConstraint('sport_id', 'court_id', 'name', name='unique_sport_court_slice'),)

class Slot(Base):
    __tablename__ = "slots"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    court_id = Column(UUID(as_uuid=True), ForeignKey("admin_courts.id", ondelete="CASCADE"), nullable=False)
    slot_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    occupied_mask = Column(Integer, default=0)
    version = Column(Integer, default=0)
    
    court = relationship("Court")
    __table_args__ = (UniqueConstraint('court_id', 'slot_date', 'start_time', name='unique_court_slot'),)

class CourtRentalItem(Base):
    __tablename__ = "admin_court_rental_items"
    court_id = Column(UUID(as_uuid=True), ForeignKey("admin_courts.id", ondelete="CASCADE"), primary_key=True)
    rental_item_id = Column(UUID(as_uuid=True), ForeignKey("admin_rental_items.id", ondelete="CASCADE"), primary_key=True)

class RentalItem(Base):
    __tablename__ = "admin_rental_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    branch_id = Column(UUID(as_uuid=True), ForeignKey("admin_branches.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(255), nullable=False)
    price_per_booking = Column(DECIMAL(10, 2), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

class Coupon(Base):
    __tablename__ = "admin_coupons"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    discount_type = Column(String(20), nullable=False) # 'percentage' or 'flat'
    discount_value = Column(DECIMAL(10, 2), nullable=False)
    min_order_value = Column(DECIMAL(10, 2), default=0)
    max_discount = Column(DECIMAL(10, 2)) # For percentage based
    start_date = Column(TIMESTAMP, nullable=False)
    end_date = Column(TIMESTAMP, nullable=False)
    usage_limit = Column(Integer) # Total times coupon can be used
    per_user_limit = Column(Integer, default=1)
    usage_count = Column(Integer, default=0)
    applicable_type = Column(String(20), default='all') # 'all', 'branch', 'game_type', 'court'
    applicable_ids = Column(ARRAY(String), nullable=True) # List of UUIDs
    terms_condition = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    bookings = relationship("Booking", back_populates="coupon")

class AdminVenue(Base):
    __tablename__ = "adminvenues"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    game_type = Column(String(255), nullable=False)
    court_name = Column(String(255))
    location = Column(Text, nullable=False)
    prices = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    photos = Column(ARRAY(Text))
    videos = Column(ARRAY(Text))
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

class AdminPolicy(Base):
    __tablename__ = "admin_cancellations_terms"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    type = Column(String(50), nullable=False) # 'cancellation', 'terms'
    name = Column(String(255), nullable=False)
    value = Column(String(255)) # For cancellation %
    content = Column(Text) # For terms text or description
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

class FAQ(Base):
    __tablename__ = "admin_faqs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

class CMSPage(Base):
    __tablename__ = "admin_cms_pages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    content = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

class SiteSetting(Base):
    __tablename__ = "admin_site_settings"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    site_logo = Column(String(500), nullable=True)
    company_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=False)
    contact_number = Column(String(50), nullable=False)
    address = Column(Text, nullable=False)
    copyright_text = Column(String(255), nullable=False)
    instagram_url = Column(String(500), nullable=True)
    youtube_url = Column(String(500), nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)




# ============================================================================
# USER MODELS
# ============================================================================

class User(Base):
    """Unified User model - combines fields from both backends"""
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid, server_default=func.uuid_generate_v4())
    phone_number = Column(String(255), nullable=False, unique=True, index=True)
    country_code = Column(String(10), default='+91')
    email = Column(String(255), unique=True, index=True)
    password_hash = Column(String(255))
    full_name = Column(String(255))
    first_name = Column(String(255))
    last_name = Column(String(255))
    avatar_url = Column(Text)
    gender = Column(String(50))
    age = Column(Integer)
    city = Column(String(255))
    skill_level = Column(String(50))
    playing_style = Column(String(50))
    handedness = Column(String(50), default='Right-handed')
    favorite_sports = Column(ARRAY(String))
    profile_completed = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    last_login_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow, server_default=func.now())

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    tournaments = relationship("Tournament", back_populates="user", cascade="all, delete-orphan")
    tournament_participations = relationship("TournamentParticipant", back_populates="user", cascade="all, delete-orphan")

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    phone_number = Column(String(20), unique=True, index=True)
    full_name = Column(String(100))
    age = Column(Integer)
    city = Column(String(100))
    gender = Column(String(20))
    handedness = Column(String(20))
    skill_level = Column(String(50))
    sports = Column(JSON) # Store as JSON array
    playing_style = Column(String(100))
    # New stats fields
    games_played = Column(Integer, default=0)
    mvp_count = Column(Integer, default=0)
    reliability_score = Column(Integer, default=100) # Percentage 0-100
    rating = Column(DECIMAL(3, 1), default=5.0)
    
    created_at = Column(TIMESTAMP, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow, server_default=func.now())

    user = relationship("User", back_populates="profile")

class OtpVerification(Base):
    __tablename__ = "otp_verifications"
    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(20), index=True)
    otp_code = Column(String(6))
    country_code = Column(String(10), default='+91')
    is_verified = Column(Boolean, default=False)
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, default=3)
    expires_at = Column(TIMESTAMP, nullable=False)
    verified_at = Column(TIMESTAMP)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    created_at = Column(TIMESTAMP, default=datetime.utcnow, server_default=func.now())

class Booking(Base):
    """Unified Booking table - used by both admin and user apps"""
    __tablename__ = "booking"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid, server_default=func.uuid_generate_v4())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    court_id = Column(UUID(as_uuid=True), nullable=False)
    booking_date = Column(Date, nullable=False)
    # Updated Columns for Multi-Slot Support
    time_slots = Column(JSON, nullable=True) # Stores array of {start, end, price}
    total_duration_minutes = Column(Integer, nullable=True)
    
    # Amount Breakdown
    original_amount = Column(DECIMAL(10, 2), nullable=False)
    discount_amount = Column(DECIMAL(10, 2), default=0)
    subtotal_amount = Column(DECIMAL(10, 2), default=0)
    gst_amount = Column(DECIMAL(10, 2), default=0)
    coupon_code = Column(String(50))
    
    # Human-readable Booking ID (e.g., BK-12345)
    booking_display_id = Column(String(20), unique=True, nullable=True) # Nullable initially for migration
    
    # Existing columns kept for backward compatibility (mapped to deprecated DB columns if they were renamed, 
    # but here we just map them if they still exist or were renamed. 
    # Since we renamed them in DB to _deprecated_*, we should map them here or remove them from active use.
    # We will map them to the new names to avoid "column not found" errors if code queries them.)
    
    # Deprecated/Renamed Columns (Mapped to new DB names)
    # Using quoted names to map to the actual DB column name
    start_time = Column("_deprecated_start_time_v2", Time, nullable=True)
    end_time = Column("_deprecated_end_time_v2", Time, nullable=True)
    duration_minutes = Column("_deprecated_duration_minutes_v2", Integer, nullable=True)
    price_per_hour = Column("_deprecated_price_per_hour_v2", DECIMAL(10, 2), nullable=True)
    original_price_per_hour = Column("_deprecated_original_price_per_hour_v2", DECIMAL(10, 2), nullable=True)
    coupon_discount = Column("_deprecated_coupon_discount", DECIMAL(10, 2), default=0)
    
    # Even older deprecated columns (without _v2 suffix) - these have NOT NULL constraints
    _old_start_time = Column("_deprecated_start_time", Time, nullable=False)
    _old_end_time = Column("_deprecated_end_time", Time, nullable=False)
    _old_duration_minutes = Column("_deprecated_duration_minutes", Integer, nullable=False)
    _old_price_per_hour = Column("_deprecated_price_per_hour", DECIMAL(10, 2), nullable=False)

    total_amount = Column(DECIMAL(10, 2), nullable=False)
    number_of_players = Column(Integer, default=2)
    team_name = Column(String(255))
    special_requests = Column(Text)
    admin_notes = Column(Text)
    status = Column(String(50), default='confirmed')
    payment_status = Column(String(50), default='pending')
    payment_id = Column(String(255))
    razorpay_order_id = Column(String(255))
    razorpay_signature = Column(String(500))
    coupon_id = Column(UUID(as_uuid=True), ForeignKey("admin_coupons.id"), nullable=True)
    
    # Playo Integration Fields
    playo_order_id = Column(String(255), nullable=True, index=True)
    playo_booking_id = Column(String(255), nullable=True, index=True)
    booking_source = Column(String(50), default='direct')  # 'direct', 'playo', 'admin'
    
    # Advanced Booking Fields
    slot_id = Column(UUID(as_uuid=True), ForeignKey("slots.id"), nullable=True)
    slice_mask = Column(Integer, nullable=True)
    
    created_at = Column(TIMESTAMP, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow, server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="bookings")
    # court = relationship("Court", foreign_keys=[court_id], back_populates="bookings")
    coupon = relationship("Coupon", back_populates="bookings")

class Review(Base):
    __tablename__ = "reviews"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid, server_default=func.uuid_generate_v4())
    court_id = Column(UUID(as_uuid=True), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("booking.id", ondelete="SET NULL"), nullable=True)
    rating = Column(Integer, nullable=False)
    review_text = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow, server_default=func.now())
    
    # court = relationship("Court", foreign_keys=[court_id], back_populates="reviews")
    user = relationship("User", back_populates="reviews")

    # Unique constraint to prevent multiple reviews per booking
    __table_args__ = (
        UniqueConstraint('booking_id', name='unique_booking_review'),
    )

class Tournament(Base):
    __tablename__ = "tournaments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid, server_default=func.uuid_generate_v4())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False, index=True)
    sport = Column(String(100), nullable=False, index=True)
    visibility = Column(String(20), nullable=False, default='Public')
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    branch_name = Column(String(255), nullable=False, index=True)
    court_id = Column(String(36), nullable=False, index=True)
    format = Column(String(50), nullable=False)
    rules = Column(Text, nullable=True)
    entry_fee = Column(DECIMAL(10, 2), nullable=False, default=0.00)
    status = Column(String(20), nullable=False, default='draft')
    max_participants = Column(Integer, nullable=True)
    current_participants = Column(Integer, nullable=False, default=0)
    description = Column(Text, nullable=True)
    prize_info = Column(Text, nullable=True)
    contact_info = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow, server_default=func.now())
    published_at = Column(TIMESTAMP, nullable=True)

    user = relationship("User", back_populates="tournaments")
    participants = relationship("TournamentParticipant", back_populates="tournament")

class TournamentParticipant(Base):
    __tablename__ = "tournament_participants"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid, server_default=func.uuid_generate_v4())
    tournament_id = Column(UUID(as_uuid=True), ForeignKey("tournaments.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    registration_date = Column(TIMESTAMP, default=datetime.utcnow, server_default=func.now())
    status = Column(String(20), nullable=False, default='registered')
    team_name = Column(String(100), nullable=True)
    seed_number = Column(Integer, nullable=True)
    payment_status = Column(String(20), nullable=False, default='pending')
    payment_amount = Column(DECIMAL(10, 2), nullable=True)
    payment_id = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow, server_default=func.now())

    tournament = relationship("Tournament", back_populates="participants")
    user = relationship("User", back_populates="tournament_participations")

class PushToken(Base):
    __tablename__ = "push_tokens"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid, server_default=func.uuid_generate_v4())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    device_token = Column(Text, nullable=False, unique=True)
    device_type = Column(String(50), nullable=False, default='android')
    device_info = Column(JSON, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    last_used_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow, server_default=func.now())

    user = relationship("User")

# ============================================================================
# PLAYO INTEGRATION MODELS
# ============================================================================

class PlayoAPIKey(Base):
    """Playo API authentication tokens"""
    __tablename__ = "playo_api_keys"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    token_hash = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow, server_default=func.now())
    last_used_at = Column(TIMESTAMP)

class PlayoOrder(Base):
    """Temporary order reservations for Playo integration"""
    __tablename__ = "playo_orders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid, server_default=func.uuid_generate_v4())
    playo_order_id = Column(String(255), unique=True, nullable=False, index=True)
    venue_id = Column(UUID(as_uuid=True), ForeignKey("admin_branches.id"))
    court_id = Column(UUID(as_uuid=True), ForeignKey("admin_courts.id"))
    booking_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    price = Column(DECIMAL(10, 2), nullable=False)
    status = Column(String(50), default='pending', index=True)  # 'pending', 'confirmed', 'cancelled', 'expired'
    booking_id = Column(UUID(as_uuid=True), ForeignKey("booking.id"), nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow, server_default=func.now())
    expires_at = Column(TIMESTAMP, index=True)  # Auto-expire after 15 minutes
    
    # Store user details for booking creation later
    user_name = Column(String(255))
    user_mobile = Column(String(50))
    user_email = Column(String(255))
    
    # Relationships
    venue = relationship("Branch", foreign_keys=[venue_id])
    court = relationship("Court", foreign_keys=[court_id])
    booking = relationship("Booking", foreign_keys=[booking_id])

class UserFavoriteCourt(Base):
    __tablename__ = "user_favorite_courts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    court_id = Column(UUID(as_uuid=True), ForeignKey("admin_courts.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow, server_default=func.now())

    user = relationship("User")
    court = relationship("Court")

    # Composite unique constraint to prevent duplicate favorites
    __table_args__ = (
        UniqueConstraint('user_id', 'court_id', name='unique_user_court_favorite'),
    )

class PaymentMethod(Base):
    __tablename__ = "user_payment_methods"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False) # 'card', 'upi', etc.
    provider = Column(String(100)) # 'visa', 'mastercard', 'google_pay', etc.
    details = Column(JSONB, nullable=False) # { 'masked_number': '**** 1234', 'expiry': '12/25' } or { 'vpa': 'user@upi' }
    is_default = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow, server_default=func.now())

    user = relationship("User")

# ============================================================================
# PARTNER INTEGRATION MODELS (DISTRICT, PLAYO V2, ETC.)
# ============================================================================

class Partner(Base):
    """API Partners like District, Playo, etc."""
    __tablename__ = "integration_partners"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid, server_default=func.uuid_generate_v4())
    name = Column(String(255), unique=True, nullable=False)  # e.g., 'District'
    unique_id = Column(String(255), unique=True, nullable=False, index=True)  # Partner ID mapped to headers
    api_key_hash = Column(String(255), nullable=False)  # Hashed API Key for auth
    webhook_url = Column(Text, nullable=True)  # Where to send events (e.g. Type A/B)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow, server_default=func.now())

class IdempotencyKey(Base):
    """Stores unique transaction IDs from partners to prevent duplicate processing"""
    __tablename__ = "integration_idempotency_keys"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid, server_default=func.uuid_generate_v4())
    partner_id = Column(UUID(as_uuid=True), ForeignKey("integration_partners.id", ondelete="CASCADE"), nullable=False)
    idempotency_key = Column(String(255), nullable=False, index=True)  # e.g., District's batchBookingId
    endpoint = Column(String(255), nullable=False)
    response_status = Column(Integer, nullable=False)
    response_body = Column(JSONB, nullable=False)  # Cached successful response
    created_at = Column(TIMESTAMP, default=datetime.utcnow, server_default=func.now())
    
    partner = relationship("Partner")
    __table_args__ = (
        UniqueConstraint('partner_id', 'idempotency_key', name='unique_partner_idempotency_key'),
    )

class IntegrationLog(Base):
    """Audit trail of all incoming and outgoing integration HTTP requests"""
    __tablename__ = "integration_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid, server_default=func.uuid_generate_v4())
    partner_id = Column(UUID(as_uuid=True), ForeignKey("integration_partners.id", ondelete="CASCADE"), nullable=True)
    direction = Column(String(10), nullable=False)  # 'INBOUND' or 'OUTBOUND'
    endpoint = Column(String(500), nullable=False)
    method = Column(String(10), nullable=False)
    request_payload = Column(JSONB, nullable=True)
    response_status = Column(Integer, nullable=True)
    response_payload = Column(JSONB, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow, server_default=func.now())

class OutboxEvent(Base):
    """Durable queue for sending async Webhooks to partners"""
    __tablename__ = "integration_outbox_events"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid, server_default=func.uuid_generate_v4())
    partner_id = Column(UUID(as_uuid=True), ForeignKey("integration_partners.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(100), nullable=False)  # e.g., 'INVENTORY_UPDATE'
    payload = Column(JSONB, nullable=False)  # The exact JSON string to send to the webhook
    status = Column(String(20), default='pending', index=True)  # 'pending', 'processing', 'completed', 'failed'
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, default=5)
    last_attempt_at = Column(TIMESTAMP, nullable=True)
    next_attempt_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)  # Used for Exponential Backoff
    created_at = Column(TIMESTAMP, default=datetime.utcnow, server_default=func.now())

    partner = relationship("Partner")

class CourtBlock(Base):
    """Manual blocks created by admins that apply to all platforms"""
    __tablename__ = "admin_court_blocks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid, server_default=func.uuid_generate_v4())
    court_id = Column(UUID(as_uuid=True), ForeignKey("admin_courts.id", ondelete="CASCADE"), nullable=False)
    block_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    reason = Column(String(255), nullable=True) # e.g., "Maintenance", "Tournament"
    blocked_by_id = Column(UUID(as_uuid=True), ForeignKey("admins.id", ondelete="SET NULL"), nullable=True)
    slice_mask = Column(Integer, nullable=True, default=0) # 0 means block entire court, >0 blocks specific bits
    synced_partners = Column(ARRAY(String), default=[]) # e.g. ["District", "Playo"]
    created_at = Column(TIMESTAMP, default=datetime.utcnow, server_default=func.now())
    
    court = relationship("Court")
    blocked_by = relationship("Admin")
