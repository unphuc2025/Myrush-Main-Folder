# Playo Booking Create API Documentation

## Overview

The `/api/playo/booking/create` endpoint allows Playo to create and confirm bookings for selected slots in MyRush venues. This endpoint locks the selected slots to prevent double bookings and creates confirmed bookings directly.

## Endpoint

```
POST /api/playo/booking/create
```

## Authentication

**Required Header:**
```
X-API-Key: <your-api-key>
```

## Request Format

```json
{
    "venueId": "string",
    "userName": "string", 
    "userMobile": "string",
    "userEmail": "string",
    "bookings": [
        {
            "date": "string",
            "courtId": "string",
            "startTime": "string",
            "endTime": "string",
            "playoOrderId": "string",
            "price": 0,
            "paidAtPlayo": 0,
            "numTickets": 0
        }
    ]
}
```

### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `venueId` | string | Yes | Branch/Venue UUID |
| `userName` | string | Yes | Name of the booking customer |
| `userMobile` | string | Yes | Default value to identify Playo bookings |
| `userEmail` | string | Yes | Default value to identify Playo bookings |
| `bookings` | array | Yes | List of booking items |

### Booking Item Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string | Yes | Date in YYYY-MM-DD format |
| `courtId` | string | Yes | Court UUID |
| `startTime` | string | Yes | Start time in HH:MM:SS format |
| `endTime` | string | Yes | End time in HH:MM:SS format |
| `playoOrderId` | string | Yes | Unique Playo order ID |
| `price` | number | Yes | Total price of the slot |
| `paidAtPlayo` | number | Yes | Amount collected at Playo from the user |
| `numTickets` | number | No | Total slots count for ticketing (swimming) |

## Response Format

```json
{
    "bookingIds": [
        {
            "externalBookingId": "string",
            "playoOrderId": "string"
        }
    ],
    "requestStatus": "string",
    "message": "string"
}
```

### Response Parameters

| Field | Type | Description |
|-------|------|-------------|
| `bookingIds` | array | List of created booking mappings |
| `externalBookingId` | string | Booking ID by external venue |
| `playoOrderId` | string | Playo order ID corresponding to externalBookingId |
| `requestStatus` | number | 0 = failed, 1 = successful |
| `message` | string | Appropriate message for the current request |

## Usage Examples

### Example 1: Single Booking

```bash
curl -X POST 'https://api.base-url/api/playo/booking/create' \
     -H 'Accept: application/json' \
     -H 'X-API-Key: xM2iS_yJBBZxExSIj1rjvl02FFAUOHYl9IgXBBxUkmU' \
     -H 'Content-Type: application/json' \
     -d '{
         "venueId": "123e4567-e89b-12d3-a456-426614174000",
         "userName": "John Doe",
         "userMobile": "9876543210",
         "userEmail": "john.doe@example.com",
         "bookings": [
             {
                 "date": "2023-12-25",
                 "courtId": "123e4567-e89b-12d3-a456-426614174001",
                 "startTime": "10:00:00",
                 "endTime": "11:00:00",
                 "playoOrderId": "playo-order-12345",
                 "price": 500.00,
                 "paidAtPlayo": 500.00,
                 "numTickets": 2
             }
         ]
     }'
```

### Example 2: Multiple Bookings

```bash
curl -X POST 'https://api.base-url/api/playo/booking/create' \
     -H 'Accept: application/json' \
     -H 'X-API-Key: xM2iS_yJBBZxExSIj1rjvl02FFAUOHYl9IgXBBxUkmU' \
     -H 'Content-Type: application/json' \
     -d '{
         "venueId": "123e4567-e89b-12d3-a456-426614174000",
         "userName": "Jane Smith",
         "userMobile": "9876543210",
         "userEmail": "jane.smith@example.com",
         "bookings": [
             {
                 "date": "2023-12-25",
                 "courtId": "123e4567-e89b-12d3-a456-426614174001",
                 "startTime": "10:00:00",
                 "endTime": "11:00:00",
                 "playoOrderId": "playo-order-12345",
                 "price": 500.00,
                 "paidAtPlayo": 500.00,
                 "numTickets": 2
             },
             {
                 "date": "2023-12-25",
                 "courtId": "123e4567-e89b-12d3-a456-426614174002",
                 "startTime": "14:00:00",
                 "endTime": "15:00:00",
                 "playoOrderId": "playo-order-12346",
                 "price": 600.00,
                 "paidAtPlayo": 600.00,
                 "numTickets": 1
             }
         ]
     }'
```

## Success Response Example

```json
{
    "bookingIds": [
        {
            "externalBookingId": "123e4567-e89b-12d3-a456-426614174003",
            "playoOrderId": "playo-order-12345"
        },
        {
            "externalBookingId": "123e4567-e89b-12d3-a456-426614174004",
            "playoOrderId": "playo-order-12346"
        }
    ],
    "requestStatus": 1,
    "message": "Success"
}
```

## Error Response Example

```json
{
    "bookingIds": [],
    "requestStatus": 0,
    "message": "Booking creation failed"
}
```

## Important Notes

1. **All or Nothing**: If more than one booking is placed and any booking fails, no bookings will be created and the response will set `requestStatus=0`.

2. **Slot Validation**: The endpoint validates that all requested slots are available (not already booked or reserved).

3. **Authentication**: The X-API-Key header is required for all requests.

4. **Data Format**: All date/time fields must follow the specified formats:
   - Date: YYYY-MM-DD
   - Time: HH:MM:SS

5. **Ticketing Support**: The `numTickets` field is optional and used for ticketing systems like swimming.

6. **System User**: Bookings are created under a system user "Playo System User" with email "playo@myrush.in".

## Testing

Use the provided test script to verify the endpoint:

```bash
python test_playo_booking_create.py
```

## API Key Management

Generate new API keys using the management script:

```bash
# Generate a new API key
python generate_playo_api_key.py create "Production API Key for Playo Integration"

# List existing keys
python generate_playo_api_key.py list

# Deactivate a key
python generate_playo_api_key.py deactivate <key-id>
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Missing or invalid X-API-Key header
2. **Invalid venueId format**: venueId is not a valid UUID
3. **Invalid date format**: Date not in YYYY-MM-DD format
4. **Invalid time format**: Time not in HH:MM:SS format
5. **Slot not available**: Requested time slot is already booked or reserved

### Error Messages

- `"Missing X-API-Key header"`: Authentication header is missing
- `"Invalid or inactive API token"`: Provided API key is invalid or deactivated
- `"Invalid venueId format"`: venueId is not a valid UUID
- `"Booking creation failed"`: One or more validation checks failed