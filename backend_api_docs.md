# MyRush Admin API Documentation: Courts & Bookings

This document provides a technical overview of the primary administrative APIs for managing sports courts and user bookings within the MyRush platform.

---

## 1. Courts Module (`/admin/courts`)

The Courts module handles the definition, pricing, and availability of physical playing areas.

### **Core Logic Types**
- **Source File**: `unified-backend/routers/admin/courts.py`
- **Independent**: The court is a single standalone unit.
- **Divisible**: The court can be partitioned into multiple zones (e.g., a full-size football turf that can be split into three 5-a-side pitches).

### **Pricing & Availability Logic**
- **Price Conditions**:
  - **Recurring**: Time-based pricing that repeats on specific days of the week.
  - **Date-Specific**: Overrides for specific calendar dates (holidays, special events).
- **Global Price Conditions**: System-wide defaults that are automatically synced to new or updated courts.
- **Unavailability Slots**: Manual blocks for maintenance or internal use that prevent any public bookings.
- **Sport Slices**: Support for multi-sport shared turfs, allowing different sports to occupy the same physical space with varying capacities and masks.

### **Key API Endpoints**
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/admin/courts` | List all courts with pagination, search, and branch-level filtering. |
| **GET** | `/admin/courts/{id}` | Retrieve full details for a single court, including media URLs. |
| **POST** | `/admin/courts` | Create a new court. Supports multipart/form-data for image and video uploads to S3. |
| **PUT** | `/admin/courts/{id}` | Update existing court metadata, pricing rules, or media assets. |
| **PATCH** | `/admin/courts/{id}/toggle` | Enable or disable a court (affects public visibility and inventory status). |
| **DELETE** | `/admin/courts/{id}` | Permanently remove a court (blocked if active bookings or tournament associations exist). |
| **POST** | `/admin/courts/bulk-update-slots` | Mass update pricing for specific time slots across multiple dates and branches. |

---

## 2. Bookings Module (`/admin/bookings`)

The Bookings module manages the entire lifecycle of a reservation and its financial/inventory implications.

### **Operational Logic**
- **Source File**: `unified-backend/routers/admin/bookings.py`
- **Automated Duration**: Calculates booking length from start/end times or provided duration minutes.
- **Coupon Engine**: Validates discount codes against expiry dates, usage counts, per-user limits, and specific user white-lists.
- **Inventory Sync**: Integrated with the `IntegrationOrchestrator` to notify third-party partners (like Playo) of inventory changes in real-time.

### **Booking Statuses**
- **Pending**: Initial state; inventory is blocked but payment/confirmation is awaited.
- **Confirmed**: Successfully booked slot; inventory is permanently blocked for the duration.
- **Cancelled**: Releases the inventory slot back to the public pool and notifies partners.

### **Key API Endpoints**
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/admin/bookings` | Create a manual booking (for walk-ins or admin-assisted reservations). |
| **GET** | `/admin/bookings` | Advanced search for bookings. Filter by date, branch, court, city, and status. |
| **GET** | `/admin/bookings/{id}` | Fetch granular booking details, including customer info and payment breakdown. |
| **PUT** | `/admin/bookings/{id}` | Modify an existing booking (e.g., reschedule or change participant count). |
| **PATCH** | `/admin/bookings/{id}/status` | Update booking lifecycle status (confirmed, cancelled, etc.). |
| **PATCH** | `/admin/bookings/{id}/payment-status` | Record manual payment updates (pending, paid, failed). |
| **DELETE** | `/admin/bookings/{id}` | Remove a booking and immediately release the associated inventory slots. |

---

## 3. Global Security & RBAC

- **Permission Checking**: Every endpoint is gated by a `PermissionChecker` middleware that validates the sub-admin's assigned role privileges (`view`, `add`, `edit`, `delete`).
- **Data Isolation**: The `get_admin_branch_filter` dependency ensures that sub-admins only interact with entries belonging to their assigned branches, preventing cross-branch data leaks.
