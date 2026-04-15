# Database Schema & Table Structure

This document contains the detailed database schema along with table relationships (links), automatically extracted from the SQLAlchemy `models.py`.

## Table: `admin_roles`

**Model Class**: `Role`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `name` | `String` | - |
| `permissions` | `JSONB` | - |
| `is_active` | `Boolean` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |

### ORM Relationships
| Relationship | Target Model |
| :--- | :--- |
| `admins` | `Admin` |

---

## Table: `admin_branch_access`

**Model Class**: `AdminBranchAccess`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `admin_id` | `ForeignKey` | - |
| `branch_id` | `ForeignKey` | - |
| `created_at` | `TIMESTAMP` | - |

---

## Table: `admins`

**Model Class**: `Admin`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `name` | `String` | - |
| `mobile` | `String` | - |
| `password_hash` | `String` | - |
| `role` | `String` | - |
| `role_id` | `ForeignKey` | - |
| `branch_id` | `ForeignKey` | - |
| `email` | `String` | - |
| `must_change_password` | `Boolean` | - |
| `created_at` | `TIMESTAMP` | - |

### ORM Relationships
| Relationship | Target Model |
| :--- | :--- |
| `branch` | `Branch` |
| `accessible_branches` | `Branch` |
| `role_rel` | `Role` |

---

## Table: `admin_global_price_conditions`

**Model Class**: `GlobalPriceCondition`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `days` | `ARRAY` | - |
| `dates` | `ARRAY` | - |
| `slot_from` | `String` | - |
| `slot_to` | `String` | - |
| `price` | `DECIMAL` | - |
| `condition_type` | `String` | - |
| `is_active` | `Boolean` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |

---

## Table: `admin_cities`

**Model Class**: `City`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `name` | `String` | - |
| `short_code` | `String` | - |
| `is_active` | `Boolean` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |

### ORM Relationships
| Relationship | Target Model |
| :--- | :--- |
| `areas` | `Area` |
| `branches` | `Branch` |

---

## Table: `admin_areas`

**Model Class**: `Area`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `city_id` | `ForeignKey` | - |
| `name` | `String` | - |
| `is_active` | `Boolean` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |

### ORM Relationships
| Relationship | Target Model |
| :--- | :--- |
| `city` | `City` |
| `branches` | `Branch` |

---

## Table: `admin_game_types`

**Model Class**: `GameType`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `name` | `String` | - |
| `short_code` | `String` | - |
| `description` | `Text` | - |
| `icon` | `String` | - |
| `icon_url` | `Text` | - |
| `is_active` | `Boolean` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |

---

## Table: `admin_facility_types`

**Model Class**: `FacilityType`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `name` | `String` | - |
| `short_code` | `String` | - |
| `is_active` | `Boolean` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |

---

## Table: `admin_shared_groups`

**Model Class**: `SharedGroup`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `branch_id` | `ForeignKey` | - |
| `name` | `String` | - |
| `created_at` | `TIMESTAMP` | - |

### ORM Relationships
| Relationship | Target Model |
| :--- | :--- |
| `branch` | `Branch` |
| `courts` | `Court` |

---

## Table: `admin_amenities`

**Model Class**: `Amenity`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `name` | `String` | - |
| `description` | `Text` | - |
| `icon` | `String` | - |
| `icon_url` | `Text` | - |
| `is_active` | `Boolean` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |

---

## Table: `admin_branches`

**Model Class**: `Branch`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `city_id` | `ForeignKey` | - |
| `area_id` | `ForeignKey` | - |
| `name` | `String` | - |
| `address_line1` | `String` | - |
| `address_line2` | `String` | - |
| `landmark` | `String` | - |
| `search_location` | `Text` | - |
| `ground_overview` | `Text` | - |
| `terms_condition` | `Text` | - |
| `rule` | `Text` | - |
| `google_map_url` | `Text` | - |
| `location_url` | `Text` | - |
| `price` | `DECIMAL` | - |
| `max_players` | `Integer` | - |
| `phone_number` | `String` | - |
| `email` | `String` | - |
| `ground_type` | `String` | - |
| `images` | `ARRAY` | - |
| `videos` | `ARRAY` | - |
| `opening_hours` | `JSONB` | - |
| `latitude` | `DECIMAL` | - |
| `longitude` | `DECIMAL` | - |
| `is_active` | `Boolean` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |

