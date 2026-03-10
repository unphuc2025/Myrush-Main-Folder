# District API implementation Review

Please paste the review here.

Functional Review Comments with Examples –
District Rush API
This document provides functional review comments for the District Rush API Integration Guide.
The focus is on functional and integration gaps observed in the API design and documentation.
Security-related observations are intentionally excluded.
1. Slot Number Mapping Not Defined
Issue:
Booking API requires slotNumber but availability API only returns slot_time.
Example Availability Response:
slot_time: "5:00 AM - 5:30 AM"
Example Booking Request:
{
"date": "28-02-2026",
"slotNumber": 0,
"courtNumber": 0
}
Problem:
The documentation does not explain how slotNumber maps to slot_time.
Recommendation:
Return slotNumber directly in the availability API response.
Example Improved Response:
{
"slotNumber": 0,
"startTime": "05:00",
"endTime": "05:30"
}
2. Court Number Mapping Not Explained
Issue:
Availability response returns court_name but booking requires courtNumber.
Example Availability:
{
"court_name": "Court 1",
"price": 200,
"booked": true
}
Example Booking:
{
"courtNumber": 0
}
Problem:
Mapping between Court 1 and courtNumber=0 is not documented.
Recommendation:
Include courtNumber in availability response.
Example:
{
"courtNumber": 0,
"court_name": "Court 1"
}
3. Booking API Response Missing Booking Details
Current Response:
{
"message": "Batch booking successful!",
"bookingIDs": ["slot-booking-id"],
"batchBookingId": "batch-booking-id",
"totalSlots": 1
}
Issue:
Response does not include slot time, facility name, or court.
Recommendation:
Include complete booking details.
Example Improved Response:
{
"bookingId": "slot-booking-id",
"facilityName": "facility1",
"courtName": "Court 1",
"date": "2026-02-28",
"slotTime": "05:00 - 05:30"
}
4. Partial Cancellation Not Supported
Current API:
Cancel using batchBookingId.
Example:
POST /cancelBooking
bookingID=batch-booking-id
Issue:
If batch contains multiple slots, all bookings get cancelled.
Example Batch:
Slot1
Slot2
Slot3
User may want to cancel only Slot2.
Recommendation:
Support cancellation using slotBookingId.
Example:
POST /cancelSlot
{
"slotBookingId": "slot-booking-id"
}
5. Missing Booking Status API
Issue:
No API exists to check booking details later.
Example Use Case:
User calls support asking if booking succeeded.
Recommendation:
Provide booking retrieval API.
Example:
GET /booking/{bookingId}
Response:
{
"bookingId": "slot-booking-id",
"facilityName": "facility1",
"courtName": "Court 1",
"date": "2026-02-28",
"slotTime": "05:00 - 05:30",
"status": "CONFIRMED"
}
6. Missing Booking History API
Issue:
Partners cannot retrieve bookings for reconciliation.
Example Need:
Get all bookings for a facility on a specific date.
Example API:
GET /bookings?facilityName=facility1&date;=2026-02-28
Response:
[
{
"bookingId": "b1",
"slotTime": "05:00 - 05:30"
},
{
"bookingId": "b2",
"slotTime": "05:30 - 06:00"
}
]
7. Slot Capacity Not Defined
Current Availability:
{
"booked": true
}
Issue:
Binary availability assumes only one booking per slot.
Example Scenario:
Basketball court may support multiple players.
Recommendation:
Return capacity information.
Example:
{
"capacity": 10,
"available": 4
}
8. Inconsistent Time Format
Example Availability:
5:00 AM - 5:30 AM
Example Cancellation Response:
start: "0:00"
end: "1:00"
Issue:
Different time formats cause integration confusion.
Recommendation:
Use ISO format.
Example:
{
"startTime": "05:00",
"endTime": "05:30"
}
9. Inventory Webhook Behavior Not Clearly Defined
Webhook supports actions:
update
available
block
Example:
{
"action": "block",
"courtNumber": "0",
"slotNumber": "0"
}
Issue:
Documentation does not explain behavior when slot already has bookings.
Questions:
- Should booking be cancelled?
- Should update be rejected?
Recommendation:
Define expected behavior for each action.
10. Missing Facility Discovery API
Current APIs require:
facilityName
sportName
Issue:
No API exists to fetch list of facilities and sports.
Recommendation:
Provide discovery API.
Example:
GET /facilities
Response:
[
{
"facilityName": "facility1",
"sports": ["basketball", "badminton"]
}
]