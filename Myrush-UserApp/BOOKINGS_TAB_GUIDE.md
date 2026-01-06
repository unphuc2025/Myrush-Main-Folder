# 📱 Bookings Tab - User Guide

## Where to Find Your Bookings

The **Bookings** tab is located in the **bottom navigation bar** of the mobile app.

```
┌─────────────────────────────────────────┐
│                                         │
│         Your App Content Here           │
│                                         │
│                                         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  Home    Play    [📅]    Train  Community│
│   🏠      📍      ⭕      💪      👥      │
└─────────────────────────────────────────┘
                    ↑
              BOOKINGS TAB
         (Large circular button)
```

## Visual Layout

### Bottom Navigation Bar
- **Home** (🏠) - Home screen
- **Play** (📍) - Venues list
- **Bookings** (📅) - **YOUR BOOKINGS** ← Large circular button in center
- **Train** (💪) - Training section
- **Community** (👥) - Community/Profile

### Bookings Screen Layout

```
┌─────────────────────────────────────────┐
│  ← My Bookings                          │
├─────────────────────────────────────────┤
│  [All] [Upcoming] [Completed] [Cancelled]│
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 🟢 Confirmed    Dec 15, 2024      │ │
│  │                                   │ │
│  │ Play Arena HSR                    │ │
│  │ HSR Layout, Bengaluru             │ │
│  │                                   │ │
│  │ ⏰ 14:00 - 15:00  👥 2 players    │ │
│  │                                   │ │
│  │ Team: Warriors                    │ │
│  │ Amount: ₹800                      │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 🟡 Pending      Dec 16, 2024      │ │
│  │                                   │ │
│  │ Sports Complex                    │ │
│  │ Koramangala, Bengaluru            │ │
│  │                                   │ │
│  │ ⏰ 18:00 - 19:00  👥 4 players    │ │
│  │                                   │ │
│  │ Team: Champions                   │ │
│  │ Amount: ₹1200                     │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

## Features

### 1. Filter Tabs
Tap any tab to filter bookings:
- **All** - Shows all bookings regardless of status
- **Upcoming** - Shows only confirmed bookings
- **Completed** - Shows finished bookings
- **Cancelled** - Shows cancelled bookings

### 2. Booking Cards
Each card displays:
- **Status Badge** (top-left) - Color-coded status
- **Date** (top-right) - Booking date
- **Venue Name** - Name of the venue
- **Location** - Venue address
- **Time** - Start and end time
- **Players** - Number of players
- **Team Name** - Your team name (if provided)
- **Amount** - Total booking amount

### 3. Status Colors
- 🟢 **Confirmed** - Green badge
- 🟡 **Pending** - Orange badge
- 🔵 **Completed** - Blue badge
- 🔴 **Cancelled** - Red badge

### 4. Pull to Refresh
Swipe down on the bookings list to refresh and get the latest data.

### 5. Empty State
If you have no bookings, you'll see:
```
┌─────────────────────────────────────────┐
│                                         │
│              📅                         │
│                                         │
│         No bookings found               │
│                                         │
│  Your bookings will appear here         │
│  once you make them                     │
│                                         │
└─────────────────────────────────────────┘
```

## How to Use

### View All Bookings
1. Tap the **Bookings** button (large circular button in bottom nav)
2. You'll see all your bookings by default

### Filter Bookings
1. Tap any filter tab at the top:
   - **All** - See everything
   - **Upcoming** - See only confirmed future bookings
   - **Completed** - See past bookings
   - **Cancelled** - See cancelled bookings

### Refresh Bookings
1. Pull down on the list
2. Release to refresh
3. Latest bookings will be loaded

### View Booking Details
1. Tap on any booking card
2. (Future feature: Will show detailed booking information)

## Creating a New Booking

To create a new booking:
1. Go to **Home** or **Play** tab
2. Select a venue
3. Choose date and time
4. Enter booking details
5. Review and confirm
6. Your new booking will appear in the **Bookings** tab!

## Booking Status Lifecycle

```
Pending (🟡)
    ↓
Confirmed (🟢)
    ↓
Completed (🔵)

OR

Pending (🟡)
    ↓
Cancelled (🔴)
```

## Tips

1. **Check Status** - Look at the color-coded badge to quickly see booking status
2. **Use Filters** - Use the filter tabs to find specific bookings quickly
3. **Pull to Refresh** - Refresh regularly to see the latest updates
4. **Plan Ahead** - Use the Upcoming filter to see your scheduled bookings

## Troubleshooting

### No Bookings Showing?
1. Make sure you're logged in
2. Try pulling down to refresh
3. Check if you've created any bookings
4. Verify your internet connection

### Bookings Not Updating?
1. Pull down to refresh the list
2. Check your internet connection
3. Try switching between filter tabs

### Can't See Booking Details?
1. Make sure the booking was created successfully
2. Check the Supabase database for the booking record
3. Run the test script: `node backend/test-get-bookings.js`

## Technical Details

### API Endpoint
The bookings are fetched using the `get_user_bookings` function:
```javascript
bookingsApi.getUserBookings(userId, statusFilter)
```

### Data Source
- Database: Supabase
- Table: `booking`
- Function: `get_user_bookings(p_user_id, p_status_filter)`

### Real-time Updates
Currently, bookings are loaded when:
- Screen is opened
- Filter tab is changed
- User pulls to refresh

---

**Need Help?** Check the `BOOKING_COMPLETE_SUMMARY.md` for more details!