### ORM Relationships
| Relationship | Target Model |
| :--- | :--- |
| `city` | `City` |
| `area` | `Area` |
| `courts` | `Court` |
| `game_types` | `GameType` |
| `amenities` | `Amenity` |

---

## Table: `admin_branch_game_types`

**Model Class**: `BranchGameType`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `branch_id` | `ForeignKey` | - |
| `game_type_id` | `ForeignKey` | - |
| `created_at` | `TIMESTAMP` | - |

---

## Table: `admin_branch_amenities`

**Model Class**: `BranchAmenity`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `branch_id` | `ForeignKey` | - |
| `amenity_id` | `ForeignKey` | - |
| `created_at` | `TIMESTAMP` | - |

---

## Table: `admin_courts`

**Model Class**: `Court`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `branch_id` | `ForeignKey` | - |
| `game_type_id` | `ForeignKey` | - |
| `facility_type_id` | `ForeignKey` | - |
| `name` | `String` | - |
| `logic_type` | `String` | - |
| `shared_group_id` | `ForeignKey` | - |
| `capacity_limit` | `Integer` | - |
| `price_per_hour` | `DECIMAL` | - |
| `price_overrides` | `JSONB` | - |
| `price_conditions` | `JSONB` | - |
| `unavailability_slots` | `JSONB` | - |
| `images` | `ARRAY` | - |
| `videos` | `ARRAY` | - |
| `terms_and_conditions` | `Text` | - |
| `amenities` | `ARRAY` | - |
| `is_active` | `Boolean` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |

### ORM Relationships
| Relationship | Target Model |
| :--- | :--- |
| `branch` | `Branch` |
| `game_type` | `GameType` |
| `facility_type` | `FacilityType` |
| `shared_group` | `SharedGroup` |
| `units` | `CourtUnit` |
| `division_modes` | `DivisionMode` |
| `rental_items` | `RentalItem` |

---

## Table: `admin_court_units`

**Model Class**: `CourtUnit`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `court_id` | `ForeignKey` | - |
| `name` | `String` | - |

### ORM Relationships
| Relationship | Target Model |
| :--- | :--- |
| `court` | `Court` |

---

## Table: `admin_division_modes`

**Model Class**: `DivisionMode`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `court_id` | `ForeignKey` | - |
| `name` | `String` | - |

### ORM Relationships
| Relationship | Target Model |
| :--- | :--- |
| `court` | `Court` |
| `units` | `CourtUnit` |

---

## Table: `admin_division_mode_units`

**Model Class**: `DivisionModeUnit`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `mode_id` | `ForeignKey` | - |
| `unit_id` | `ForeignKey` | - |

---

## Table: `admin_court_rental_items`

**Model Class**: `CourtRentalItem`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `court_id` | `ForeignKey` | - |
| `rental_item_id` | `ForeignKey` | - |

---

## Table: `admin_rental_items`

**Model Class**: `RentalItem`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `branch_id` | `ForeignKey` | - |
| `name` | `String` | - |
| `price_per_booking` | `DECIMAL` | - |
| `is_active` | `Boolean` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |

---

## Table: `admin_coupons`

**Model Class**: `Coupon`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `code` | `String` | - |
| `description` | `Text` | - |
| `discount_type` | `String` | - |
| `discount_value` | `DECIMAL` | - |
| `min_order_value` | `DECIMAL` | - |
| `max_discount` | `DECIMAL` | - |
| `start_date` | `TIMESTAMP` | - |
| `end_date` | `TIMESTAMP` | - |
| `usage_limit` | `Integer` | - |
| `per_user_limit` | `Integer` | - |
| `usage_count` | `Integer` | - |
| `applicable_type` | `String` | - |
| `applicable_ids` | `ARRAY` | - |
| `terms_condition` | `Text` | - |
| `is_active` | `Boolean` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |

