# District Integration: Technical Hand-off Pack

This document contains all the essential details for integrating the District platform with MyRush.

## 1. Environment Details
- **Staging Base URL**: `https://api-staging.myrush.in`
- **Interactive API Docs (Swagger)**: `https://api-staging.myrush.in/docs`
- **Postman Collection**: [District_API_Postman_Collection.json](file:///c:/Users/ajayp/.gemini/antigravity/brain/09ed4f90-0b99-49dc-96d4-8143147e32ef/District_API_Postman_Collection.json)

## 2. Authentication (Staging & Launch)
These credentials must be passed as query parameters (`GET`) or form-data/JSON (`POST`) for every request.
- **Partner ID (`id`)**: `dist_2a380850`
- **API Key (`apiKey`)**: `mr_sk_0eb6c8782604c08b5c0a396ce7c849ac`

## 3. Recommended Testing Data
Use these exact strings for your initial tests to ensure mapping success.
- **Facility Name**: `Rush Arena - Kasavanahalli`
- **Sport Name**: `Boxcricket` (or `FootBall`)
- **Sample Date**: `20-03-2026` (Format: `DD-MM-YYYY`)

## 4. Key Integration Rules
1. **Slot Resolution**: We support **30-minute** increments. 
2. **Minimum Duration**: Every booking MUST be at least **1 hour** (i.e., you must send exactly 2 consecutive 30-min slots in the `makeBatchBooking` payload).
3. **Time Format**: All availability responses use **24-hour ISO format** (e.g., `14:30`).
4. **Endpoint Mappings**:
   - **Check Availability**: `GET /api/checkAvailability/`
   - **Create Booking**: `POST /api/makeBatchBooking`
   - **Cancel Booking**: `POST /api/cancelBooking/`
   - **Discovery (Facilities)**: `GET /api/facilities`

## 5. Contact & Support
- **Technical Lead**: Ajay (ajaypamarthi8@gmail.com)
- **Status Page**: [staging.myrush.in](https://staging.myrush.in)
