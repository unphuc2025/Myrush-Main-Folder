# 🐛 Network Request Failed - Debugging Guide

## Issue
You're seeing: `[AUTH] Login error: [TypeError: Network request failed]`

The OTP send works, but verify fails with network error.

---

## ✅ What Was Fixed

Updated `mobile/src/api/otp.ts` to use the new MySQL backend instead of Supabase:

```typescript
// OLD (Supabase)
await supabase.rpc('verify_otp', {...})

// NEW (MySQL Backend)
await apiClient.post('/auth/verify-otp', {...})
```

---

## 🔍 Troubleshooting Steps

### 1. **Check API Base URL**

The app uses different URLs based on device type:

```typescript
// In apiClient.ts
const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:8000'  // Android Emulator
  : 'http://localhost:8000'; // iOS Simulator
```

**For Physical Device:**
You need to use your PC's local IP address instead.

### 2. **Find Your PC's IP Address**

**On Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" (e.g., `192.168.1.105`)

**Update apiClient.ts temporarily:**
```typescript
const API_BASE_URL = 'http://192.168.1.105:8000'; // Your PC's IP
```

### 3. **Verify Backend is Running**

Check these terminals:
- Port 8000 should show "uvicorn" running
- Test from your phone's browser: `http://YOUR_PC_IP:8000/docs`

### 4. **Check Firewall**

Windows Firewall might block port 8000:

```powershell
# Allow port 8000 through firewall
New-NetFirewallRule -DisplayName "Python Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

### 5. **Test API from Terminal**

**From your PC:**
```powershell
curl http://localhost:8000/auth/send-otp -X POST -H "Content-Type: application/json" -d '{"phone_number": "+1234567890"}'
```

**Expected Response:**
```json
{
  "message": "OTP sent successfully",
  "success": true,
  "verification_id": "...",
  "otp_code": "12345"
}
```

---

## 📱 Quick Fix for Testing

### Option 1: Use Android Emulator
If you're using a physical device, switch to Android Emulator which automatically uses `10.0.2.2`

### Option 2: Update API URL for Physical Device

Edit `mobile/src/api/apiClient.ts`:

```typescript
import { Platform } from 'react-native';

// Get your PC's IP address
const getApiUrl = () => {
  if (__DEV__) {
    // For Android Emulator
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000';
    }
    // For iOS Simulator
    if (Platform.OS === 'ios') {
      return 'http://localhost:8000';
    }
  }
  return 'http://localhost:8000'; // Production
};

const API_BASE_URL = getApiUrl();
```

**Or hardcode for physical device testing:**
```typescript
const API_BASE_URL = 'http://192.168.1.105:8000'; // Replace with your PC IP
```

---

## 🧪 Test the Fix

### 1. **Reload Mobile App**
Press `r` in Metro bundler or shake device → Reload

### 2. **Check Console Logs**
Look for:
```
[OTP API] Using API URL: http://10.0.2.2:8000
[OTP API] Sending OTP to +1234567890
[OTP API] OTP sent successfully
[OTP API] Verifying OTP for +1234567890
[OTP API] Verification successful
```

### 3. **Successful Flow**
```
1. Enter phone number → Send OTP
2. OTP logs show: "message": "OTP sent successfully", "otp_code": "12345"
3. Enter OTP: 12345
4. Verify → Backend returns JWT token
5. User logged in ✅
```

---

## ✅ Expected Behavior After Fix

1. **Send OTP**: ✅ Works (already working)
2. **Verify OTP**: ✅ Should work now (was failing)
3. **Auth Store**: ✅ Stores token and user
4. **User logged in**: ✅ Redirected to app

---

## 🎯 If Still Failing

### Check Network Inspector

In React Native Debugger or Flipper:
1. Open Network tab
2. Send OTP request
3. Check request details:
   - URL should be: `http://10.0.2.2:8000/auth/verify-otp`
   - Method: POST
   - Body: `{"phone_number": "...", "otp_code": "12345"}`

### Common Issues

| Error | Cause | Fix |
|-------|-------|-----|
| Network request failed | Can't reach backend | Check IP/port, firewall |
| ECONNREFUSED | Backend not running | Start backend on port 8000 |
| Timeout | Wrong IP address | Use correct local IP |
| CORS | Missing CORS headers | Backend already configured |

---

## 💡 Development Tip

Add API base URL to your app's debug menu:

```typescript
// In your debug screen
console.log('API Base URL:', API_BASE_URL);
```

---

## 🚀 Next Steps

1. **Save the file** (mobile/src/api/otp.ts already updated)
2. **Reload mobile app** (Metro bundler → press `r`)
3. **Try OTP flow again**
4. **Check logs** for successful verification
5. **If still failing**, check firewall and use PC's local IP

---

## ✨ The Fix is Already Applied!

The OTP API now uses the correct MySQL backend endpoint. Just reload your mobile app and try again!
