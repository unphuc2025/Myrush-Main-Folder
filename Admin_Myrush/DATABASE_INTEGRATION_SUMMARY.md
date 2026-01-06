# MyRush Admin Database Integration - Implementation Summary

## Overview
Complete database integration for the MyRush Admin Dashboard with full CRUD operations for cities, areas, game types, amenities, and branches.

## Database Tables Created

### 1. **admin_cities**
- **Fields**: id, name, short_code, is_active, created_at, updated_at
- **Purpose**: Store all cities where branches operate
- **Relations**: One-to-many with areas and branches

### 2. **admin_areas**
- **Fields**: id, city_id (FK), name, is_active, created_at, updated_at
- **Purpose**: Store areas within each city
- **Relations**: Belongs to city, one-to-many with branches

### 3. **admin_game_types**
- **Fields**: id, name, short_code, description, icon_url, is_active, created_at, updated_at
- **Purpose**: Store different sport/game types
- **Relations**: Many-to-many with branches through junction table

### 4. **admin_amenities**
- **Fields**: id, name, description, icon_url, is_active, created_at, updated_at
- **Purpose**: Store available amenities (Wi-Fi, Parking, etc.)
- **Relations**: Many-to-many with branches through junction table

### 5. **admin_branches**
- **Fields**: id, name, city_id (FK), area_id (FK), address_line1, address_line2, search_location, ground_overview, ground_type, opening_hours (JSONB), images (TEXT[]), is_active, created_at, updated_at
- **Purpose**: Store all branch locations
- **Relations**: Belongs to city and area, many-to-many with game types and amenities

### 6. **admin_branch_game_types** (Junction Table)
- **Fields**: id, branch_id (FK), game_type_id (FK), created_at
- **Purpose**: Link branches with their game types

### 7. **admin_branch_amenities** (Junction Table)
- **Fields**: id, branch_id (FK), amenity_id (FK), created_at
- **Purpose**: Link branches with their amenities

## Backend Implementation

### Controllers Created
1. **cityController.js** - CRUD for cities
2. **areaController.js** - CRUD for areas with city filtering
3. **gameTypeController.js** - CRUD for game types with icon upload
4. **amenityController.js** - CRUD for amenities with icon upload
5. **branchController.js** - CRUD for branches with image uploads and junction table management

### Routes Created
1. **cityRoutes.js** - `/api/cities`
2. **areaRoutes.js** - `/api/areas` and `/api/areas/city/:cityId`
3. **gameTypeRoutes.js** - `/api/game-types`
4. **amenityRoutes.js** - `/api/amenities`
5. **branchRoutes.js** - `/api/branches` and `/api/branches/city/:cityId`

### File Upload Support
- **Game Types**: Single icon upload to `game-type-icons` bucket
- **Amenities**: Single icon upload to `amenity-icons` bucket
- **Branches**: Multiple images (up to 5) to `branch-images` bucket

## Frontend Implementation

### API Service (`adminApi.js`)
Centralized API service with functions for all entities:
- `citiesApi`: getAll, getById, create, update, delete
- `areasApi`: getAll, getByCity, getById create, update, delete
- `gameTypesApi`: getAll, getById, create, update, delete
- `amenitiesApi`: getAll, getById, create, update, delete
- `branchesApi`: getAll, getByCity, getById, create, update, delete

### Updated Forms
1. **AddGameTypeForm.jsx** ✅
   - Integrated with backend API
   - Handles icon file upload
   - Shows loading and error states
   - Refreshes list after successful creation

2. **AddAmenityForm.jsx** ✅
   - Integrated with backend API
   - Handles icon file upload
   - Shows loading and error states
   - Refreshes list after successful creation

3. **GameTypesSettings.jsx** ✅
   - Fetches data from API on mount
   - Displays loading state
   - Shows error messages
   - Uses database field names (short_code, icon_url, is_active)

### Forms Still To Update
1. **AmenitiesSettings.jsx** - Needs API integration
2. **BranchesSettings.jsx** - Needs to fetch cities, areas, game types, amenities from API
3. **AddCourtForm.jsx** - Needs to fetch branches and game types from API
4. **Create City/Area Management Forms** - Need to create UI for managing cities and areas

