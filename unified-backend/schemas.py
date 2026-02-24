from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Optional, Any, Dict
from datetime import date, time, datetime
from decimal import Decimal
from uuid import UUID
import os

# Get the API base URL from environment or use default
API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")

# S3 Configuration
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
AWS_REGION = os.getenv("AWS_REGION", "us-west-2")
S3_BASE_URL = os.getenv("S3_BASE_URL")

# Construct S3 base URL if not explicitly provided
if not S3_BASE_URL and S3_BUCKET_NAME:
    S3_BASE_URL = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com"

def resolve_path(path: str) -> str:
    """Resolves a relative path to an absolute URL (S3 or Local Proxy)"""
    if not path or not isinstance(path, str):
        return path
    
    # Already absolute
    if path.startswith('http://') or path.startswith('https://'):
        return path
        
    # If S3 is configured, return direct S3 URL
    if S3_BASE_URL:
        key = path.lstrip('/')
        return f"{S3_BASE_URL}/{key}"
    
    # Fallback to API proxy if S3 is not configured
    base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
    
    # Clean up path - remove /api/media/ prefix if it exists to avoid double prefixing
    key = path
    if path.startswith('/api/media/'):
        key = path.replace('/api/media/', '')
    elif path.startswith('api/media/'):
        key = path.replace('api/media/', '')
    
    key = key.lstrip('/')
    
    return f"{base_url}/api/media/{key}"

# ============================================================================
# ADMIN SCHEMAS
# ============================================================================

class CityBase(BaseModel):
    name: str
    short_code: str
    is_active: Optional[bool] = True

class CityCreate(CityBase):
    pass

class City(CityBase):
    id: str

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True

class AreaBase(BaseModel):
    city_id: str
    name: str
    is_active: Optional[bool] = True

class AreaCreate(AreaBase):
    pass

