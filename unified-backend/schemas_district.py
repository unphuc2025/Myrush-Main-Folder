from pydantic import BaseModel, Field, EmailStr, field_validator, ConfigDict
from typing import List, Optional
from datetime import datetime

# ============================================================================
# INBOUND REQUEST SCHEMAS (From District -> MyRush)
# ============================================================================

# Note: CheckAvailability and CancelBooking use x-www-form-urlencoded,
# so they will be validated via FastAPI Depends/Form inside the router.
# But we can still define the base schemas for documentation/logic.

class DistrictBaseAuthForm(BaseModel):
    id: str = Field(..., description="Unique ID for the partner")
    apiKey: str = Field(..., description="API Key for the partner")

class DistrictAvailabilityQueryParams(DistrictBaseAuthForm):
    facilityName: str
    sportName: str
    date: str = Field(..., description="Date in DD-MM-YYYY format")
    
    @field_validator('date')
    @classmethod
    def validate_date_format(cls, v):
        try:
            datetime.strptime(v, '%d-%m-%Y')
            return v
        except ValueError:
            raise ValueError("Date must be in DD-MM-YYYY format")

class DistrictSlotRule(BaseModel):
    date: str
    slotNumber: int
    courtNumber: int

class DistrictBatchBookingRequest(BaseModel):
    """Payload for POST /makeBatchBooking"""
    id: str = Field(..., description="unique-id for the partner")
    apiKey: str
    facilityName: str
    sportName: str
    userName: str
    userPhone: str
    userEmail: Optional[str] = ""
    slots: List[DistrictSlotRule]

    @field_validator('slots')
    @classmethod
    def validate_slots(cls, v):
        if not v:
            raise ValueError("At least one slot must be provided")
        for slot in v:
            try:
                datetime.strptime(slot.date, '%d-%m-%Y')
            except ValueError:
                raise ValueError("Slot date must be in DD-MM-YYYY format")
        return v

# ============================================================================
# OUTBOUND RESPONSE SCHEMAS (From MyRush -> District)
# ============================================================================

# ============================================================================
# OUTBOUND RESPONSE SCHEMAS (From MyRush -> District)
# ============================================================================

class DistrictCourtAvailabilityResponse(BaseModel):
    courtNumber: int
    court_name: str
    price: float
    booked: bool
    capacity: int = 1
    available: int = 1

class DistrictSlotDataResponse(BaseModel):
    slotNumber: int
    slot_time: str
    courts: List[DistrictCourtAvailabilityResponse]

class DistrictAvailabilityResponse(BaseModel):
    date: str
    slot_data: List[DistrictSlotDataResponse]

class DistrictBookingDetailResponse(BaseModel):
    bookingId: str
    facilityName: str
    courtName: str
    courtNumber: int
    date: str
    slotTime: str
    slotNumber: int
    status: str

class DistrictBatchBookingResponse(BaseModel):
    message: str
    bookingIDs: List[str]
    batchBookingId: str
    totalSlots: int
    bookings: List[DistrictBookingDetailResponse] = []

class DistrictCancelledSlotInterval(BaseModel):
    start: str
    end: str

class DistrictCancelledSlot(BaseModel):
    interval: DistrictCancelledSlotInterval
    timeId: str

class DistrictCancelledBookingDetails(BaseModel):
    bookingId: str
    date: str
    slot: DistrictCancelledSlot
    court: str
    refundAmount: float
    cancelled: bool

class DistrictCancellationResponse(BaseModel):
    batchBookingId: str
    totalBookingsCancelled: int
    totalRefundAmount: float
    cancellation_allowed: bool
    bookings: List[DistrictCancelledBookingDetails]

class DistrictBookingStatusResponse(BaseModel):
    bookingId: str
    facilityName: str
    courtName: str
    courtNumber: int
    date: str
    slotTime: str
    slotNumber: int
    status: str
    price: float
    paymentStatus: str

class DistrictSportInfo(BaseModel):
    sportName: str
    courtsCount: int

class DistrictFacilityDiscoveryResponse(BaseModel):
    facilityName: str
    sports: List[str]
    sportsInfo: List[DistrictSportInfo] = []

class DistrictBookingHistoryResponse(BaseModel):
    date: str
    facilityName: str
    totalBookings: int
    bookings: List[DistrictBookingDetailResponse]

# ============================================================================
# WEBHOOK SCHEMAS (From MyRush -> District via Outbox)
# ============================================================================

class DistrictWebhookDataA(BaseModel):
    """Type A: Recurring Slot Modification"""
    courtNumber: str
    slotNumber: str
    count: str = "1"
    sport: str
    facilityName: str
    day: str  # 0(Sun) - 6(Sat)
    price: Optional[float] = None

class DistrictWebhookPayloadA(BaseModel):
    sourceType: str = "inventory"
    action: str  # 'update', 'available', 'block'
    data: List[DistrictWebhookDataA]
    timestamp: int
    requestId: str

class DistrictWebhookDataB(BaseModel):
    """Type B: Update for Specific Date"""
    courtNumber: str
    slotNumber: str
    count: str = "1"
    sport: str
    facilityName: str
    date: str  # DD-MM-YYYY
    price: Optional[float] = None

class DistrictWebhookPayloadB(BaseModel):
    sourceType: str = "inventory"
    action: str  # 'available', 'block'
    data: List[DistrictWebhookDataB]
    timestamp: int
    requestId: str
