# Razorpay Integration Requirements and Instructions

Please paste the requirements and instructions for the Razorpay integration below.
1️⃣ The Three Systems Involved
In a Razorpay payment there are three parties:
User App / Website – where the user clicks Pay


Your Backend Server – your system that manages orders and users


Razorpay – the payment processor that handles money


The backend is the most important part, because it controls security.

2️⃣ Step 1 — User Starts a Payment
Example:
User clicks:
Buy Credits ₹499
Your app sends a request to your backend:
POST /create-payment
amount = 499
user_id = 81
The backend now knows the user wants to pay.

3️⃣ Step 2 — Backend Creates a Razorpay Order
Your backend calls Razorpay's Order API.
Example request from backend to Razorpay:
POST https://api.razorpay.com/v1/orders
amount: 49900
currency: INR
receipt: order_123
Important:
amount must be in paise
₹499 = 49900
Razorpay creates an order and returns:
order_id: order_L1abcxyz
amount: 49900
currency: INR
Now:
Razorpay knows this order


Your backend knows this order


This order_id becomes the link between your system and Razorpay.

4️⃣ Step 3 — Send Order ID to the App
Your backend returns the order details to the app:
Example response:
{
 orderId: "order_L1abcxyz",
 amount: 49900
}
Now the app can open the Razorpay payment screen.

5️⃣ Step 4 — Open Razorpay Checkout
The app opens the Razorpay checkout using the Key ID and order_id.
Example:
key: rzp_test_xxxxx
order_id: order_L1abcxyz
amount: 49900
The user now sees payment options:
UPI


Card


Netbanking


Wallet


User completes payment.

6️⃣ Step 5 — Razorpay Returns Payment Details
When payment succeeds, Razorpay sends this back to the app:
razorpay_payment_id
razorpay_order_id
razorpay_signature
Example:
payment_id: pay_Ks82js82
order_id: order_L1abcxyz
signature: x7d9a8c...
These values prove the payment happened.
But the app cannot trust them directly.

7️⃣ Step 6 — Backend Verifies the Payment
The app sends those values to your backend:
POST /verify-payment

payment_id
order_id
signature
Your backend now verifies the signature using the Razorpay secret key.
This ensures:
The payment actually came from Razorpay


It was not faked or modified


If verification succeeds:
Payment = VALID
Now your backend can safely:
Activate credits


Assign phone number


Update wallet balance


Mark order as PAID



8️⃣ Step 7 — Razorpay Webhook (Extra Confirmation)
Sometimes the app might close or the network might fail.
To solve this, Razorpay sends a Webhook event directly to your backend.
Example event:
payment.captured
Payload contains:
payment_id
order_id
amount
status
This means Razorpay is telling your server:
“This payment is successfully completed.”
Your backend should verify the webhook signature and update the database if needed.
This ensures no payment is ever missed.

9️⃣ Full Payment Flow (Complete Picture)
User clicks Pay
       ↓
App → Backend (create payment)
       ↓
Backend → Razorpay (create order)
       ↓
Razorpay → order_id
       ↓
Backend → App
       ↓
App opens Razorpay Checkout
       ↓
User pays
       ↓
Razorpay → payment_id + signature
       ↓
App → Backend (verify payment)
       ↓
Backend verifies signature
       ↓
Backend updates order / credits
       ↓
Razorpay Webhook confirms payment

🔑 Key Concepts to Remember
Order ID
Created by Razorpay when backend calls the order API.
 It represents the payment request.
Payment ID
Generated when the user completes the payment.
Signature
Security hash used to verify that the payment really came from Razorpay.
Webhook
A server-to-server notification from Razorpay confirming payment events.

In Your App's Case
For your flow:
Select Phone Number


Backend creates Razorpay Order


User pays


Backend verifies payment


Number gets assigned


User can then buy calling credits


Each payment should have its own order_id.