class Area(AreaBase):
    id: str
    city: Optional[City] = None

    @field_validator('id', 'city_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True

class GameTypeBase(BaseModel):
    name: str
    short_code: str
    description: Optional[str] = None
    icon_url: Optional[str] = None
    is_active: Optional[bool] = True

class GameTypeCreate(GameTypeBase):
    pass

class GameType(GameTypeBase):
    id: str

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v

    @field_validator('icon_url', mode='before')
    @classmethod
    def make_icon_url_absolute(cls, v):
        return resolve_path(v)

    class Config:
        from_attributes = True

class AmenityBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon_url: Optional[str] = None
    is_active: Optional[bool] = True

class AmenityCreate(AmenityBase):
    pass

class Amenity(AmenityBase):
    id: str

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v

    @field_validator('icon_url', mode='before')
    @classmethod
    def make_icon_url_absolute(cls, v):
        return resolve_path(v)

    class Config:
        from_attributes = True

class BranchBase(BaseModel):
    city_id: str
    area_id: str
    name: str
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    landmark: Optional[str] = None
    search_location: Optional[str] = None
    ground_overview: Optional[str] = None
    terms_condition: Optional[str] = None
    rule: Optional[str] = None
    google_map_url: Optional[str] = None
    location_url: Optional[str] = None
    price: Optional[Decimal] = None
    max_players: Optional[int] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    ground_type: Optional[str] = None
    images: Optional[List[str]] = []
    videos: Optional[List[str]] = []
    opening_hours: Optional[Any] = None
    is_active: Optional[bool] = True

class BranchCreate(BranchBase):
    pass

class Branch(BranchBase):
    id: str
    city: Optional[City] = None
    area: Optional[Area] = None
    game_types: Optional[List[GameType]] = []
    amenities: Optional[List[Amenity]] = []

    @field_validator('id', 'city_id', 'area_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v

    @field_validator('images', mode='before')
    @classmethod
    def make_images_absolute(cls, v):
        if v and isinstance(v, list):
            return [resolve_path(img) for img in v if img]
        return v

    class Config:
        from_attributes = True

class CourtBase(BaseModel):
    branch_id: str
    game_type_id: str
    name: str
    price_per_hour: Decimal
    price_conditions: Optional[Any] = None
    unavailability_slots: Optional[Any] = None
    images: Optional[List[str]] = []
    videos: Optional[List[str]] = []
    terms_and_conditions: Optional[str] = None
    amenities: Optional[List[str]] = []
    is_active: Optional[bool] = True

class CourtCreate(CourtBase):
    pass

class Court(CourtBase):
    id: str
    branch: Optional[Branch] = None
    game_type: Optional[GameType] = None

    @field_validator('id', 'branch_id', 'game_type_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v

    @field_validator('images', mode='before')
    @classmethod
    def make_images_absolute(cls, v):
        if v and isinstance(v, list):
            return [resolve_path(img) for img in v if img]
        return v

    @field_validator('videos', mode='before')
    @classmethod
    def make_videos_absolute(cls, v):
        if v and isinstance(v, list):
            return [resolve_path(vid) for vid in v if vid]
        return v

    class Config:
        from_attributes = True

class CouponBase(BaseModel):
    code: str
    description: Optional[str] = None
    discount_type: str # 'percentage' or 'flat'
    discount_value: Decimal
    min_order_value: Optional[Decimal] = 0
    max_discount: Optional[Decimal] = None
    start_date: datetime
    end_date: datetime
    usage_limit: Optional[int] = None
    per_user_limit: Optional[int] = 1
    applicable_type: Optional[str] = 'all'
    applicable_ids: Optional[List[str]] = []
    terms_condition: Optional[str] = None
    is_active: Optional[bool] = True

class CouponCreate(CouponBase):
    pass

class Coupon(CouponBase):
    id: str
    usage_count: Optional[int] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True

class CouponValidateRequest(BaseModel):
    coupon_code: str
    total_amount: float

class CouponResponse(BaseModel):
    valid: bool
    message: str
    discount_percentage: Optional[float] = None
    discount_amount: Optional[float] = None
    final_amount: Optional[float] = None

class AdminPolicyBase(BaseModel):
    type: str # 'cancellation', 'terms'
    name: str
    value: Optional[str] = None
    content: Optional[str] = None
    is_active: Optional[bool] = True

class AdminPolicyCreate(AdminPolicyBase):
    pass

class AdminPolicyUpdate(BaseModel):
    name: Optional[str] = None
    value: Optional[str] = None
    content: Optional[str] = None
    is_active: Optional[bool] = None

class AdminPolicy(AdminPolicyBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True

class RoleBase(BaseModel):
    name: str
    permissions: Optional[dict] = {}
    is_active: Optional[bool] = True

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    permissions: Optional[dict] = None
    is_active: Optional[bool] = None

class RoleResponse(RoleBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AdminBase(BaseModel):
    name: Optional[str] = None
    mobile: str
    email: Optional[str] = None
    role: Optional[str] = 'super_admin'
    role_id: Optional[str] = None
    branch_id: Optional[str] = None # Deprecated
    branch_ids: Optional[List[str]] = [] # New multi-branch support

class AdminCreate(AdminBase):
    password: str

class AdminUpdate(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    role_id: Optional[str] = None
    branch_id: Optional[str] = None
    branch_ids: Optional[List[str]] = None
    password: Optional[str] = None

class Admin(AdminBase):
    id: str
    role_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    must_change_password: Optional[bool] = False
    role_rel: Optional[RoleResponse] = None
    accessible_branches: Optional[List[Branch]] = [] # New M2M relationship
    
    # helper property for frontend convenience
    @property
    def accessible_branch_ids(self) -> List[str]:
        if self.accessible_branches:
            return [str(b.id) for b in self.accessible_branches]
        return []

    @field_validator('id', 'branch_id', 'role_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True

class AdminLoginRequest(BaseModel):
    mobile: str
    password: str

class GlobalPriceConditionBase(BaseModel):
    days: Optional[List[str]] = []
    dates: Optional[List[str]] = []
    slot_from: str
    slot_to: str
    price: Decimal
    condition_type: Optional[str] = 'recurring'
    is_active: Optional[bool] = True

class GlobalPriceConditionCreate(GlobalPriceConditionBase):
    pass

class GlobalPriceCondition(GlobalPriceConditionBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True

class AdminVenueBase(BaseModel):
    game_type: str
    court_name: Optional[str] = None
    location: str
    prices: str
    description: str
    photos: Optional[List[str]] = []
    videos: Optional[List[str]] = []

class AdminVenueCreate(AdminVenueBase):
    pass

class AdminVenue(AdminVenueBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator('photos', 'videos', mode='before')
    @classmethod
    def make_absolute(cls, v):
        if v and isinstance(v, list):
            return [resolve_path(url) for url in v if url]
        return v

    class Config:
        from_attributes = True

# ============================================================================
# USER SCHEMAS
# ============================================================================

class UserBase(BaseModel):
    phone_number: str
    country_code: Optional[str] = '+91'
    full_name: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    city: Optional[str] = None
    skill_level: Optional[str] = None
    playing_style: Optional[str] = None
    handedness: Optional[str] = 'Right-handed'
    favorite_sports: Optional[List[str]] = []
    profile_completed: Optional[bool] = False
    is_verified: Optional[bool] = False
    is_active: Optional[bool] = True
    last_login_at: Optional[datetime] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

class UserResponse(BaseModel):
    id: UUID
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class User(UserBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    profile: Optional["ProfileResponse"] = None # Nested profile data

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v

    @field_validator('avatar_url', mode='before')
    @classmethod
    def make_avatar_url_absolute(cls, v):
        return resolve_path(v)

    class Config:
        from_attributes = True

class UserListResponse(BaseModel):
    items: List[User]
    total: int
    page: int
    pages: int

class CMSPageBase(BaseModel):
    title: str
    slug: str
    content: str
    is_active: Optional[bool] = True

class CMSPageCreate(CMSPageBase):
    pass

class CMSPageUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    is_active: Optional[bool] = None

class CMSPageResponse(CMSPageBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CMSPageListResponse(BaseModel):
    items: List[CMSPageResponse]
    total: int
    page: int
    pages: int

class SiteSettingBase(BaseModel):
    email: str
    contact_number: str
    address: str
    copyright_text: str

class SiteSettingCreate(SiteSettingBase):
    pass

class SiteSettingResponse(SiteSettingBase):
    id: UUID
    site_logo: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProfileBase(BaseModel):
    phone_number: str
    full_name: Optional[str] = None
    age: Optional[int] = None
    city: Optional[str] = None
    gender: Optional[str] = None
    handedness: Optional[str] = None
    skill_level: Optional[str] = None
    sports: Optional[List[str]] = None
    playing_style: Optional[str] = None

# FAQ Schemas
class FAQBase(BaseModel):
    question: str
    answer: str
    is_active: Optional[bool] = True

class FAQCreate(FAQBase):
    pass

class FAQUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    is_active: Optional[bool] = None

class FAQResponse(FAQBase):
    id: str
    created_at: datetime
    updated_at: datetime

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True

class FAQListResponse(BaseModel):
    items: List[FAQResponse]
    total: int
    page: int
    pages: int
    class Config:
        from_attributes = True

class ProfileCreate(ProfileBase):
    pass

class ProfileResponse(ProfileBase):
    id: UUID
    # Stats fields (Response only)
    games_played: int = 0
    mvp_count: int = 0
    reliability_score: int = 100
    rating: float = 5.0
    
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Payment Method Schemas
class PaymentMethodBase(BaseModel):
    type: str # 'card', 'upi'
    provider: Optional[str] = None
    details: Dict[str, Any]
    is_default: Optional[bool] = False

class PaymentMethodCreate(PaymentMethodBase):
    pass

class PaymentMethodResponse(PaymentMethodBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TopPlayerResponse(BaseModel):
    id: str
    name: str
    rating: float
    avatar_url: Optional[str] = None

    @field_validator('avatar_url', mode='before')
    @classmethod
    def make_avatar_url_absolute(cls, v):
        return resolve_path(v)
    
    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v
    
    class Config:
        from_attributes = True

# ============================================================================
# BOOKING SCHEMAS (Unified for both admin and user)
# ============================================================================

class BookingCreate(BaseModel):
    """User booking creation from mobile app"""
    user_id: Optional[str] = None  # Optional for admin-created bookings
    court_id: str
    booking_date: date
    start_time: str  # AM/PM format supported (Legacy/Single slot)
    end_time: Optional[str] = None # Added for legacy support
    duration_minutes: int
    number_of_players: int = 2
    price_per_hour: float = 200.0
    original_price_per_hour: Optional[float] = None
    team_name: Optional[str] = None
    special_requests: Optional[str] = None
    total_amount: Optional[float] = None # Allow frontend to specify total
    # New Multi-slot fields
    time_slots: Optional[List[dict]] = None
    original_amount: Optional[float] = None
    discount_amount: Optional[float] = 0
    coupon_code: Optional[str] = None
    status: Optional[str] = None
    payment_status: Optional[str] = None
    
    # Razorpay Fields
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None

class BookingResponse(BaseModel):
    """Response model for bookings"""
    id: UUID
    user_id: UUID
    court_id: UUID
    booking_display_id: Optional[str] = None
    booking_date: date
    # Optional legacy fields
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    duration_minutes: Optional[int] = None
    
    # New fields
    time_slots: List[dict]
    total_duration_minutes: int
    original_amount: Decimal
    discount_amount: Decimal
    coupon_code: Optional[str] = None
    
    number_of_players: int
    team_name: Optional[str] = None
    special_requests: Optional[str] = None
    # Deprecated/Legacy fields kept optional
    price_per_hour: Optional[Decimal] = None
    original_price_per_hour: Optional[Decimal] = None
    
    total_amount: Decimal
    status: str
    payment_status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Enriched venue fields (populated via JOIN in get_bookings)
    venue_name: Optional[str] = None
    venue_location: Optional[str] = None

    class Config:
        from_attributes = True

class AdminBookingCreate(BaseModel):
    """Admin booking creation"""
    customer_name: str
    customer_email: str
    customer_phone: str
    court_id: str
    game_type_id: str
    booking_reference: str
    booking_date: date
    time_slots: List[dict] # Admin should use new format
    total_duration_minutes: int
    total_amount: Decimal
    special_requests: Optional[str] = None
    status: Optional[str] = 'pending'
    payment_status: Optional[str] = 'pending'

class Booking(BaseModel):
    """Full booking model for admin view"""
    id: str
    user_id: Optional[str] = None
    court_id: str
    booking_date: date
    time_slots: List[dict]
    total_duration_minutes: int
    number_of_players: int
    total_amount: Decimal
    original_amount: Decimal
    discount_amount: Decimal
    coupon_code: Optional[str] = None
    status: str
    payment_status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator('id', 'user_id', 'court_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True

class AdminBooking(BaseModel):
    """Admin booking view with customer details"""
    id: str
    user_id: Optional[str] = None
    number_of_players: Optional[int] = 2
    customer_name: str
    customer_email: str
    customer_phone: str
    court_id: str
    game_type_id: str
    booking_reference: str
    booking_date: date
    # Updated fields
    time_slots: Optional[List[dict]] = []
    total_duration_minutes: Optional[int] = 0  # replacing duration_hours
    total_amount: Decimal
    original_amount: Decimal
    discount_amount: Decimal
    
    special_requests: Optional[str] = None
    status: str
    payment_status: str
    coupon_code: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    court: Optional[Court] = None
    game_type: Optional[GameType] = None

    @field_validator('id', 'court_id', 'game_type_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True

# ============================================================================
# REVIEW SCHEMAS
# ============================================================================

class ReviewCreate(BaseModel):
    booking_id: str
    court_id: str
    rating: int = Field(ge=1, le=5, description="Rating must be between 1 and 5")
    review_text: Optional[str] = None

class ReviewResponse(BaseModel):
    id: UUID
    user_id: UUID
    booking_id: UUID
    court_id: UUID
    court_name: Optional[str] = None
    rating: int
    review_text: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ReviewBase(BaseModel):
    court_id: str
    user_id: str
    booking_id: Optional[str] = None
    rating: int
    review_text: Optional[str] = None
    is_active: Optional[bool] = True

class Review(ReviewBase):
    id: str
    created_at: Optional[datetime] = None
    court: Optional[Court] = None
    user: Optional[User] = None

    @field_validator('id', 'court_id', 'user_id', 'booking_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True

# ============================================================================
# AUTH SCHEMAS
# ============================================================================

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class SendOTPRequest(BaseModel):
    phone_number: str

class SendOTPResponse(BaseModel):
    message: str
    success: bool
    verification_id: Optional[str] = None
    otp_code: Optional[str] = None

class VerifyOTPRequest(BaseModel):
    phone_number: str
    otp_code: str
    # Optional profile fields
    full_name: Optional[str] = None
    age: Optional[int] = None
    city: Optional[str] = None
    gender: Optional[str] = None
    handedness: Optional[str] = None
    skill_level: Optional[str] = None
    sports: Optional[List[str]] = None
    playing_style: Optional[str] = None

class VerifyOTPResponse(BaseModel):
    access_token: str
    token_type: str

# ============================================================================
# COUPON SCHEMAS
# ============================================================================

class CouponValidateRequest(BaseModel):
    coupon_code: str
    total_amount: float

class CouponResponse(BaseModel):
    valid: bool
    discount_percentage: Optional[float] = None
    discount_amount: Optional[float] = None
    final_amount: Optional[float] = None
    message: str

# ============================================================================
# TOURNAMENT SCHEMAS
# ============================================================================

class TournamentBase(BaseModel):
    name: str
    sport: str
    visibility: str = "Public"
    start_date: date
    end_date: date
    start_time: str
    end_time: str
    branch_name: str
    court_id: str
    format: str
    rules: Optional[str] = None
    entry_fee: float = 0.00
    max_participants: Optional[int] = None
    description: Optional[str] = None
    prize_info: Optional[str] = None
    contact_info: Optional[str] = None

class TournamentCreate(TournamentBase):
    pass

class TournamentResponse(TournamentBase):
    id: UUID
    user_id: UUID
    status: str
    current_participants: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ============================================================================
# PUSH TOKEN SCHEMAS
# ============================================================================

class PushTokenBase(BaseModel):
    device_token: str
    device_type: str = "android"
    device_info: Optional[dict] = None

class PushTokenCreate(PushTokenBase):
    pass

class PushTokenResponse(PushTokenBase):
    id: UUID
    user_id: str
    is_active: bool
    last_used_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ============================================================================
# NOTIFICATION SCHEMAS
# ============================================================================

class SendNotificationRequest(BaseModel):
    user_ids: Optional[List[str]] = None
    device_tokens: Optional[List[str]] = None
    title: str
    body: str
    data: Optional[dict] = None

class SendNotificationResponse(BaseModel):
    success: bool
    message: str
    sent_count: int
    failed_count: int
    errors: Optional[List[str]] = None

# ============================================================================
# VENUE SCHEMAS
# ============================================================================

class VenueBase(BaseModel):
    court_name: str
    location: str
    city: Optional[str] = None
    game_type: str
    prices: str
    description: Optional[str] = None
    photos: Optional[List[str]] = []
    videos: Optional[List[str]] = []

    @field_validator('photos', 'videos', mode='before')
    @classmethod
    def make_absolute(cls, v):
        if v and isinstance(v, list):
            return [resolve_path(img) for img in v if img]
        if v and isinstance(v, str):
            return [resolve_path(v)]
        return v

class VenueCreate(VenueBase):
    pass

class VenueResponse(VenueBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ============================================================================
# CITY AND GAME TYPE RESPONSE SCHEMAS
# ============================================================================

class CityResponse(BaseModel):
    id: UUID
    name: str
    short_code: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class GameTypeResponse(BaseModel):
    id: UUID
    name: str
    icon_url: Optional[str] = None
    is_active: bool

    @field_validator('icon_url', mode='before')
    @classmethod
    def make_absolute(cls, v):
        return resolve_path(v)

    class Config:
        from_attributes = True

class BranchResponse(BaseModel):
    id: UUID
    name: str
    city_id: Optional[UUID] = None
    address_line1: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class AdminCourtResponse(BaseModel):
    id: str
    branch_id: str
    game_type_id: str
    name: str
    price_per_hour: float
    price_conditions: Optional[List[dict]] = []
    unavailability_slots: Optional[List[dict]] = []
    images: Optional[List[str]] = []
    videos: Optional[List[str]] = []
    is_active: Optional[bool] = True

    @field_validator('images', 'videos', mode='before')
    @classmethod
    def make_absolute(cls, v):
        if v and isinstance(v, list):
            return [resolve_path(url) for url in v if url]
        return v
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

# ============================================================================
# PLAYO INTEGRATION SCHEMAS
# ============================================================================

class PlayoSlot(BaseModel):
    """Time slot availability for Playo"""
    startTime: str  # HH:MM:SS format
    endTime: str
    available: bool
    price: Optional[Decimal] = None
    ticketsAvailable: Optional[int] = None

class PlayoCourt(BaseModel):
    """Court availability response for Playo"""
    courtId: str
    courtName: str
    slots: List[PlayoSlot]

class PlayoAvailabilityResponse(BaseModel):
    """Response for fetch availability endpoint"""
    courts: List[PlayoCourt]
    requestStatus: int = 1
    message: str = "Success"

class PlayoOrderItem(BaseModel):
    """Individual order item in order creation request"""
    date: str  # YYYY-MM-DD
    courtId: str
    startTime: str  # HH:MM:SS
    endTime: str
    price: Decimal
    paidAtPlayo: Decimal
    playoOrderId: str

class PlayoOrderCreateRequest(BaseModel):
    """Request to create temporary orders"""
    venueId: str
    userName: str
    userMobile: str
    userEmail: str
    orders: List[PlayoOrderItem]

class PlayoOrderIdMapping(BaseModel):
    """Mapping between external and Playo order IDs"""
    externalOrderId: str
    playoOrderId: str

class PlayoOrderCreateResponse(BaseModel):
    """Response for order creation"""
    orderIds: List[PlayoOrderIdMapping]
    requestStatus: int  # 1 = success, 0 = failure
    message: Optional[str] = None

class PlayoOrderConfirmRequest(BaseModel):
    """Request to confirm pending orders"""
    orderIds: List[str]  # List of externalOrderIds

class PlayoBookingIdMapping(BaseModel):
    """Mapping between external booking and Playo order IDs"""
    externalBookingId: str
    playoOrderId: str

class PlayoOrderConfirmResponse(BaseModel):
    """Response for order confirmation"""
    bookingIds: List[PlayoBookingIdMapping]
    requestStatus: int
    message: Optional[str] = None

class PlayoOrderCancelRequest(BaseModel):
    """Request to cancel pending orders"""
    orderIds: List[str]

class PlayoOrderCancelResponse(BaseModel):
    """Response for order cancellation"""
    requestStatus: int
    message: Optional[str] = None

class PlayoBookingCancelItem(BaseModel):
    """Individual booking cancellation item"""
    playoOrderId: str
    externalBookingId: str
    price: Decimal
    refundAtPlayo: Decimal

class PlayoBookingCancelRequest(BaseModel):
    """Request to cancel confirmed bookings"""
    bookingIds: List[PlayoBookingCancelItem]

class PlayoBookingCancelResponse(BaseModel):
    """Response for booking cancellation"""
    requestStatus: int
    message: Optional[str] = None

class PlayoBookingMapItem(BaseModel):
    """Individual booking mapping item"""
    externalBookingId: str
    playoBookingId: str

class PlayoBookingMapRequest(BaseModel):
    """Request to map Playo booking IDs"""
    bookingIds: List[PlayoBookingMapItem]

class PlayoBookingMapResponse(BaseModel):
    """Response for booking mapping"""
    requestStatus: int
    message: Optional[str] = None

class PlayoBookingCreateItem(BaseModel):
    """Individual booking item in booking creation request"""
    date: str  # YYYY-MM-DD
    courtId: str
    startTime: str  # HH:MM:SS
    endTime: str  # HH:MM:SS (Optional for ticketing)
    playoOrderId: str
    price: Decimal
    paidAtPlayo: Decimal
    numTickets: Optional[int] = None  # For ticketing (swimming)

class PlayoBookingCreateRequest(BaseModel):
    """Request to create and confirm bookings"""
    venueId: str
    userName: str
    userMobile: str
    userEmail: str
    bookings: List[PlayoBookingCreateItem]

class PlayoBookingCreateResponse(BaseModel):
    """Response for booking creation"""
    bookingIds: List[PlayoBookingIdMapping]
    requestStatus: int  # 1 = success, 0 = failure
    message: Optional[str] = None


# ============================================================================
# ACADEMY SCHEMAS
# ============================================================================

class AcademyRegistration(BaseModel):
    athlete_name: str
    age_group: str
    contact_email: EmailStr
    phone_number: str
    preferred_sport: Optional[str] = None
    experience_level: Optional[str] = None

class ContactFormSubmission(BaseModel):
    form_type: str
    name: str
    email: Optional[EmailStr] = None
    phone: str
    message: Optional[str] = None
    company_name: Optional[str] = None
    sport: Optional[str] = None
    location: Optional[str] = None
    preferred_date: Optional[str] = None

# Resolve forward references
User.update_forward_refs()
