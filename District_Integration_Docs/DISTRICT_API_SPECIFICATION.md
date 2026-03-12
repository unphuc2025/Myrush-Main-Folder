# MyRush x District: API Integration Specification
**Version**: 1.1 (ISO Format Update)
**Base URL**: `https://api-staging.myrush.in`

This document defines the interface for District to integrate with MyRush. All response times are in **ISO 24h format** (`HH:MM`).

---

## 1. Authentication
All requests must include the following credentials provided by MyRush:
- `id`: Unique Partner ID
- `apiKey`: Partner API Key

---

## 2. Slot Availability API
Check availability for a specific facility, sport, and date.

- **URL**: `/api/checkAvailability/`
- **Method**: `GET`
- **Parameters**:
  - `id` (Query): Partner ID
  - `apiKey` (Query): API Key
  - `facilityName` (Query): Name of the facility
  - `sportName` (Query): Name of the sport
  - `date` (Query): Date in `DD-MM-YYYY` format

### Sample Response:
```json
{
  "date": "28-02-2026",
  "facilityName": "Rush Arena - Kasavanahalli",
  "slot_data": [
    {
      "slotNumber": 20,
      "slot_time": "10:00 - 10:30",
      "courts": [
        {
          "courtNumber": 0,
          "court_name": "Badminton Court 1",
          "price": 200,
          "booked": false,
          "capacity": 4,
          "available": 4
        }
      ]
    }
  ]
}
```

---

## 3. Book Bulk Slots API
Submit a booking for one or more slots/courts.

- **URL**: `/api/makeBatchBooking`
- **Method**: `POST`
- **Content-Type**: `application/json`

### Sample Request:
```json
{
  "id": "unique-id",
  "apiKey": "api-key",
  "facilityName": "Rush Arena - Kasavanahalli",
  "sportName": "Badminton",
  "userName": "John Doe",
  "userPhone": "9876543210",
  "slots": [
    {
      "date": "28-02-2026",
      "slotNumber": 20,
      "courtNumber": 0
    }
  ]
}
```

### Sample Response:
```json
{
  "message": "Batch booking successful!",
  "batchBookingId": "DIST-A1B2C3D4",
  "totalSlots": 1,
  "bookings": [
    {
      "bookingId": "bk-998877",
      "facilityName": "Rush Arena - Kasavanahalli",
      "courtName": "Badminton Court 1",
      "courtNumber": 0,
      "date": "28-02-2026",
      "slotTime": "10:00 - 10:30",
      "slotNumber": 20
    }
  ]
}
```

---

## 4. Cancellation API
Cancel an entire batch or a specific booking slot.

- **URL**: `/api/cancelBooking/`
- **Method**: `POST`
- **Content-Type**: `application/x-www-form-urlencoded`
- **Form Data**:
  - `id`: Partner ID
  - `apiKey`: API Key
  - `facilityName`: Name of the facility
  - `bookingID`: Can be `batchBookingId` (cancels all) or `bookingId` (cancels one)

### Sample Response:
```json
{
  "batchBookingId": "DIST-A1B2C3D4",
  "totalBookingsCancelled": 1,
  "totalRefundAmount": 200,
  "cancellation_allowed": true,
  "bookings": [
    {
      "bookingId": "bk-998877",
      "date": "28-02-2026",
      "slot": {
        "interval": { "start": "10:00", "end": "10:30" }
      },
      "court": "Badminton Court 1",
      "refundAmount": 200,
      "cancelled": true
    }
  ]
}
```

---

## 5. Booking Status API (New)
Check the status of an individual booking.

- **URL**: `/api/booking/{bookingId}`
- **Method**: `GET`
- **Parameters**: `id`, `apiKey` (Query)

### Sample Response:
```json
{
  "bookingId": "bk-998877",
  "facilityName": "Rush Arena",
  "courtName": "Badminton Court 1",
  "courtNumber": 0,
  "date": "28-02-2026",
  "slotTime": "10:00 - 10:30",
  "status": "confirmed",
  "paymentStatus": "paid"
}
```

---

## 6. Facility Discovery API (New)
Fetch a list of all available facilities and their sports.

- **URL**: `/api/facilities`
- **Method**: `GET`
- **Parameters**: `id`, `apiKey` (Query)

### Sample Response:
```json
[
  {
    "facilityName": "Rush Arena - Kasavanahalli",
    "sports": ["Badminton", "Football"],
    "sportsInfo": [
      { "sportName": "Badminton", "courtsCount": 4 },
      { "sportName": "Football", "courtsCount": 1 }
    ]
  }
]
```

---

## 7. Troubleshooting
- **Slot Numbers**: Derived as `(Hour * 2)` for 30min slots (e.g., 10:00 AM = 20).
- **Court Numbers**: Zero-indexed (0, 1, 2...) based on creation order within a sport type.
- **Timezone**: All times are in IST (UTC+5:30).
