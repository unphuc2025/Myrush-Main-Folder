# Myrush Database Entity-Relationship Diagram (ERD)

This document provides a visual representation of the core data model and how the tables interact.

## Core Hierarchy & Booking Flow

```mermaid
erDiagram
    %% Core Infrastructure
    City ||--o{ Area : "contains"
    City ||--o{ Branch : "has_venues"
    Area ||--o{ Branch : "has_venues"

    Branch ||--o{ Court : "contains"
    Branch }|--|{ GameType : "offers_sports"
    Branch }|--|{ Amenity : "provides"

    %% Court Specifics
    Court }o--|| GameType : "is_type_of"
    Court }o--|| FacilityType : "is_type_of"
    Court }o--o| SharedGroup : "linked_to (for turf sharing)"
    Court ||--o{ CourtUnit : "divided_into (A, B, C)"
    Court ||--o{ DivisionMode : "can_be_booked_as (6-a-side)"
    DivisionMode }|--|{ CourtUnit : "uses"

    %% Users & Auth
    User ||--|| Profile : "extended_data"
    User ||--o{ Booking : "creates"
    User ||--o{ Review : "writes"
    User ||--o{ Tournament : "organizes"
    User ||--o{ TournamentParticipant : "joins"
    User ||--o{ PaymentMethod : "saves"

    %% Bookings & Transactions
    Booking }o--|| Court : "reserves_slots"
    Booking }o--o| Coupon : "applies_discount"
    Booking ||--o| Review : "receives"
    Booking ||--o| PlayoOrder : "originates_from"

    %% Tournaments
    Tournament ||--o{ TournamentParticipant : "has_players"

    %% Admins
    Admin }o--o| Role : "has_permissions"
    Admin }|--|{ Branch : "manages"
```

## Partner Integrations & Extensions

```mermaid
erDiagram
    %% Partners (District, Playo API)
    Partner ||--o{ IdempotencyKey : "prevents_duplicates"
    Partner ||--o{ IntegrationLog : "audits_requests"
    Partner ||--o{ OutboxEvent : "receives_webhooks"

    %% Playo Direct Orders
    Branch ||--o{ PlayoOrder : "receives"
    Court ||--o{ PlayoOrder : "receives"
```

## Attribute Definitions (Key Tables)

```mermaid
erDiagram
    User {
        UUID id PK
        String phone_number UK
        String email UK
        String password_hash
        String full_name
        Boolean is_verified
    }

    Profile {
        UUID id PK "FK to User"
        Integer games_played
        Integer reliability_score
        Decimal rating
        JSON sports_interests
    }

    Booking {
        UUID id PK
        UUID user_id FK
        UUID court_id FK
        Date booking_date
        JSON time_slots "Stores the half-hour chunks"
        Decimal total_amount
        String status
        String payment_status
    }

    Court {
        UUID id PK
        UUID branch_id FK
        String name
        String logic_type "independent, shared, divisible"
        Decimal price_per_hour
        JSON unavailability_slots "Blocked out times"
        JSON price_conditions "Surge/Discount rules"
    }

    Branch {
        UUID id PK
        String name
        String address_line1
        JSON opening_hours
        Decimal latitude
        Decimal longitude
    }
```

## 4. Court Sharing & Overlaps Architecture

```mermaid
erDiagram
    %% The different logic flows
    Court {
        UUID id PK
        String logic_type "independent | shared | divisible | capacity"
        Integer capacity_limit "Used if logic_type=capacity"
    }

    Booking {
        UUID id PK
        UUID court_id FK
        JSON time_slots "Stores the actual reserved times"
        UUID division_mode_id FK "Used ONLY if logic_type=divisible"
    }

    SharedGroup {
        UUID id PK
        String name "e.g., Main Turf Group"
    }

    CourtUnit {
        UUID id PK
        String name "e.g., A, B, C, D"
    }

    DivisionMode {
        UUID id PK
        String name "e.g., 6-a-side, 11-a-side"
    }

    Court }o--o| SharedGroup : "Belongs to (If logic=shared)"
    Court ||--o{ CourtUnit : "Divided into (If logic=divisible)"
    Court ||--o{ DivisionMode : "Can be booked as (If logic=divisible)"
    
    DivisionMode }|--|{ CourtUnit : "Comprises (e.g., A+B)"
    
    Booking }o--|| Court : "Reserves"
    Booking }o--o| DivisionMode : "Selects Configuration"
```
