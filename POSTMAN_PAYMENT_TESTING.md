# Postman Testing Guide: MyRush Payment Flow

This guide walks you through testing the end-to-end payment flow using Postman, including how to simulate a Razorpay Webhook to trigger the Vriksha service.

---

## 1. Prerequisites
- **Postman** installed.
- **Base URL**: e.g., `https://api-staging.myrush.in` or `http://localhost:8000`
- **Environment Variables**: Create an environment in Postman with `base_url` and `access_token`.

---

## 2. Step 1: Authentication
Before calling payment APIs, you need a User Access Token.

1.  **Send OTP**: 
    - **Method**: `POST`
    - **URL**: `{{base_url}}/api/user/auth/send-otp`
    - **Body**: `{"phone_number": "1234567890"}`
2.  **Verify OTP**: 
    - **Method**: `POST`
    - **URL**: `{{base_url}}/api/user/auth/verify-otp`
    - **Body**: `{"phone_number": "1234567890", "otp_code": "12345"}`
3.  **Save Token**: Copy the `access_token` from the response and save it to your Postman environment.

---

## 3. Step 2: Create Payment Order
This API validates the slots and creates a "Pending" booking in the database.

- **Method**: `POST`
- **URL**: `{{base_url}}/api/payments/create-order`
- **Headers**: 
    - `Authorization: Bearer {{access_token}}`
    - `Content-Type: application/json`
- **Body (JSON)**:
    ```json
    {
      "branch_id": "REPLACE_WITH_ACTUAL_BRANCH_ID",
      "court_id": "REPLACE_WITH_ACTUAL_COURT_ID",
      "booking_date": "2026-04-15",
      "start_time": "10:00",
      "duration_minutes": 30,
      "time_slots": [{"time": "10:00"}, {"time": "10:30"}],
      "number_of_players": 1,
      "slice_mask": 0
    }
    ```
- **Success**: You will receive a `razorpay_order_id` (e.g., `order_NqX...`). **Save this ID.**

---

## 4. Step 3: Simulate Razorpay Webhook (The "Vriksha Trigger")
Since you cannot "pay" in Postman, you must simulate the Webhook call that Razorpay would normally send.

### **The Signature Problem**
The backend validates the `x-razorpay-signature` header. For local dev testing, you have two options:

#### **Option A: Bypass Signature (Dev Only)**
Temporarily comment out the signature verification lines in `unified-backend/routers/user/payments.py` (around lines 503-509) to allow any Postman request through.

#### **Option B: Generate a Valid Signature (Recommended)**
Use this Python snippet to generate the header for your Postman request:

```python
import hmac
import hashlib

secret = "YOUR_WEBHOOK_SECRET_FROM_ENV"
payload = '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_TEST123","amount":50000,"order_id":"order_FROM_STEP_3","notes":{"item_type":"PHONE"}}}}}'

signature = hmac.new(
    secret.encode('utf-8'),
    payload.encode('utf-8'),
    hashlib.sha256
).hexdigest()

print(f"x-razorpay-signature: {signature}")
```

### **The Webhook Request**
- **Method**: `POST`
- **URL**: `{{base_url}}/api/payments/webhook`
- **Headers**:
    - `x-razorpay-signature`: (Result from Python script)
    - `Content-Type: application/json`
- **Body (JSON)**:
    ```json
    {
      "event": "payment.captured",
      "payload": {
        "payment": {
          "entity": {
            "id": "pay_TEST123",
            "amount": 50000,
            "order_id": "REPLACE_WITH_ORDER_ID_FROM_STEP_2",
            "status": "captured",
            "notes": {
               "item_type": "PHONE"
            }
          }
        }
      }
    }
    ```

---

## 5. Verifying Success
1.  **Check MyRush DB**: The booking status for the `order_id` should change from `pending` to `paid`.
2.  **Check Backend Logs**: You should see:
    - `[WEBHOOK] Received event...`
    - `[WEBHOOK-VRIKSHA] Forwarding STRICT contract payload...`
    - `[WEBHOOK-VRIKSHA] Vriksha Response Status: 200`

---

> [!TIP]
> **Troubleshooting**: If the booking status stays `pending`, check if the `amount` in your Webhook JSON exactly matches the `total_amount * 100` from the booking. If they don't match, the backend flags it as a mismatch for security.
