# Slot Management Fix

## Summary
Fixed an issue where "default" time slots (5 AM - 11 AM) were persistently reappearing after being deleted by the admin.

## Changes Made

### Frontend (`AddCourtForm.jsx`)
1.  **Submit Logic**: Removed the check in `handleSubmit` that forced the default morning slot to be added back if it was missing. The form now submits exactly what the user has configured.
2.  **Load Logic**: Removed the check in `useEffect` that re-populated default slots if obtaining existing data resulted in an empty slot list. This allows courts to legitimately have zero slots if desired.

### Backend (`routers/courts.py`)
1.  **Creation Logic**: Updated `create_court` to stop automatically appending default morning slots if they are missing from the request. It now respects empty price conditions.

## Verification
- Saving a court with *no* slots now persists as having no slots.
- Saving a court after deleting specific slots (including the default morning ones) now respects the deletion and does not bring them back.
- Backend reloaded successfully.

## How to Test
1.  Go to **Settings > Courts**.
2.  Edit an existing court.
3.  Scroll to the **Price Conditions** section.
4.  Delete the "05:00 - 11:00" slot (or any other slot).
5.  Click **"Update Court"**.
6.  Refresh the page or re-open the court edit form.
7.  Verify that the deleted slot is **gone** and has not reappeared.