### ORM Relationships
| Relationship | Target Model |
| :--- | :--- |
| `bookings` | `Booking` |

---

## Table: `adminvenues`

**Model Class**: `AdminVenue`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `game_type` | `String` | - |
| `court_name` | `String` | - |
| `location` | `Text` | - |
| `prices` | `String` | - |
| `description` | `Text` | - |
| `photos` | `ARRAY` | - |
| `videos` | `ARRAY` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |

---

## Table: `admin_cancellations_terms`

**Model Class**: `AdminPolicy`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `type` | `String` | - |
| `name` | `String` | - |
| `value` | `String` | - |
| `content` | `Text` | - |
| `is_active` | `Boolean` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |

---

## Table: `admin_faqs`

**Model Class**: `FAQ`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `question` | `Text` | - |
| `answer` | `Text` | - |
| `is_active` | `Boolean` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |

---

## Table: `admin_cms_pages`

**Model Class**: `CMSPage`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `title` | `String` | - |
| `slug` | `String` | - |
| `content` | `Text` | - |
| `is_active` | `Boolean` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |

---

## Table: `admin_site_settings`

**Model Class**: `SiteSetting`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `site_logo` | `String` | - |
| `company_name` | `String` | - |
| `email` | `String` | - |
| `contact_number` | `String` | - |
| `address` | `Text` | - |
| `copyright_text` | `String` | - |
| `instagram_url` | `String` | - |
| `youtube_url` | `String` | - |
| `linkedin_url` | `String` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |

---

## Table: `users`

**Model Class**: `User`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `phone_number` | `String` | - |
| `country_code` | `String` | - |
| `email` | `String` | - |
| `password_hash` | `String` | - |
| `full_name` | `String` | - |
| `first_name` | `String` | - |
| `last_name` | `String` | - |
| `avatar_url` | `Text` | - |
| `gender` | `String` | - |
| `age` | `Integer` | - |
| `city` | `String` | - |
| `skill_level` | `String` | - |
| `playing_style` | `String` | - |
| `handedness` | `String` | - |
| `favorite_sports` | `ARRAY` | - |
| `profile_completed` | `Boolean` | - |
| `is_verified` | `Boolean` | - |
| `is_active` | `Boolean` | - |
| `last_login_at` | `TIMESTAMP` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |

### ORM Relationships
| Relationship | Target Model |
| :--- | :--- |
| `profile` | `Profile` |
| `bookings` | `Booking` |
| `reviews` | `Review` |
| `tournaments` | `Tournament` |
| `tournament_participations` | `TournamentParticipant` |

---

## Table: `profiles`

**Model Class**: `Profile`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `ForeignKey` | - |
| `phone_number` | `String` | - |
| `full_name` | `String` | - |
| `age` | `Integer` | - |
| `city` | `String` | - |
| `gender` | `String` | - |
| `handedness` | `String` | - |
| `skill_level` | `String` | - |
| `sports` | `JSON` | - |
| `playing_style` | `String` | - |
| `games_played` | `Integer` | - |
| `mvp_count` | `Integer` | - |
| `reliability_score` | `Integer` | - |
| `rating` | `DECIMAL` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |

### ORM Relationships
| Relationship | Target Model |
| :--- | :--- |
| `user` | `User` |

---

## Table: `otp_verifications`

**Model Class**: `OtpVerification`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `Integer` | - |
| `phone_number` | `String` | - |
| `otp_code` | `String` | - |
| `country_code` | `String` | - |
| `is_verified` | `Boolean` | - |
| `attempts` | `Integer` | - |
| `max_attempts` | `Integer` | - |
| `expires_at` | `TIMESTAMP` | - |
| `verified_at` | `TIMESTAMP` | - |
| `ip_address` | `String` | - |
| `user_agent` | `Text` | - |
| `created_at` | `TIMESTAMP` | - |

---

## Table: `booking`

