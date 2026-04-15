# API Audit Results

**Summary:** Total: 123 | Pass: 102 | Fail: 20 | Unauthorized: 1 | Skipped: 128

| Method | Path | Status | Code | Duration | Notes |
| --- | --- | --- | --- | --- | --- |
| DELETE | `/api/admin/amenities/{amenity_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| DELETE | `/api/admin/areas/{area_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| DELETE | `/api/admin/auth/admins/{admin_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| DELETE | `/api/admin/blocks/{block_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| DELETE | `/api/admin/bookings/{booking_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| DELETE | `/api/admin/branches/{branch_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| DELETE | `/api/admin/cities/{city_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| DELETE | `/api/admin/cms/{page_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| DELETE | `/api/admin/coupons/{coupon_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| DELETE | `/api/admin/courts/{court_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| DELETE | `/api/admin/faq/{faq_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| DELETE | `/api/admin/game-types/{game_type_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| DELETE | `/api/admin/global-price-conditions/{condition_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| DELETE | `/api/admin/integrations/partners/{partner_id}/webhooks/{webhook_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| DELETE | `/api/admin/policies/{policy_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| DELETE | `/api/admin/roles/{role_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| DELETE | `/api/admin/users/{user_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| DELETE | `/api/admin/venues/{venue_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| DELETE | `/api/user/notifications/tokens/{device_token}` | **SKIPPED** | None | -s | Write operation bypassed |
| DELETE | `/api/user/payments/methods/{method_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| GET | `/` | **PASS** | 200 | 2.080s | OK |
| GET | `/api/admin/amenities` | **PASS** | 200 | 2.255s | OK |
| GET | `/api/admin/amenities/` | **PASS** | 200 | 2.237s | OK |
| GET | `/api/admin/amenities/{amenity_id}` | **PASS** | 200 | 2.261s | Resolved: /api/admin/amenities/2f04bbcd-db8a-4438-8e6d-50545413c422 |
| GET | `/api/admin/areas` | **PASS** | 200 | 2.413s | OK |
| GET | `/api/admin/areas/` | **PASS** | 200 | 2.406s | OK |
| GET | `/api/admin/areas/{area_id}` | **PASS** | 200 | 2.349s | Resolved: /api/admin/areas/7d7838ee-e8c1-4182-bc64-9c042abdcae0 |
| GET | `/api/admin/auth/admins` | **PASS** | 200 | 4.053s | OK |
| GET | `/api/admin/auth/me` | **PASS** | 200 | 2.328s | OK |
| GET | `/api/admin/auth/me/` | **PASS** | 200 | 2.344s | OK |
| GET | `/api/admin/auth/profiles` | **PASS** | 200 | 2.285s | OK |
| GET | `/api/admin/auth/profiles/{profile_id}` | **PASS** | 200 | 2.226s | Resolved: /api/admin/auth/profiles/bb93f856-3c1f-4e74-acea-02369aed20c0 |
| GET | `/api/admin/blocks` | **PASS** | 200 | 2.425s | OK |
| GET | `/api/admin/blocks/` | **PASS** | 200 | 2.419s | OK |
| GET | `/api/admin/bookings` | **PASS** | 200 | 10.325s | OK |
| GET | `/api/admin/bookings/` | **PASS** | 200 | 10.413s | OK |
| GET | `/api/admin/bookings/{booking_id}` | **PASS** | 200 | 2.754s | Resolved: /api/admin/bookings/60033793-6a85-4339-9c32-a58732f77f1d |
| GET | `/api/admin/branches` | **PASS** | 200 | 3.165s | OK |
| GET | `/api/admin/branches/` | **PASS** | 200 | 3.228s | OK |
| GET | `/api/admin/branches/{branch_id}` | **PASS** | 200 | 2.387s | Resolved: /api/admin/branches/bbdec863-c298-481a-a29b-b889207cf65d |
| GET | `/api/admin/cities` | **PASS** | 200 | 2.292s | OK |
| GET | `/api/admin/cities/` | **PASS** | 200 | 2.273s | OK |
| GET | `/api/admin/cities/{city_id}` | **PASS** | 200 | 2.254s | Resolved: /api/admin/cities/1d0e64bb-e916-4932-bcc2-63c68b50896c |
| GET | `/api/admin/cms` | **PASS** | 200 | 2.334s | OK |
| GET | `/api/admin/cms/` | **PASS** | 200 | 2.356s | OK |
| GET | `/api/admin/cms/{slug}` | **PASS** | 200 | 2.268s | Resolved: /api/admin/cms/privacy-policy |
| GET | `/api/admin/coupons` | **PASS** | 200 | 2.267s | OK |
| GET | `/api/admin/coupons/` | **PASS** | 200 | 2.234s | OK |
| GET | `/api/admin/coupons/active-coupons` | **PASS** | 200 | 2.251s | OK |
| GET | `/api/admin/coupons/lookup` | **FAIL** | 422 | 2.064s | {"code":422,"status":"error","timestamp":"2026-04-15T11:21:57.724654Z","detail":[{"type":"missing"," |
| GET | `/api/admin/courts` | **PASS** | 200 | 5.926s | OK |
| GET | `/api/admin/courts/` | **PASS** | 200 | 5.891s | OK |
| GET | `/api/admin/courts/{court_id}` | **PASS** | 200 | 2.767s | Resolved: /api/admin/courts/2b10a0d2-b84f-4026-8a2d-0666c63ea68a |
| GET | `/api/admin/facilities/rental-items` | **PASS** | 200 | 2.200s | OK |
| GET | `/api/admin/facilities/shared-groups` | **PASS** | 200 | 2.224s | OK |
| GET | `/api/admin/facilities/types` | **PASS** | 200 | 2.236s | OK |
| GET | `/api/admin/facilities/{court_id}/division-modes` | **FAIL** | 500 | 2.108s | {"code":500,"status":"error","timestamp":"2026-04-15T11:22:21.078647Z","error":"internal_error","mes |
| GET | `/api/admin/facilities/{court_id}/units` | **FAIL** | 500 | 2.077s | {"code":500,"status":"error","timestamp":"2026-04-15T11:22:23.156715Z","error":"internal_error","mes |
| GET | `/api/admin/faq` | **PASS** | 200 | 2.307s | OK |
| GET | `/api/admin/faq/` | **PASS** | 200 | 2.310s | OK |
| GET | `/api/admin/faq/{faq_id}` | **PASS** | 200 | 2.312s | Resolved: /api/admin/faq/dbba2106-8ecd-4c07-abcc-e3587eca6d0e |
| GET | `/api/admin/game-types` | **PASS** | 200 | 2.307s | OK |
| GET | `/api/admin/game-types/` | **PASS** | 200 | 2.312s | OK |
| GET | `/api/admin/game-types/{game_type_id}` | **PASS** | 200 | 2.261s | Resolved: /api/admin/game-types/0edc91a3-13c4-4dd2-879a-7542f373ac73 |
| GET | `/api/admin/global-price-conditions` | **PASS** | 200 | 2.277s | OK |
| GET | `/api/admin/global-price-conditions/` | **PASS** | 200 | 2.290s | OK |
| GET | `/api/admin/integrations/partners` | **PASS** | 200 | 2.474s | OK |
| GET | `/api/admin/integrations/partners/` | **PASS** | 200 | 2.498s | OK |
| GET | `/api/admin/integrations/partners/{partner_id}/webhooks` | **PASS** | 200 | 2.261s | Resolved: /api/admin/integrations/partners/b117ed94-cb89-4720-a8e6-d0ba6f55ab42/webhooks |
| GET | `/api/admin/policies` | **PASS** | 200 | 2.258s | OK |
| GET | `/api/admin/policies/{policy_id}` | **PASS** | 200 | 2.281s | Resolved: /api/admin/policies/0795ee9a-2ac9-4314-8f1c-a00d8fbbdda5 |
| GET | `/api/admin/reviews` | **PASS** | 200 | 6.166s | OK |
| GET | `/api/admin/roles` | **PASS** | 200 | 2.277s | OK |
| GET | `/api/admin/roles/` | **PASS** | 200 | 2.276s | OK |
| GET | `/api/admin/roles/{role_id}` | **PASS** | 200 | 2.292s | Resolved: /api/admin/roles/d1ead91d-d5a9-43cb-9db1-95d2fb4c8151 |
| GET | `/api/admin/settings` | **PASS** | 200 | 2.309s | OK |
| GET | `/api/admin/users` | **PASS** | 200 | 2.338s | OK |
| GET | `/api/admin/users/` | **PASS** | 200 | 2.367s | OK |
| GET | `/api/admin/users/{user_id}` | **PASS** | 200 | 2.355s | Resolved: /api/admin/users/674f79a9-9c11-4088-9e3d-8bf42ee6f915 |
| GET | `/api/admin/venues` | **PASS** | 200 | 2.351s | OK |
| GET | `/api/admin/venues/` | **PASS** | 200 | 2.332s | OK |
| GET | `/api/admin/venues/{venue_id}` | **FAIL** | 500 | 2.389s | {"code":500,"status":"error","timestamp":"2026-04-15T11:23:22.812203Z","error":"internal_error","mes |
| GET | `/api/booking/{bookingId}` | **FAIL** | 422 | 2.050s | {"code":422,"status":"error","timestamp":"2026-04-15T11:23:24.862293Z","detail":[{"type":"missing"," |
| GET | `/api/bookings` | **FAIL** | 422 | 2.069s | {"code":422,"status":"error","timestamp":"2026-04-15T11:23:26.931381Z","detail":[{"type":"missing"," |
| GET | `/api/chatbot/booking/{display_id}` | **PASS** | 200 | 2.226s | Resolved: /api/chatbot/booking/BK-B3WO1K |
| GET | `/api/chatbot/context/venue/{venue_id}` | **FAIL** | 500 | 2.267s | {"code":500,"status":"error","timestamp":"2026-04-15T11:23:31.566311Z","detail":"(psycopg2.errors.In |
| GET | `/api/chatbot/knowledge/amenities` | **PASS** | 200 | 2.241s | OK |
| GET | `/api/chatbot/knowledge/base` | **PASS** | 200 | 2.399s | OK |
| GET | `/api/chatbot/knowledge/cities` | **PASS** | 200 | 2.221s | OK |
| GET | `/api/chatbot/knowledge/faqs` | **PASS** | 200 | 2.052s | OK |
| GET | `/api/chatbot/knowledge/game-types` | **PASS** | 200 | 2.220s | OK |
| GET | `/api/chatbot/knowledge/venues` | **PASS** | 200 | 2.267s | OK |
| GET | `/api/chatbot/search/venues` | **PASS** | 200 | 2.202s | OK |
| GET | `/api/checkAvailability/` | **FAIL** | 422 | 2.082s | {"code":422,"status":"error","timestamp":"2026-04-15T11:23:49.251066Z","detail":[{"type":"missing"," |
| GET | `/api/example/test-internal-error` | **FAIL** | 400 | 2.035s | {"code":400,"status":"error","timestamp":"2026-04-15T11:23:51.285562Z","detail":"user_id parameter i |
| GET | `/api/example/test-logging` | **PASS** | 200 | 2.076s | OK |
| GET | `/api/example/test-rate-limiting` | **PASS** | 200 | 2.076s | OK |
| GET | `/api/example/test-sensitive-data` | **FAIL** | 500 | 2.075s | {"code":500,"status":"error","timestamp":"2026-04-15T11:23:57.513171Z","detail":"Registration failed |
| GET | `/api/facilities` | **FAIL** | 422 | 2.045s | {"code":422,"status":"error","timestamp":"2026-04-15T11:23:59.558701Z","detail":[{"type":"missing"," |
| GET | `/api/media/{file_path:path}` | **FAIL** | 404 | 3.030s | {"code":404,"status":"error","timestamp":"2026-04-15T11:24:02.588521Z","detail":"File not found"} |
| GET | `/api/media/{file_path:path}` | **FAIL** | 404 | 2.718s | {"code":404,"status":"error","timestamp":"2026-04-15T11:24:05.306516Z","detail":"File not found"} |
| GET | `/api/playo/availability` | **UNAUTHORIZED** | 401 | 2.285s | OK |
| GET | `/api/user/auth/profile` | **PASS** | 200 | 2.245s | OK |
| GET | `/api/user/bookings/` | **PASS** | 200 | 2.257s | OK |
| GET | `/api/user/bookings/{booking_id}/invoice` | **PASS** | 200 | 2.500s | Resolved: /api/user/bookings/60033793-6a85-4339-9c32-a58732f77f1d/invoice |
| GET | `/api/user/cms` | **PASS** | 200 | 2.292s | OK |
| GET | `/api/user/cms/` | **PASS** | 200 | 2.285s | OK |
| GET | `/api/user/cms/{slug}` | **FAIL** | 404 | 2.313s | {"code":404,"status":"error","timestamp":"2026-04-15T11:24:21.546899Z","detail":"Page not found"} |
| GET | `/api/user/coupons/available` | **PASS** | 200 | 2.220s | OK |
| GET | `/api/user/courts/` | **PASS** | 200 | 2.404s | OK |
| GET | `/api/user/courts/` | **PASS** | 200 | 2.406s | OK |
| GET | `/api/user/courts/{court_id}` | **PASS** | 200 | 2.292s | Resolved: /api/user/courts/2b10a0d2-b84f-4026-8a2d-0666c63ea68a |
| GET | `/api/user/courts/{court_id}/available-slots` | **FAIL** | 422 | 2.082s | {"code":422,"status":"error","timestamp":"2026-04-15T11:24:32.951185Z","detail":[{"type":"missing"," |
| GET | `/api/user/courts/{court_id}/ratings` | **PASS** | 200 | 2.240s | Resolved: /api/user/courts/2b10a0d2-b84f-4026-8a2d-0666c63ea68a/ratings |
| GET | `/api/user/courts/{court_id}/reviews` | **PASS** | 200 | 2.285s | Resolved: /api/user/courts/2b10a0d2-b84f-4026-8a2d-0666c63ea68a/reviews |
| GET | `/api/user/faq/` | **PASS** | 200 | 2.285s | OK |
| GET | `/api/user/favorites/` | **PASS** | 200 | 2.270s | OK |
| GET | `/api/user/notifications/stats/` | **PASS** | 200 | 2.273s | OK |
| GET | `/api/user/notifications/tokens/` | **PASS** | 200 | 2.259s | OK |
| GET | `/api/user/payments/methods` | **PASS** | 200 | 2.291s | OK |
| GET | `/api/user/payments/webhook` | **PASS** | 200 | 2.078s | OK |
| GET | `/api/user/policies/` | **PASS** | 200 | 2.255s | OK |
| GET | `/api/user/policies/privacy-policy` | **FAIL** | 404 | 2.332s | {"code":404,"status":"error","timestamp":"2026-04-15T11:24:55.518997Z","detail":"Privacy policy not  |
| GET | `/api/user/profile/` | **PASS** | 200 | 2.264s | OK |
| GET | `/api/user/profile/branches` | **PASS** | 200 | 2.280s | OK |
| GET | `/api/user/profile/cities` | **PASS** | 200 | 2.243s | OK |
| GET | `/api/user/profile/game-types` | **PASS** | 200 | 2.214s | OK |
| GET | `/api/user/profile/me` | **PASS** | 200 | 2.304s | OK |
| GET | `/api/user/profile/top-players` | **PASS** | 200 | 2.226s | OK |
| GET | `/api/user/reviews/booking/{booking_id}/exists` | **PASS** | 200 | 2.296s | Resolved: /api/user/reviews/booking/60033793-6a85-4339-9c32-a58732f77f1d/exists |
| GET | `/api/user/reviews/court/{court_id}` | **PASS** | 200 | 2.229s | Resolved: /api/user/reviews/court/2b10a0d2-b84f-4026-8a2d-0666c63ea68a |
| GET | `/api/user/reviews/unreviewed-completed-bookings` | **PASS** | 200 | 2.276s | OK |
| GET | `/api/user/reviews/user` | **PASS** | 200 | 2.272s | OK |
| GET | `/api/user/settings` | **PASS** | 200 | 2.243s | OK |
| GET | `/api/user/venues/` | **PASS** | 200 | 2.234s | OK |
| GET | `/api/user/venues/branches` | **PASS** | 200 | 2.198s | OK |
| GET | `/api/user/venues/cities` | **PASS** | 200 | 2.234s | OK |
| GET | `/api/user/venues/game-types` | **PASS** | 200 | 2.212s | OK |
| GET | `/api/user/venues/{venue_id}` | **FAIL** | 404 | 2.086s | {"code":404,"status":"error","timestamp":"2026-04-15T11:25:31.388683Z","detail":"Venue not found (In |
| GET | `/api/user/venues/{venue_id}/slots` | **FAIL** | 422 | 2.080s | {"code":422,"status":"error","timestamp":"2026-04-15T11:25:33.537206Z","detail":[{"type":"missing"," |
| GET | `/api/user/venues/{venue_id}/zones` | **FAIL** | 500 | 2.316s | {"code":500,"status":"error","timestamp":"2026-04-15T11:25:35.903924Z","detail":"(psycopg2.errors.In |
| GET | `/api/webhook/whatsapp/test-send` | **FAIL** | 422 | 2.073s | {"code":422,"status":"error","timestamp":"2026-04-15T11:25:37.978516Z","detail":[{"type":"missing"," |
| GET | `/health` | **PASS** | 200 | 2.086s | OK |
| PATCH | `/api/admin/amenities/{amenity_id}/toggle` | **SKIPPED** | None | -s | Write operation bypassed |
| PATCH | `/api/admin/areas/{area_id}/toggle` | **SKIPPED** | None | -s | Write operation bypassed |
| PATCH | `/api/admin/bookings/{booking_id}/payment-status` | **SKIPPED** | None | -s | Write operation bypassed |
| PATCH | `/api/admin/bookings/{booking_id}/status` | **SKIPPED** | None | -s | Write operation bypassed |
| PATCH | `/api/admin/branches/{branch_id}/toggle` | **SKIPPED** | None | -s | Write operation bypassed |
| PATCH | `/api/admin/cities/{city_id}/toggle` | **SKIPPED** | None | -s | Write operation bypassed |
| PATCH | `/api/admin/coupons/{coupon_id}/toggle` | **SKIPPED** | None | -s | Write operation bypassed |
| PATCH | `/api/admin/courts/{court_id}/toggle` | **SKIPPED** | None | -s | Write operation bypassed |
| PATCH | `/api/admin/game-types/{game_type_id}/toggle` | **SKIPPED** | None | -s | Write operation bypassed |
| PATCH | `/api/admin/users/{user_id}/toggle` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/amenities` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/amenities/` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/areas` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/areas/` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/auth/admins` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/auth/admins/login` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/auth/otp/send` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/auth/otp/verify` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/blocks` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/blocks/` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/bookings` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/bookings/` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/branches` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/branches/` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/cities` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/cities/` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/cms/` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/coupons` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/coupons/` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/courts` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/courts/` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/courts/bulk-block-slots` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/courts/bulk-delete-slots` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/courts/bulk-update-slots` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/facilities/rental-items` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/facilities/shared-groups` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/facilities/types` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/facilities/{court_id}/division-modes` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/facilities/{court_id}/units` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/faq/` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/game-types` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/game-types/` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/global-price-conditions` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/global-price-conditions/` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/global-price-conditions/apply-to-all-courts` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/integrations/partners` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/integrations/partners/` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/integrations/partners/{partner_id}/webhooks` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/policies` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/roles` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/roles/` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/users` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/users/` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/venues` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/admin/venues/` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/cancelBooking/` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/district/callback` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/example/test-custom-errors` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/makeBatchBooking` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/playo/booking/create` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/playo/bookings/cancel` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/playo/bookings/map` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/playo/orders` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/playo/orders/cancel` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/playo/orders/confirm` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/user/academy/register` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/user/auth/login` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/user/auth/register` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/user/auth/send-otp` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/user/auth/verify-otp` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/user/bookings/` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/user/contact/submit` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/user/coupons/validate` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/user/favorites/toggle` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/user/notifications/send/` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/user/notifications/test/` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/user/notifications/tokens/` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/user/payments/create-multi-order` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/user/payments/create-order` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/user/payments/methods` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/user/payments/methods/{method_id}/default` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/user/payments/verify` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/user/payments/webhook` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/user/profile/` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/user/profile/upload-avatar` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/user/reviews/` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/user/venues/seed` | **SKIPPED** | None | -s | Write operation bypassed |
| POST | `/api/webhook/whatsapp` | **SKIPPED** | None | -s | Write operation bypassed |
| PUT | `/api/admin/amenities/{amenity_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| PUT | `/api/admin/areas/{area_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| PUT | `/api/admin/auth/admins/{admin_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| PUT | `/api/admin/bookings/{booking_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| PUT | `/api/admin/branches/{branch_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| PUT | `/api/admin/cities/{city_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| PUT | `/api/admin/cms/{page_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| PUT | `/api/admin/coupons/{coupon_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| PUT | `/api/admin/courts/{court_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| PUT | `/api/admin/faq/{faq_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| PUT | `/api/admin/game-types/{game_type_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| PUT | `/api/admin/global-price-conditions/{condition_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| PUT | `/api/admin/integrations/partners/{partner_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| PUT | `/api/admin/policies/{policy_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| PUT | `/api/admin/reviews/{review_id}/status` | **SKIPPED** | None | -s | Write operation bypassed |
| PUT | `/api/admin/roles/{role_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| PUT | `/api/admin/settings` | **SKIPPED** | None | -s | Write operation bypassed |
| PUT | `/api/admin/users/{user_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| PUT | `/api/admin/venues/{venue_id}` | **SKIPPED** | None | -s | Write operation bypassed |
| PUT | `/api/user/bookings/{booking_id}/cancel` | **SKIPPED** | None | -s | Write operation bypassed |
