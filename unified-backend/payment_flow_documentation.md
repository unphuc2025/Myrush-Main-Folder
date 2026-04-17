# MyRush Payment Flow & Webhook Documentation

This document explains the end-to-end payment lifecycle for the MyRush platform, focusing on Razorpay integration, signature security, and the Vriksha external verification step.

## 1. High-Level Flow

1.  **Order Initiation**: User selects a slot. Frontend calls `/payments/create-order`.
    *   Server validates availability and price.
    *   Server reserves the slot atomically (marks as `pending` in DB).
    *   Server generates a Razorpay Order ID.
2.  **Payment Processing**: User completes payment via Razorpay UI (Checkout).
3.  **Local Verification (Sync)**: Frontend calls `/payments/verify` to confirm success immediately.
4.  **Webhook Fulfillment (Async)**: Razorpay sends a `payment.captured` event to `/payments/webhook`.
    *   **Crucial**: This is where the booking is finalized and marked as `paid`.

## 2. X-Signature Verification (The Security Layer)

To prevent spoofing (fake payment notifications), the backend verifies every webhook request using a signature.

### How it works:
- **Identifier**: `x-razorpay-signature` (Request Header).
- **Generation**: Razorpay hashes the **Raw Request Body** + your **Webhook Secret** using the `HMAC-SHA256` algorithm.
- **Verification**: The backend uses the `razorpay` Python SDK to perform the same hash and compares it to the header.

> [!IMPORTANT]
> If the `RAZORPAY_WEBHOOK_SECRET` in your `.env` file does not exactly match the one configured in the Razorpay Dashboard, all webhooks will fail with a `400 Bad Request`.

## 3. Vriksha Integration

The MyRush backend enforces a **dual-confirmation** policy for payments:
1.  **Razorpay Confirmation**: The webhook event itself.
2.  **Vriksha Confirmation**: The backend forwards the Razorpay payload to the Vriksha system (`VRIKSHA_WEBHOOK_URL`).

**The booking is ONLY marked as `paid` in the MyRush database if Vriksha returns an HTTP 200 (Success).** This allows Vriksha to perform additional business-level validations (e.g., inventory checks, external sync) before finalization.

## 4. Troubleshooting

- **Booking stuck in `pending`**: Check if the webhook was received (Server logs). If received, check if the Vriksha API call succeeded.
- **`Signature verification failed`**: Check the `.env` secret.
- **`Amount mismatch`**: Fraud check triggered because the amount paid in Razorpay differs from the booking amount in the DB.
