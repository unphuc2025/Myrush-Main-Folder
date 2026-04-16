# MyRush Payment Flow & Webhook Integration - QA Testing Guide

This document provides complete details for testing the payment infrastructure, including the Razorpay integration, API Gateway forwarding, and the Vriksha service synchronization.

---

## 1. Overview of the Payment Flow

The payment flow is designed with "Security First" principles, ensuring consistent slot reservation and preventing double bookings.

### **The End-to-End Journey:**
1.  **Frontend**: User selects slots and clicks "Pay".
2.  **API Gateway**: Forwards the request to the `unified-backend`.
3.  **Backend (`/payments/create-order`)**:
    *   Validates slot availability using Bitmasks.
    *   Calculates the authoritative price server-side.
    *   **Atomic Reservation**: Creates a database entry with `payment_status: "pending"` to block these slots immediately.
    *   Calls Razorpay to create an `order_id`.
4.  **Frontend**: Opens Razorpay Checkout with the `order_id`.
5.  **Payment Completion**: User pays via UPI/Card/etc.
6.  **Webhook Trigger**: Razorpay sends a `payment.captured` event to the backend.
7.  **Vriksha Service**: Backend forwards the webhook to Vriksha with a strict contract payload.
8.  **Final Confirmation**: If Vriksha returns `200 OK`, the backend marks the booking as `paid`.

---

## 2. Razorpay Side Configuration (Required Setup)

For the flow to work, the following must be configured in the **Razorpay Dashboard**:

1.  **URL**: `https://api.myrush.in/payments/webhook` (Update for staging/dev as needed).
2.  **Secret**: Must match the `RAZORPAY_WEBHOOK_SECRET` in the backend `.env`.
3.  **Active Events**: `payment.captured`
4.  **Alert Email**: Set to a developer email to monitor failures.

---

## 3. API Endpoints for Testing

### **A. Create Payment Order**
*   **Method**: `POST`
*   **URL**: `/payments/create-order`
*   **Authorization**: Bearer Token (User Auth)
*   **Request Body**:
    ```json
    {
      "branch_id": "BRANCH_ID",
      "court_id": "COURT_ID",
      "booking_date": "YYYY-MM-DD",
      "time_slots": [{"time": "10:00"}, {"time": "10:30"}],
      "number_of_players": 1,
      "coupon_code": "OPTIONAL_CODE",
      "slice_mask": 0
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "id": "order_L1abcxyz",
      "amount": 50000,
      "currency": "INR",
      "key_id": "rzp_test_xxxx",
      "server_calculated_amount": 500.0,
      "breakdown": {
        "base": 500.0,
        "fee": 0.0,
        "discount": 0.0
      }
    }
    ```

### **B. Verify Payment (Immediate)**
*   **Method**: `POST`
*   **URL**: `/payments/verify`
*   **Request Body**:
    ```json
    {
      "razorpay_order_id": "order_...",
      "razorpay_payment_id": "pay_...",
      "razorpay_signature": "signature_..."
    }
    ```
*   **Note**: This is used for immediate frontend feedback but the **Webhook** is the authoritative source for final status.

---

## 3. Webhook & Vriksha Integration

The backend implements a **Safe Webhook Handler** that acts as a bridge to the Vriksha service.

### **Webhook Endpoint**
*   **URL**: `/payments/webhook`
*   **Headers**: Requires `x-razorpay-signature` (Automatically sent by Razorpay).

### **Behind the Scenes (Tester Details)**
When the backend receives a `payment.captured` event:
1.  **Signature Verification**: It validates that the request came from Razorpay.
2.  **Fraud Check**: It compares the `amount` received from Razorpay against the `total_amount` in the `pending` booking record.
3.  **Vriksha Forwarding**:
    *   **Forward URL**: `https://tester-webhook.vriksha.ai/api/webhooks/razorpay`
    *   **Payload Transformation**: The backend enriches the payload with specific nodes required by Vriksha:
        *   `item_type`: "PHONE"
        *   `sku_id`: 1
        *   `internal_order_id`: The MyRush Booking ID.
        *   `item_cost`: Amount in paise.

---

## 4. Test Scenarios & Edge Cases

| Scenario | Steps to Test | Expected Result |
| :--- | :--- | :--- |
| **Normal Success** | Complete a booking with valid payment. | Booking status moves from `pending` -> `paid`. Slots are blocked. |
| **Slot Conflict** | User A and User B both click "Pay" for the same slot. | User A succeeds. User B receives a `409 Conflict` error before payment starts. |
| **Invalid Coupon** | Attempt to create order with expired/invalid coupon. | `400 Bad Request` with error message. |
| **Amount Mismatch** | Mock a webhook with a different amount than the order. | Backend flags it as `flagged_mismatch` instead of `paid`. |
| **Vriksha Down** | Temporarily block access to Vriksha endpoint. | Backend logs a warning. Booking stays `pending` (Safe state). |
| **Double Webhook** | Send the same webhook twice. | Second attempt returns success but doesn't create duplicate bookings. |

---

## 5. QA Verification Checklist

- [ ] **Create Order**: Verify `amount` is correctly calculated server-side (Base Price + Fees - Discounts).
- [ ] **Atomic Lock**: Verify that after `/payments/create-order`, the slot is immediately invisible to other users even before payment is finished.
- [ ] **Webhook Signature**: Use the Razorpay Webhook tool to simulate events.
- [ ] **Vriksha Sync**: Check backend logs to confirm Vriksha returned `200 OK`.
- [ ] **Database Integrity**: Ensure `payment_id` and `razorpay_signature` are saved in the `bookings` table.

---

> [!IMPORTANT]
> **Environment Configuration**: Ensure the `.env` file in the backend has the correct `RAZORPAY_WEBHOOK_SECRET`. Without this, webhook signature verification will fail and bookings will never be marked as paid.
