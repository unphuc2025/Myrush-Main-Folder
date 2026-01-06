# 🚀 MyRush FCM Push Notifications Setup Guide

## ✅ COMPLETE SETUP - React Native Firebase + Backend API

This guide covers the complete setup for FCM push notifications using React Native Firebase and a custom backend API.

---

## 📋 What's Been Implemented

### ✅ Backend (Python/FastAPI)
- **Push Tokens Table**: Stores device FCM tokens with user association
- **API Endpoints**: Complete CRUD operations for push tokens
- **FCM Integration**: Direct Firebase Cloud Messaging API calls
- **Notification Sending**: Send to specific users or device tokens
- **Test Endpoint**: Send test notifications to current user

### ✅ Mobile App (React Native)
- **React Native Firebase**: Proper FCM integration
- **Notification Service**: Complete notification handling
- **Token Management**: Automatic token registration with backend
- **Permission Handling**: iOS & Android notification permissions
- **Foreground Handling**: Display notifications when app is open

### ✅ Testing Tools
- **NotificationTest Component**: In-app notification testing
- **Test Script**: Backend API testing via command line
- **Environment Setup**: Proper configuration for all environments

---

## 🔧 SETUP INSTRUCTIONS

### 1. Firebase Project Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project: `myrush-fcm`
3. Enable Google Analytics (optional)

#### Android Setup
1. In Firebase Console → Project Settings → General
2. Click "Add app" → Android
3. Package name: `com.myrush.app`
4. Download `google-services.json`
5. Place in: `mobile/android/app/google-services.json`

#### iOS Setup (Optional)
1. In Firebase Console → Add iOS app
2. Bundle ID: `com.myrush.app`
3. Download GoogleService-Info.plist
4. Place in: `mobile/ios/MyRush/GoogleService-Info.plist`

### 2. FCM Server Key

#### Get Server Key
1. Firebase Console → Project Settings → Cloud Messaging
2. Scroll to "Server key"
3. Copy the server key

#### Backend Environment
Create/update `backend_python/.env`:
```env
FCM_SERVER_KEY=AAAA123456789:APA91bF...
```

### 3. Backend Setup

#### Run Migration
```bash
cd backend_python
python -c "
from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    with open('migrations/004_create_push_tokens_table.sql', 'r') as f:
        sql = f.read()
    conn.execute(text(sql))
    conn.commit()
    print('✅ Push tokens table created!')
"
```

#### Start Backend
```bash
python main.py
```

### 4. Mobile App Setup

#### Install Dependencies
```bash
cd mobile
npm install @react-native-firebase/app @react-native-firebase/messaging
```

#### Configure App.json
Already configured with:
```json
{
  "plugins": [],
  "android": {
    "package": "com.myrush.app"
  }
}
```

#### Android Build
```bash
cd mobile
npx react-native run-android --device
```

---

## 🧪 TESTING PUSH NOTIFICATIONS

### Method 1: In-App Testing (Recommended)

#### Add Test Component
```typescript
// In any screen (e.g., HomeScreen.tsx)
import NotificationTest from '../components/NotificationTest';

// Add to render:
<NotificationTest />
```

#### Test Steps
1. **Run the app**: `npx react-native run-android --device`
2. **Grant permissions** when prompted
3. **Copy FCM token** from the component or console logs
4. **Tap "Send Test Notification"** → Should show alert
5. **Check backend logs** for notification sending

### Method 2: Backend API Testing

#### Set Environment Variables
```bash
export TEST_USER_TOKEN="your_jwt_token_here"
export TEST_FCM_TOKEN="your_fcm_token_here"
export API_BASE_URL="http://192.168.1.2:5000"
```

#### Run Test Script
```bash
node mobile/test_notifications.js
```

#### Expected Output
```
🚀 Testing MyRush FCM Push Notification System
==============================================

📡 Step 1: Testing backend connection...
✅ Backend is reachable

📝 Step 2: Registering test push token...
✅ Push token registered successfully

📤 Step 3: Sending test notification...
✅ Test notification sent successfully!
📊 Sent to 1 device(s)

📊 Step 4: Getting notification statistics...
✅ Notification statistics retrieved
```

### Method 3: Manual API Testing

#### Get JWT Token
1. Login to your app
2. Check network logs or AsyncStorage for Bearer token

