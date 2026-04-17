# Push Notification System & Use Cases

This document outlines the real-time push notification use cases implemented across the MyRush ecosystem (Web App & Admin Panel). 

The infrastructure uses **WebSockets** for instant in-app alerts (when the app is open) and **Firebase Cloud Messaging (FCM)** for native OS-level desktop and mobile push notifications (even when the browser is minimized).

---

## 📱 Web App Use Cases (End Users)

**1. Booking Confirmation**
*   **Trigger:** Instantly sent when a user successfully books and pays for a slot.
*   **Message:** "Booking Confirmed! 🎉" - Includes the court, venue, and date details.

**2. Booking Cancellation**
*   **Trigger:** Sent if a booking is cancelled (either by the user or an admin).
*   **Message:** "Booking Cancelled 🛑" - Includes venue details and mentions if a refund has been initiated.

**3. Payment Expiry Warning (Automated)**
*   **Trigger:** A background scheduled job scans for "held" slots. Sent just before a 15-minute booking hold expires due to non-payment.
*   **Message:** "Secure your slot! ⚡" - Reminds the user to complete their payment to avoid losing the court.

**4. Post-Game Review Prompt (Automated)**
*   **Trigger:** A scheduled job runs periodically to check for games that ended ~2 hours ago. 
*   **Message:** "How was your game? 🏸" - Prompts the user to leave a rating and review for their session.

---

## 💻 Admin Panel Use Cases (Venue Managers & Staff)

*Note: Admins receive customized alerts based on their Role (Super Admin vs. Branch Admin).*

**1. New Booking Alert**
*   **Trigger:** Instantly sent whenever a user completes a booking.
*   **Message:** "New Booking Received 🏸" 
*   **Routing:** Super Admins receive all booking alerts. Branch Admins only receive alerts for bookings made at their specific assigned venue.

**2. Booking Cancellation Alert**
*   **Trigger:** Sent when a confirmed booking is cancelled, to alert staff that a slot has freed up.
*   **Message:** "Booking Cancelled ⚠️" - Includes the display ID of the cancelled booking.

**3. Nightly Revenue Summary (Automated)**
*   **Trigger:** A scheduled job runs every night at 10:00 PM IST.
*   **Message:** "Daily Revenue Summary 💰" 
*   **Routing:** 
    *   **Super Admins** receive a global aggregate summary (Total system revenue and bookings).
    *   **Branch Admins** receive a customized summary reflecting only the revenue and bookings for their assigned venue.

---

## 🔧 Technical Details

*   **Omnichannel Delivery:** The backend `Notifier` service simultaneously routes messages to the Database (for history), WebSocket (for live red-dot badge updates), and FCM (for OS-level push alerts).
*   **Intelligent Auto-Registration:** The frontend panels are built to automatically detect if a user/admin has previously granted Notification permissions and silenty registers their device token to the server on login, eliminating the need for manual setup.
*   **Timezone Aware:** Notifications are formatted natively to IST using precise UTC offsets to calculate relative arrival times (e.g., "2 minutes ago").