**Model Class**: `Booking`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `user_id` | `ForeignKey` | - |
| `court_id` | `UUID` | - |
| `booking_date` | `Date` | - |
| `time_slots` | `JSON` | - |
| `total_duration_minutes` | `Integer` | - |
| `original_amount` | `DECIMAL` | - |
| `discount_amount` | `DECIMAL` | - |
| `coupon_code` | `String` | - |
| `booking_display_id` | `String` | - |
| `start_time` | `Time` | - |
| `end_time` | `Time` | - |
| `duration_minutes` | `Integer` | - |
| `price_per_hour` | `DECIMAL` | - |
| `original_price_per_hour` | `DECIMAL` | - |
| `coupon_discount` | `DECIMAL` | - |
| `_old_start_time` | `Time` | - |
| `_old_end_time` | `Time` | - |
| `_old_duration_minutes` | `Integer` | - |
| `_old_price_per_hour` | `DECIMAL` | - |
| `total_amount` | `DECIMAL` | - |
| `number_of_players` | `Integer` | - |
| `team_name` | `String` | - |
| `special_requests` | `Text` | - |
| `admin_notes` | `Text` | - |
| `status` | `String` | - |
| `payment_status` | `String` | - |
| `payment_id` | `String` | - |
| `razorpay_order_id` | `String` | - |
| `razorpay_signature` | `String` | - |
| `coupon_id` | `ForeignKey` | - |
| `playo_order_id` | `String` | - |
| `playo_booking_id` | `String` | - |
| `booking_source` | `String` | - |
| `division_mode_id` | `ForeignKey` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |

### ORM Relationships
| Relationship | Target Model |
| :--- | :--- |
| `user` | `User` |
| `coupon` | `Coupon` |

---

## Table: `reviews`

**Model Class**: `Review`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `court_id` | `UUID` | - |
| `user_id` | `ForeignKey` | - |
| `booking_id` | `ForeignKey` | - |
| `rating` | `Integer` | - |
| `review_text` | `Text` | - |
| `is_active` | `Boolean` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |

### ORM Relationships
| Relationship | Target Model |
| :--- | :--- |
| `user` | `User` |

---

## Table: `tournaments`

**Model Class**: `Tournament`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `user_id` | `ForeignKey` | - |
| `name` | `String` | - |
| `sport` | `String` | - |
| `visibility` | `String` | - |
| `start_date` | `Date` | - |
| `end_date` | `Date` | - |
| `start_time` | `Time` | - |
| `end_time` | `Time` | - |
| `branch_name` | `String` | - |
| `court_id` | `String` | - |
| `format` | `String` | - |
| `rules` | `Text` | - |
| `entry_fee` | `DECIMAL` | - |
| `status` | `String` | - |
| `max_participants` | `Integer` | - |
| `current_participants` | `Integer` | - |
| `description` | `Text` | - |
| `prize_info` | `Text` | - |
| `contact_info` | `Text` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |
| `published_at` | `TIMESTAMP` | - |

### ORM Relationships
| Relationship | Target Model |
| :--- | :--- |
| `user` | `User` |
| `participants` | `TournamentParticipant` |

---

## Table: `tournament_participants`

**Model Class**: `TournamentParticipant`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `tournament_id` | `ForeignKey` | - |
| `user_id` | `ForeignKey` | - |
| `registration_date` | `TIMESTAMP` | - |
| `status` | `String` | - |
| `team_name` | `String` | - |
| `seed_number` | `Integer` | - |
| `payment_status` | `String` | - |
| `payment_amount` | `DECIMAL` | - |
| `payment_id` | `String` | - |
| `notes` | `Text` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |

### ORM Relationships
| Relationship | Target Model |
| :--- | :--- |
| `tournament` | `Tournament` |
| `user` | `User` |

---

## Table: `push_tokens`

**Model Class**: `PushToken`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `user_id` | `ForeignKey` | - |
| `device_token` | `Text` | - |
| `device_type` | `String` | - |
| `device_info` | `JSON` | - |
| `is_active` | `Boolean` | - |
| `last_used_at` | `TIMESTAMP` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |

