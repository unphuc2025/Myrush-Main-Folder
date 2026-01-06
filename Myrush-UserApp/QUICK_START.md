# 🚀 MyRush - Quick Start Guide

## ✅ Profile Screen Status

**Good News!** Your profile screen **already works** and fetches:
- ✅ Cities from `admin_cities` database table
- ✅ Sports from `admin_game_types` database table

---

## 🏃 Quick Start (Development)

### 1. Start Backend
```bash
cd MYRUSH-USER-APP/backend_python
python -m uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

### 2. Start Mobile App
```bash
cd MYRUSH-USER-APP/mobile
npm start
```

### 3. Test
- Open app in Expo Go
- Go to Profile screen
- Cities and sports should appear in dropdowns!

---

## 📦 For Downloaded APK

### Problem
Current API URL (`http://192.168.1.2:5000`) only works on your local network.

### Quick Solution (Using Ngrok)

**Step 1:** Install ngrok
```bash
# Download from https://ngrok.com/download
```

**Step 2:** Start backend
```bash
cd MYRUSH-USER-APP/backend_python
python -m uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

**Step 3:** Start ngrok (in new terminal)
```bash
ngrok http 5000
```

**Step 4:** Copy ngrok URL
```
Example: https://abc123.ngrok.io
```

**Step 5:** Update mobile/.env
```env
API_BASE_URL=https://abc123.ngrok.io
```

**Step 6:** Build APK
```bash
cd MYRUSH-USER-APP/mobile
npx eas build --platform android --profile preview
```

**Done!** Your APK will work anywhere! 🎉

---

## 🧪 Test Endpoints

```bash
# Test cities endpoint
curl http://192.168.1.2:5000/profile/cities

# Test game types endpoint
curl http://192.168.1.2:5000/profile/game-types

# Or run the test script
cd MYRUSH-USER-APP/backend_python
python test_profile_endpoints.py
```

---

## 📚 More Info

- **Detailed Guide:** `PROFILE_CITIES_SPORTS_GUIDE.md`
- **Configuration:** `CONFIGURATION_SUMMARY.md`
- **Build Instructions:** `mobile/BUILD_INSTRUCTIONS.md`

---

## 🆘 Common Issues

### Dropdowns are empty?
1. Check database has data in `admin_cities` and `admin_game_types`
2. Make sure backend is running
3. Verify mobile app can reach backend

### Can't connect to backend?
1. Check both devices on same WiFi
2. Verify API_BASE_URL in `.env` file
3. Test backend URL in browser

### APK doesn't work?
1. Use ngrok or deploy backend to cloud
2. Update `.env` with public URL
3. Rebuild APK

---

**That's it!** Your profile screen is ready to go! 🎉

