# Database Management & Structure Guide

This document provides a comprehensive overview of the Myrush database architecture, hosted on Supabase (PostgreSQL), and how the various components interact.

## 🔗 Connection Information

*   **Host**: `db.vqglejkydwtopmllymuf.supabase.co`
*   **Port**: `5432`
*   **Database**: `MYRUSH`
*   **ORM**: SQLAlchemy 2.0 (Python)
*   **Pooling**: Connection pooling is enabled with a `pool_size` of 5 and `max_overflow` of 10 for optimal performance.

> [!IMPORTANT]
> Always ensure your current IP is whitelisted in the Supabase Dashboard "Network Restrictions" to avoid "Connection Timed Out" errors.

---

## 🏗️ Core Table Structure

### 1. Venue & Infrastructure
The hierarchy follows: **City → Area → Branch (Venue) → Court**.

| Table Name | Description | Key Relationships |
| :--- | :--- | :--- |
| `admin_cities` | Major cities (e.g., Bangalore). | Has many Areas & Branches. |
| `admin_areas` | Localities within a city (e.g., Indiranagar). | Belongs to City. |
| `admin_branches` | The physical Venues. Contains opening hours and images. | Links to City/Area. Has many Courts. |
| `admin_courts` | Individual bookable slots (Cricket Net 1, Turf A). | Belongs to Branch. Links to GameType. |
| `admin_game_types` | The sports offered (Cricket, Football, Swimming). | M2M with Branches. |

### 2. User & Authentication
| Table Name | Description | Key Relationships |
| :--- | :--- | :--- |
| `users` | Core user account with phone/email. | Has one Profile. Has many Bookings. |
| `profiles` | Extended user data (stats, gender, handedness). | Belongs to User. |
| `admins` | Dashboard managers. | Links to Role. M2M with Branches for access. |
| `admin_roles` | Permissions JSON for RBAC. | Linked to Admin. |

### 3. Booking & Pricing Logic
| Table Name | Description | Logic |
| :--- | :--- | :--- |
| `booking` | The central source of truth for all reservations. | Stores `time_slots` as JSONB for multi-hour support. |
| `admin_global_price_conditions` | Bulk pricing rules (Weekend peaks, early bird). | Checked dynamically during slot generation. |
| `admin_coupons` | Discount codes and usage limits. | Linked to Booking. |

---

## 🔄 Key Business Logic Workflows

### 🏛️ Court Sharing (Shared Groups)
When a single physical space can be booked for multiple sports (e.g., a Turf that can be 1 Football field OR 3 Cricket nets):
-   `admin_shared_groups` links the related courts.
-   When "Court A" is booked, the system checks the `shared_group_id` and automatically blocks "Court B" and "Court C" for those overlapping times.

### 💰 Dynamic Pricing Hierarchy
When the frontend asks for available slots, the backend checks prices in this priority order:
1.  **Date-Specific Overrides**: (`admin_courts.price_conditions`) - Highest priority.
2.  **Global Price Rules**: (`admin_global_price_conditions`) - Mid priority.
3.  **Base Price**: (`admin_courts.price_per_hour`) - Fallback.

### 🚫 Slot Blocking
Slots are blocked via the `unavailability_slots` JSON field in the `admin_courts` table. 
-   **Structure**: `{ "dates": ["2024-03-20"], "times": ["06:00", "07:00"] }`
-   The **Bulk Block** feature I added updates this field across multiple courts simultaneously.

---

## 🛠️ Management & Maintenance

### Seed Scripts
Located in `unified-backend/`:
-   `seed_data.py`: Resets and seeds basic structure (Cities, Areas).
-   `seed_district_partner.py`: Sets up API credentials for partners.

### Database Migrations
We use a **Code-First** approach with SQLAlchemy. 
-   To add a column: Update `models.py`.
-   Restarting the FastAPI server with `Base.metadata.create_all(bind=engine)` will create new tables (but won't update existing columns automatically).

> [!TIP]
> For complex migrations, use **Alembic** (if installed) or manual SQL scripts in the Supabase SQL Editor.
