# District API Official Requirements

Please paste the official requirements documentation below.
rush.md 2026-02-25
1 / 6
API Integration Guide
This guide provides comprehensive documentation for the major APIs required for integration with the
Sports Facility Booking System.
Table of Contents
. Slot Availability API
. Book Bulk Slots API
. Cancellation API
. District Webhook
Type A: Recurring Slot Modification
Type B: Update for Specific Date
. Important Notes
1. Slot Availability API
Check availability of slots for a specific facility, sport, and date.
Sample Request
curl --location --request GET 'https://www.rush.in/api/checkAvailability/'
\
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'id=unique-id' \
--data-urlencode 'apiKey=api-key' \
--data-urlencode 'facilityName=facility1' \
--data-urlencode 'sportName=sport1' \
--data-urlencode 'date=28-02-2026'
Sample Response
{
 "date": "28-02-2026",
 "slot_data": [
 {
 "slot_time": "5:00 AM - 5:30 AM",
 "courts": [
 {
 "court_name": "Court 1",
 "price": 200,
 "booked": true
 },
 {
 "court_name": "Court 2",
rush.md 2026-02-25
2 / 6
 "price": 200,
 "booked": true
 },
 {
 "court_name": "Court 3",
 "price": 200,
 "booked": true
 }
 ]
 },
 {
 "slot_time": "5:30 AM - 6:00 AM",
 "courts": [
 {
 "court_name": "Court 1",
 "price": 200,
 "booked": true
 },
 {
 "court_name": "Court 2",
 "price": 200,
 "booked": true
 },
 {
 "court_name": "Court 3",
 "price": 200,
 "booked": true
 }
 ]
 }
 ]
}
2. Book Bulk Slots API
Book multiple slots in a single request.
Sample Request
curl --location 'https://www.rush.in/api/makeBatchBooking' \
--header 'Content-Type: application/json' \
--data-raw '{
 "id": "unique-id", //unique for each partner
 "apiKey": "api-key",
 "facilityName": "facility1",
 "sportName": "sport1",
 "userName": "User 1",
 "userPhone": "+91 966XXXXXXX", //required field
 "userEmail": "",
 "slots": [
rush.md 2026-02-25
3 / 6
 {
 "date": "28-02-2026",
 "slotNumber": 0,
 "courtNumber": 0
 }
 ]
}'
Sample Response
{
 "message": "Batch booking successful!",
 "bookingIDs": [
 "slot-booking-id"
 ],
 "batchBookingId": "batch-booking-id",
 "totalSlots": 1
}
3. Cancellation API
Cancel a booking using the batch booking ID.
Sample Request
curl --location 'https://www.rush.in/api/cancelBooking/' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'id=unique-id' \
--data-urlencode 'apiKey=api-key' \
--data-urlencode 'facilityName=facility1' \
--data-urlencode 'bookingID=batch-booking-id'
Sample Response
{
 "batchBookingId": "batch-booking-id",
 "totalBookingsCancelled": 1,
 "totalRefundAmount": 5,
 "cancellation_allowed": true,
 "bookings": [
 {
 "bookingId": "slot-booking-id",
 "date": "28-02-2026",
 "slot": {
 "interval": {
rush.md 2026-02-25
4 / 6
 "end": "1:00",
 "start": "0:00"
 },
 "timeId": "t000"
 },
 "court": "Half Court 1",
 "refundAmount": 5,
 "cancelled": true
 }
 ]
}
4. District Webhook
The webhook endpoint supports inventory updates and modifications.
Type A: Recurring Slot Modification
This webhook supports recurring slot modification for specific days of the week.
Sample Request
curl --location 'https://www.district.in/gw/ext/play/rush/callback' \
--header 'Content-Type: application/json' \
--header 'User-Agent: RUSH-Webhook/1.0' \
--header 'true-client-ip: localhost' \
--header 'API-KEY: abcde' \
--header 'Authorization: Basic akanan' \
--data '{
 "sourceType": "inventory",
 "action": "update", // other actions are available/block
 "data": [
 {
 "courtNumber": "0",
 "slotNumber": "0",
 "count": "1",
 "sport": "basketBall",
 "facilityName": "testHICAS",
 "day": "6",
 "price": 11
 } // can add any number of slots
 ],
 "timestamp": 1761645965,
 "requestId": "reqId2225"
}'
Important Notes for Type A
rush.md 2026-02-25
5 / 6
All fields are required except price
Price is required in case of update action
Day represents week day (0 → Sunday, 1 → Monday, and so on)
RequestId should be unique for each request
Type B: Update for Specific Date
This webhook type is used to update inventory for a specific date.
Sample Request
curl --location 'https://www.district.in/gw/ext/play/rush/callback' \
--header 'Content-Type: application/json' \
--header 'User-Agent: RUSH-Webhook/1.0' \
--header 'true-client-ip: localhost' \
--header 'API-KEY: abcde' \
--header 'Authorization: Basic akanan' \
--data '{
 "sourceType": "inventory",
 "action": "available",
 "data": [
 {
 "courtNumber": "0",
 "slotNumber": "0",
 "count": "1",
 "sport": "basketBall",
 "facilityName": "testHICAS",
 "date": "28-02-2026"
 }
 ],
 "timestamp": 1761645965,
 "requestId": "reqId2225"
}'
Important Notes for Type B
Instead of day, pass the date field in DD-MM-YYYY format
Important Notes
Authentication
unique-id and api-key will be the same for all requests
These credentials will be provided by the partner for authentication checks
Webhook Configuration
Basic auth for webhook will be provided by District
Partners must share IP for whitelisting of webhook
rush.md 2026-02-25
6 / 6
Webhook Actions
The webhook supports the following actions:
update - Update slot information including price
available - Mark slots as available
block - Block slots from booking
Support
For any integration issues or questions, please contact the technical support team.