## Data Flow Example

### Adding a Game Type:
1. User fills form in `AddGameTypeForm.jsx`
2. Form submits FormData to `gameTypesApi.create()`
3. API posts to `/api/game-types` with multipart form data
4. `gameTypeController.createGameType()` handles the request:
   - Uploads icon to Supabase Storage if provided
   - Inserts record into `admin_game_types` table
   - Returns created record
5. Frontend refreshes the list by calling `fetchGameTypes()`
6. Updated list displays in `GameTypesSettings.jsx`

### Adding a Branch:
1. User fills form in `BranchesSettings.jsx` including:
   - City selection (fetched from `/api/cities`)
   - Area selection (filtered by selected city from `/api/areas/city/:cityId`)
   - Game types (multi-select from `/api/game-types`)
   - Amenities (multi-select from `/api/amenities`)
   - Images, hours, etc.
2. Form submits FormData to `branchesApi.create()`
3. `branchController.createBranch()` handles:
   - Uploads all images to Supabase Storage
   - Creates branch record
   - Creates junction table entries for game types
   - Creates junction table entries for amenities
4. Returns complete branch with relations populated

## Next Steps

### 1. Run SQL Migration
```sql
-- Run this in Supabase SQL Editor:
-- File: migrations/002_create_admin_tables.sql
```

### 2. Update Remaining Forms
- **AmentiesSettings.jsx**: Add API integration similar to GameTypesSettings
- **BranchesSettings**: Update to fetch real data from API
- **Create CitiesSettings.jsx** and **AreasSettings.jsx** components

### 3. Testing Checklist
- [ ] Create cities via API
- [ ] Create areas for each city
- [ ] Create game types with icons
- [ ] Create amenities with icons
- [ ] Create branches with all relations
- [ ] Verify areas filter by city
- [ ] Verify branches show correct city/area
- [ ] Verify branches show linked game types and amenities

## API Endpoints Reference

### Cities
- `GET /api/cities` - Get all cities
- `GET /api/cities/:id` - Get single city
- `POST /api/cities` - Create city
- `PUT /api/cities/:id` - Update city
- `DELETE /api/cities/:id` - Delete city

### Areas
- `GET /api/areas` - Get all areas
- `GET /api/areas/city/:cityId` - Get areas by city
- `GET /api/areas/:id` - Get single area
- `POST /api/areas` - Create area
- `PUT /api/areas/:id` - Update area
- `DELETE /api/areas/:id` - Delete area

### Game Types
- `GET /api/game-types` - Get all game types
- `GET /api/game-types/:id` - Get single game type
- `POST /api/game-types` - Create game type (multipart/form-data)
- `PUT /api/game-types/:id` - Update game type (multipart/form-data)
- `DELETE /api/game-types/:id` - Delete game type

### Amenities
- `GET /api/amenities` - Get all amenities
- `GET /api/amenities/:id` - Get single amenity
- `POST /api/amenities` - Create amenity (multipart/form-data)
- `PUT /api/amenities/:id` - Update amenity (multipart/form-data)
- `DELETE /api/amenities/:id` - Delete amenity

### Branches
- `GET /api/branches` - Get all branches with relations
- `GET /api/branches/city/:cityId` - Get branches by city
- `GET /api/branches/:id` - Get single branch with relations
- `POST /api/branches` - Create branch (multipart/form-data)
- `PUT /api/branches/:id` - Update branch (multipart/form-data)
- `DELETE /api/branches/:id` - Delete branch

## Important Notes

1. **Field Names**: Database uses snake_case (e.g., `short_code`, `is_active`, `icon_url`)
2. **File Uploads**: Use FormData for all file uploads
3. **Relations**: Branch endpoints return populated relations (city, area, game_types, amenities)
4. **Storage Buckets**: Auto-created on first upload: `game-type-icons`, `amenity-icons`, `branch-images`
5. **RLS Policies**: Public read, authenticated write (modify as needed for production)