### ORM Relationships
| Relationship | Target Model |
| :--- | :--- |
| `user` | `User` |

---

## Table: `playo_api_keys`

**Model Class**: `PlayoAPIKey`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `token_hash` | `String` | - |
| `description` | `String` | - |
| `is_active` | `Boolean` | - |
| `created_at` | `TIMESTAMP` | - |
| `last_used_at` | `TIMESTAMP` | - |

---

## Table: `playo_orders`

**Model Class**: `PlayoOrder`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `playo_order_id` | `String` | - |
| `venue_id` | `ForeignKey` | - |
| `court_id` | `ForeignKey` | - |
| `booking_date` | `Date` | - |
| `start_time` | `Time` | - |
| `end_time` | `Time` | - |
| `price` | `DECIMAL` | - |
| `status` | `String` | - |
| `booking_id` | `ForeignKey` | - |
| `created_at` | `TIMESTAMP` | - |
| `expires_at` | `TIMESTAMP` | - |
| `user_name` | `String` | - |
| `user_mobile` | `String` | - |
| `user_email` | `String` | - |

### ORM Relationships
| Relationship | Target Model |
| :--- | :--- |
| `venue` | `Branch` |
| `court` | `Court` |
| `booking` | `Booking` |

---

## Table: `user_favorite_courts`

**Model Class**: `UserFavoriteCourt`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `user_id` | `ForeignKey` | - |
| `court_id` | `ForeignKey` | - |
| `created_at` | `TIMESTAMP` | - |

### ORM Relationships
| Relationship | Target Model |
| :--- | :--- |
| `user` | `User` |
| `court` | `Court` |

---

## Table: `user_payment_methods`

**Model Class**: `PaymentMethod`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `user_id` | `ForeignKey` | - |
| `type` | `String` | - |
| `provider` | `String` | - |
| `details` | `JSONB` | - |
| `is_default` | `Boolean` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |

### ORM Relationships
| Relationship | Target Model |
| :--- | :--- |
| `user` | `User` |

---

## Table: `integration_partners`

**Model Class**: `Partner`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `name` | `String` | - |
| `unique_id` | `String` | - |
| `api_key_hash` | `String` | - |
| `webhook_url` | `Text` | - |
| `is_active` | `Boolean` | - |
| `created_at` | `TIMESTAMP` | - |
| `updated_at` | `TIMESTAMP` | - |

---

## Table: `integration_idempotency_keys`

**Model Class**: `IdempotencyKey`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `partner_id` | `ForeignKey` | - |
| `idempotency_key` | `String` | - |
| `endpoint` | `String` | - |
| `response_status` | `Integer` | - |
| `response_body` | `JSONB` | - |
| `created_at` | `TIMESTAMP` | - |

### ORM Relationships
| Relationship | Target Model |
| :--- | :--- |
| `partner` | `Partner` |

---

## Table: `integration_logs`

**Model Class**: `IntegrationLog`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `partner_id` | `ForeignKey` | - |
| `direction` | `String` | - |
| `endpoint` | `String` | - |
| `method` | `String` | - |
| `request_payload` | `JSONB` | - |
| `response_status` | `Integer` | - |
| `response_payload` | `JSONB` | - |
| `error_message` | `Text` | - |
| `created_at` | `TIMESTAMP` | - |

---

## Table: `integration_outbox_events`

**Model Class**: `OutboxEvent`

### Columns
| Column Name | Data Type | Foreign Key (Link) |
| :--- | :--- | :--- |
| `id` | `UUID` | - |
| `partner_id` | `ForeignKey` | - |
| `event_type` | `String` | - |
| `payload` | `JSONB` | - |
| `status` | `String` | - |
| `attempts` | `Integer` | - |
| `max_attempts` | `Integer` | - |
| `last_attempt_at` | `TIMESTAMP` | - |
| `next_attempt_at` | `TIMESTAMP` | - |
| `created_at` | `TIMESTAMP` | - |

### ORM Relationships
| Relationship | Target Model |
| :--- | :--- |
| `partner` | `Partner` |

---

