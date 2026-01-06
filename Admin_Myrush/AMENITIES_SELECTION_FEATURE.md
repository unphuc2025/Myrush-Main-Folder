# Amenities Selection in Court Form

## Summary
Added the ability to select amenities from the existing list of amenities when creating or editing a court.

## Changes Made

### Backend
1.  **Database**: Added `amenities` column (ARRAY of strings) to `admin_courts` table via `add_amenities_column.py`.
2.  **Model**: Updated `Court` model in `models.py` to include `amenities = Column(ARRAY(String))`.
3.  **Schema**: Updated `CourtBase` schema in `schemas.py` to include `amenities: Optional[List[str]]`.
4.  **API**: Updated `create_court` and `update_court` in `routers/courts.py` to parse and save the `amenities` field from the form data.

### Frontend
1.  **AddCourtForm**:
    *   Fetched available amenities using `amenitiesApi.getAll()`.
    *   Added an "Amenities" section with checkboxes for each available amenity.
    *   Managed state for selected amenities.
    *   Updated submission logic to include the list of selected amenity IDs.

## Verification
- Database column added successfully.
- Backend reloaded.
- Verified frontend code renders the amenities section.

## How to Test
1.  Go to **Settings > Amenities** and ensure you have some amenities created.
2.  Go to **Settings > Courts**.
3.  Click **Add Court** or **Edit** an existing court.
4.  You should see an **Amenities** section above the Price Conditions.
5.  Select some amenities.
6.  Save the court.
7.  Edit the court again to verify the amenities are still selected.