#### Register Token
```bash
curl -X POST http://localhost:5000/notifications/tokens/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_token": "YOUR_FCM_TOKEN",
    "device_type": "android"
  }'
```

#### Send Test Notification
```bash
curl -X POST http://localhost:5000/notifications/test/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📊 API ENDPOINTS

### Push Token Management
```
POST   /notifications/tokens/     # Register token
GET    /notifications/tokens/     # Get user's tokens
DELETE /notifications/tokens/{token}  # Delete token
```

### Notification Sending
```
POST   /notifications/send/       # Send to users/tokens
POST   /notifications/test/       # Send test to current user
GET    /notifications/stats/      # Get statistics
```

### Request/Response Examples

#### Register Token
```json
// Request
{
  "device_token": "fcm_token_here",
  "device_type": "android",
  "device_info": {
    "platform": "android",
    "version": "11",
    "model": "Pixel 4"
  }
}

// Response
{
  "id": "uuid",
  "user_id": "user_uuid",
  "device_token": "fcm_token_here",
  "device_type": "android",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Send Notification
```json
// Request
{
  "user_ids": ["user_uuid_1", "user_uuid_2"],
  "title": "Booking Confirmed!",
  "body": "Your court booking is confirmed.",
  "data": {
    "booking_id": "booking_uuid",
    "type": "booking_confirmed"
  }
}

// Response
{
  "success": true,
  "message": "Sent 2 notifications, 0 failed",
  "sent_count": 2,
  "failed_count": 0
}
```

---

## 🔧 TROUBLESHOOTING

### Common Issues

#### 1. "Firebase messaging not available"
- ✅ Check if `@react-native-firebase/messaging` is installed
- ✅ Clean and rebuild: `cd android && ./gradlew clean && cd .. && npx react-native run-android`

#### 2. Token not registering with backend
- ✅ Check JWT token is valid
- ✅ Verify backend is running
- ✅ Check network connectivity

#### 3. Notifications not arriving
- ✅ Verify FCM server key in backend
- ✅ Check device notification permissions
- ✅ Confirm FCM token is valid (not expired)

#### 4. iOS notifications not working
- ✅ Add push notification capability in Xcode
- ✅ Upload APNs certificate to Firebase
- ✅ Test on physical device (simulator doesn't support push)

### Debug Commands

#### Check Android Notifications
```bash
adb shell dumpsys notification
```

#### Check FCM Token
```javascript
// In React Native debugger console
import messaging from '@react-native-firebase/messaging';
console.log(await messaging().getToken());
```

#### Check Backend Logs
```bash
# Backend terminal should show:
✅ FCM token obtained: fcm_token_here
✅ Token registered with backend
📱 Notification sent successfully
```

---

## 🚀 PRODUCTION DEPLOYMENT

### Backend Environment Variables
```env
FCM_SERVER_KEY=your_production_fcm_server_key
DATABASE_URL=your_production_db_url
```

### Mobile App Configuration
- Update API_BASE_URL in app.json for production
- Ensure google-services.json is from production Firebase project
- Test on production build before release

### FCM Server Key Security
- ✅ Store FCM server key securely (environment variables)
- ✅ Never commit to version control
- ✅ Use different keys for dev/staging/production

---

## 📱 SUPPORTED FEATURES

- ✅ **Foreground Notifications**: Display when app is open
- ✅ **Background Notifications**: Arrive when app is closed
- ✅ **Notification Opened**: Handle taps on notifications
- ✅ **Token Management**: Automatic registration and updates
- ✅ **Multi-device Support**: Send to all user's devices
- ✅ **Platform Support**: Android & iOS
- ✅ **Custom Data**: Send additional payload data
- ✅ **Topic Subscriptions**: Group notifications (future)

---

## 🎯 QUICK START CHECKLIST

- [ ] Firebase project created
- [ ] google-services.json in mobile/android/app/
- [ ] FCM server key in backend/.env
- [ ] Push tokens table migrated
- [ ] Backend running on port 5000
- [ ] Mobile app built and running
- [ ] Permissions granted on device
- [ ] FCM token visible in console
- [ ] Test notification sent successfully

---

## 📞 NEED HELP?

1. **Check console logs** for error messages
2. **Verify FCM server key** is correct
3. **Test backend endpoints** with curl/Postman
4. **Check device permissions** in settings
5. **Try NotificationTest component** for in-app debugging

**Your FCM push notification system is now fully configured!** 🎉
