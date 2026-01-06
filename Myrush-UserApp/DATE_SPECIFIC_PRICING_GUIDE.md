# Date-Specific Pricing Feature Guide

## Overview
The MyRush booking system now supports **date-specific price conditions** in addition to day-of-week pricing. This allows administrators to set special prices for specific dates (holidays, special events, etc.) through the `price_conditions` column in the `admin_courts` table.

## How It Works

### Priority System
The system uses a priority-based approach when determining slot prices:

1. **HIGHEST PRIORITY**: Date-specific pricing (e.g., "2025-12-25", "2025-01-01")
2. **MEDIUM PRIORITY**: Day-of-week pricing (e.g., "Monday", "Friday", "Weekend")
3. **LOWEST PRIORITY**: Default base price (`price_per_hour` column)

### Database Structure

The `price_conditions` column in the `admin_courts` table is a **JSONB array** that can contain multiple pricing configurations. Each configuration can be:

#### 1. Day-of-Week Based Pricing
```json
{
  "id": "config-1",
  "days": ["Monday", "Tuesday", "Wednesday", "Thursday"],
  "slotFrom": "08:00",
  "slotTo": "18:00",
  "price": "500"
}
```

#### 2. Date-Specific Pricing (NEW)
```json
{
  "id": "config-2",
  "dates": ["2025-12-25", "2025-12-31", "2026-01-01"],
  "slotFrom": "10:00",
  "slotTo": "22:00",
  "price": "1200"
}
```

## Example Configuration

### Scenario: Cricket Court with Holiday Pricing

```json
[
  {
    "id": "weekday-morning",
    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "slotFrom": "06:00",
    "slotTo": "12:00",
    "price": "500"
  },
  {
    "id": "weekday-evening",
    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "slotFrom": "12:00",
    "slotTo": "18:00",
    "price": "700"
  },
  {
    "id": "weekday-night",
    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "slotFrom": "18:00",
    "slotTo": "23:00",
    "price": "900"
  },
  {
    "id": "weekend-all-day",
    "days": ["Saturday", "Sunday"],
    "slotFrom": "06:00",
    "slotTo": "23:00",
    "price": "1000"
  },
  {
    "id": "christmas-special",
    "dates": ["2025-12-25"],
    "slotFrom": "08:00",
    "slotTo": "22:00",
    "price": "1500"
  },
  {
    "id": "new-year-special",
    "dates": ["2025-12-31", "2026-01-01"],
    "slotFrom": "10:00",
    "slotTo": "20:00",
    "price": "2000"
  },
  {
    "id": "republic-day",
    "dates": ["2026-01-26"],
    "slotFrom": "06:00",
    "slotTo": "23:00",
    "price": "1800"
  }
]
```

### What Happens:
- **December 25, 2025**: All slots priced at ₹1500 (Christmas special rate)
- **December 31, 2025**: All slots priced at ₹2000 (New Year's Eve special)
- **January 1, 2026**: All slots priced at ₹2000 (New Year's Day special)
- **January 26, 2026**: All slots priced at ₹1800 (Republic Day special)
- **Regular Saturday/Sunday**: All slots priced at ₹1000 (weekend rate)
- **Regular Monday-Friday morning (6am-12pm)**: ₹500
- **Regular Monday-Friday afternoon (12pm-6pm)**: ₹700
- **Regular Monday-Friday evening (6pm-11pm)**: ₹900

## SQL Update Examples

### Add Date-Specific Pricing to Existing Court

```sql
-- Update a specific court with date-specific pricing
UPDATE admin_courts
SET price_conditions = '[
  {
    "id": "weekday",
    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "slotFrom": "08:00",
    "slotTo": "22:00",
    "price": "600"
  },
  {
    "id": "weekend",
    "days": ["Saturday", "Sunday"],
    "slotFrom": "08:00",
    "slotTo": "22:00",
    "price": "800"
  },
  {
    "id": "diwali-2025",
    "dates": ["2025-11-12", "2025-11-13"],
    "slotFrom": "10:00",
    "slotTo": "20:00",
    "price": "1500"
  }
]'::jsonb
WHERE name = 'Cricket Court A';
```

### Add Multiple Special Dates

```sql
-- Add pricing for multiple holidays at once
UPDATE admin_courts
SET price_conditions = price_conditions || '[
  {
    "id": "independence-day",
    "dates": ["2025-08-15"],
    "slotFrom": "06:00",
    "slotTo": "23:00",
    "price": "1200"
  },
  {
    "id": "gandhi-jayanti",
    "dates": ["2025-10-02"],
    "slotFrom": "06:00",
    "slotTo": "23:00",
    "price": "1200"
  }
]'::jsonb
WHERE id = 'your-court-id-here';
```

## API Response

When a user requests available slots for a specific date, the API now returns:

```json
{
  "court_id": "abc-123",
  "date": "2025-12-25",
  "slots": [
    {
      "time": "08:00",
      "display_time": "08:00 AM",
      "price": 1500,
      "available": true
    },
    {
      "time": "09:00",
      "display_time": "09:00 AM",
      "price": 1500,
      "available": true
    },
    ...
  ]
}
```

## Frontend Display

The mobile app (SlotSelectionScreen.tsx) automatically displays the correct price for each slot based on:
1. Selected date
2. Court configuration
3. Available slot times

Users see:
- **Slot time**: "08:00 AM"
- **Dynamic price**: "₹1500" (automatically calculated based on date)

## Testing the Feature

### 1. Check Current Configuration
```sql
SELECT 
  name,
  price_per_hour,
  price_conditions
FROM admin_courts
WHERE id = 'your-court-id';
```

### 2. Test API Endpoint
```bash
# Test regular day
curl "http://localhost:8000/courts/{court_id}/available-slots?date=2025-12-20"

# Test special date (Christmas)
curl "http://localhost:8000/courts/{court_id}/available-slots?date=2025-12-25"
```

### 3. Compare Responses
- Regular day should show day-of-week pricing
- Special date should show date-specific pricing (overrides day-of-week)

## Backend Logs

When the feature is working, you'll see logs like:

```
[COURTS API] ✅ Court has 7 price_conditions for abc-123
[COURTS API] ✓ DATE-SPECIFIC Config 5: 2025-12-25, 08:00-22:00, ₹1500
[COURTS API] Using 1 DATE-SPECIFIC configurations
[COURTS API] Generating slots: 8-22h, ₹1500
[COURTS API] Total slots generated: 14
[COURTS API] Found 14 available slots for court abc-123 on 2025-12-25
```

## Benefits

✅ **Flexible Pricing**: Set different prices for holidays, events, and special occasions
✅ **Automatic Override**: Date-specific prices automatically override day-of-week prices
✅ **Easy Management**: Admin can add/modify special dates through database
✅ **User-Friendly**: Users see correct prices automatically based on selected date
✅ **Revenue Optimization**: Maximize revenue during high-demand dates

## Important Notes

1. **Date Format**: Always use `YYYY-MM-DD` format for dates (e.g., "2025-12-25")
2. **Time Format**: Use 24-hour format for times (e.g., "08:00", "18:00")
3. **Price Format**: Store as string in database (e.g., "1500"), converted to number in API
4. **Priority**: Date-specific pricing ALWAYS overrides day-of-week pricing
5. **Multiple Dates**: You can include multiple dates in a single configuration's `dates` array

## Future Enhancements

Potential additions to this feature:
- Time-range specific pricing within the same date (e.g., morning vs evening on same holiday)
- Percentage-based discounts/surcharges
- Seasonal pricing (date ranges)
- Dynamic pricing based on demand
- Early bird/last-minute booking discounts
