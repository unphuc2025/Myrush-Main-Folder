# 🔧 Booking Function Fix Guide

## Problem Summary

The booking creation was failing with the error:
```
PGRST202: Could not find the function public.create_booking(...) in the schema cache
```

And also:
```
COALESCE types character varying and numeric cannot be matched
```

## Root Causes Identified

### 1. Missing `venueObject` in Navigation Flow ✅ FIXED
The `venueObject` (containing the venue ID) was not being passed from `BookingDetailsScreen` to `ReviewBookingScreen`.

**Files Fixed:**
- ✅ `mobile/src/screens/BookingDetailsScreen.tsx` - Now passes `venueObject`, `year`, and `monthIndex`
- ✅ `mobile/src/screens/SlotSelectionScreen.tsx` - Now passes `monthIndex`
- ✅ `mobile/src/types/index.ts` - Updated type definitions
- ✅ `mobile/src/screens/ReviewBookingScreen.tsx` - Better error handling for missing venue ID

### 2. Type Mismatch in Database Function ⚠️ NEEDS SQL FIX
The `prices` column in `adminvenues` table is stored as TEXT/VARCHAR, but the booking function was trying to use it as DECIMAL without proper conversion.

## 🚀 How to Fix

### Step 1: Apply the SQL Fix (REQUIRED)

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `backend/fix-booking-function.sql`
4. Click **Run**

This will:
- Drop the old `create_booking` function
- Create a new `create_booking` function with proper type conversion
- Handle the `prices` field correctly (converts TEXT to DECIMAL)
- Add conflict checking for time slots
- Fix the `get_user_bookings` function to handle VARCHAR types
- Grant proper permissions to both functions

### Step 2: Test the Fix

Run the test scripts to verify everything works:

**Test booking creation:**
```bash
node backend/test-booking-flow.js
```

Expected output:
```
✅ Users table exists
✅ Venues table exists
✅ Booking table exists
✅ Function works!
🎉 BOOKING CREATED SUCCESSFULLY!
```

**Test booking retrieval:**
```bash
node backend/test-get-bookings.js
```

Expected output:
```
✅ Found X total bookings
📋 Booking Details:
  Venue: [venue name]
  Date: [date]
  Time: [time]
  ...
```

### Step 3: Test in the Mobile App

**Create a Booking:**
1. Start your mobile app
2. Navigate through the booking flow:
   - Home → Venues
   - Select a venue → Book Now
   - Select date and time slot
   - Enter booking details
   - Review and confirm
3. You should see a success message with booking ID and amount

**View Your Bookings:**
1. Tap the **Bookings** button in the bottom navigation bar (the large circular button in the center)
2. You should see all your bookings listed
3. Use the filter tabs to view:
   - **All** - All bookings
   - **Upcoming** - Confirmed bookings
   - **Completed** - Completed bookings
   - **Cancelled** - Cancelled bookings

## 📋 What Was Changed

### Mobile App Changes (Already Applied)

1. **BookingDetailsScreen.tsx**
   - Now extracts and passes `venueObject`, `year`, and `monthIndex` to ReviewBooking

2. **SlotSelectionScreen.tsx**
   - Now passes `monthIndex` along with other booking data

3. **ReviewBookingScreen.tsx**
   - Better venue ID extraction with fallback
   - Added validation to check if venue ID exists
   - Shows user-friendly error if venue data is missing
   - Uses `route.params` for year and monthIndex instead of venueData

4. **types/index.ts**
   - Updated `BookingDetails` and `ReviewBooking` types to include `year` and `monthIndex`

### Database Changes (Need to Apply SQL)

The SQL fix in `backend/fix-booking-function.sql` includes:

**For `create_booking` function:**
- Proper type conversion for `prices` field (TEXT → DECIMAL)
- Error handling for invalid price values
- Booking conflict detection
- Proper permissions for authenticated and anonymous users

**For `get_user_bookings` function:**
- Fixed type casting for VARCHAR columns (court_name, location)
- Returns bookings with venue details joined
- Supports status filtering
- Orders by date and time (most recent first)

## 🧪 Verification Scripts

### 1. `backend/verify-booking-function.js`
Tests if the booking function exists and has the correct signature.

### 2. `backend/test-booking-flow.js`
Tests the complete booking creation flow with real data from your database.

### 3. `backend/test-get-bookings.js`
Tests the booking retrieval functionality and displays all bookings for a user.

## ⚠️ Important Notes

1. **The SQL fix MUST be applied** in Supabase Dashboard for bookings to work
2. The mobile app changes are already applied and ready to use
3. Make sure you have at least one user and one venue in your database for testing
4. The function now properly handles text-based prices and converts them to numbers

## 🎯 Next Steps

1. ✅ Apply the SQL fix from `backend/fix-booking-function.sql` in Supabase Dashboard
2. ✅ Run `node backend/test-booking-flow.js` to verify booking creation
3. ✅ Run `node backend/test-get-bookings.js` to verify booking retrieval
4. ✅ Test the booking flow in your mobile app
5. ✅ Check the **Bookings** tab in the mobile app to see your bookings
6. ✅ Verify the `booking` table in Supabase Dashboard to see all bookings

## 📱 Bookings Display in Mobile App

The bookings are displayed in the **Bookings** tab (the large circular button in the center of the bottom navigation bar).

### Features:
- ✅ **All Bookings View** - Shows all your bookings
- ✅ **Filter by Status** - Filter by Upcoming, Completed, or Cancelled
- ✅ **Booking Cards** - Each booking shows:
  - Venue name and location
  - Date and time
  - Number of players
  - Total amount
  - Status badge (color-coded)
- ✅ **Pull to Refresh** - Swipe down to refresh bookings
- ✅ **Empty State** - Shows helpful message when no bookings exist

### Status Colors:
- 🟢 **Confirmed** - Green
- 🟡 **Pending** - Orange
- 🔵 **Completed** - Blue
- 🔴 **Cancelled** - Red

## 📞 Support

If you encounter any issues:
1. Check the console logs in your mobile app
2. Run the verification scripts
3. Check the Supabase logs in Dashboard → Logs
4. Verify that the `prices` column in `adminvenues` contains valid numeric values

