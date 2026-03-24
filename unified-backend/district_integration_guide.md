# District Integration - Testing Documentation

This document provides the necessary identifiers and credentials for testing the District integration with MyRush.

## 1. Authentication Credentials (Testing/Dev)

For testing purposes, you can use the following credentials which are hardcoded as a fallback in the integration logic.

| Key | Value |
| :--- | :--- |
| **Partner ID (`id`)** | `unique-id` |
| **API Key (`apiKey`)** | `api-key` |

> [!NOTE]
> In production, these will be replaced by actual unique IDs and secure API keys stored in the database.

## 2. Venue Identifiers (Facility Names)

The `facilityName` parameter in the API must match the **Name** of the branch in MyRush. Here are some active venues you can use for testing:

| Venue Id (Facility Name) | Branch ID (UUID) |
| :--- | :--- |
| `Rush Arena Railways` | `bbdec863-c298-481a-a29b-b889207cf65d` |
| `Rush Arena - Kasavanahalli` | `f349e9f2-2678-442f-8c21-6e49cb097d4e` |
| `Rush Arena - Gateway Office parks Chennai` | `a55d225c-3818-4a8d-82b5-605033040353` |
| `Rush Arena x Grid Game` | `040c9924-32c0-44eb-9d7f-ac7888d057e5` |

## 3. Supported Sports (Sport Names)

The `sportName` parameter must match the **Name** of the sport (Game Type) in MyRush. Common sports include:

- `Pickleball`
- `Boxcricket`
- `FootBall`
- `Cricket`
- `Padel`
- `Basketball`
- `Badminton`

## 4. API Usage Examples

### Check Availability
**GET** `/api/checkAvailability/`
```bash
curl "http://localhost:8000/api/checkAvailability/?id=unique-id&apiKey=api-key&facilityName=Rush%20Arena%20Railways&sportName=Pickleball&date=15-03-2026"
```

### Make Batch Booking
**POST** `/api/makeBatchBooking`
```json
{
  "id": "unique-id",
  "apiKey": "api-key",
  "facilityName": "Rush Arena Railways",
  "sportName": "Pickleball",
  "userName": "District Tester",
  "userPhone": "9876543210",
  "userEmail": "tester@district.in",
  "slots": [
    {
      "date": "15-03-2026",
      "slotNumber": 20,
      "courtNumber": 0
    },
    {
      "date": "15-03-2026",
      "slotNumber": 21,
      "courtNumber": 0
    }
  ]
}
```
