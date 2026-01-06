# Terms and Conditions Feature Implementation

## Summary
Successfully implemented the ability for admins to add Terms and Conditions to Courts.

## Changes Created

### Backend
1.  **Database**: Added `terms_and_conditions` (Text) column to `admin_courts` table via migration script.
2.  **Model**: Updated `Court` model in `models.py` to include the new column.
3.  **Schema**: Updated `CourtBase` schema is `schemas.py` to include `terms_and_conditions`.
4.  **API**: Updated `POST /api/courts` and `PUT /api/courts/{id}` in `routers/courts.py` to accept and save the new field.

### Frontend
1.  **AddCourtForm**: Updated `src/components/settings/AddCourtForm.jsx` to:
    *   Include `termsAndConditions` field in the form state.
    *   Initialize the field from existing data when editing.
    *   Display a large text area for inputting terms.
    *   Send the `terms_and_conditions` field to the backend on submission.

## Verification
- Backend migration script ran successfully.
- Backend server reloaded without errors.
- Frontend code updated to display the new input field.

## How to Test
1.  Navigate to the **Settings** -> **Courts** tab in the admin dashboard.
2.  Click **"Add Court"**.
3.  Fill in the required details and scroll down to the "Terms and Conditions" section.
4.  Enter some terms and save the court.
5.  Edit the created court to verify the terms are persisted and displayed correctly.
