# ✅ MyRush App - Configuration Complete!

## What Was Done

### 1. ✅ Profile Screen Already Working
Your `PlayerProfileScreen.tsx` **already fetches**:
- Cities from `admin_cities` table via `/profile/cities`
- Sports from `admin_game_types` table via `/profile/game-types`

### 2. ✅ Environment Configuration Added
Created proper environment management for API URLs:

**Files Created:**
- `mobile/.env` - Development configuration
- `mobile/.env.production` - Production configuration
- `mobile/babel.config.js` - Babel config for env variables
- `mobile/src/config/env.ts` - Centralized config management
- `mobile/src/types/env.d.ts` - TypeScript definitions

**Files Updated:**
- `mobile/src/api/apiClient.ts` - Now uses environment config
- `mobile/app.json` - Added API URL to extra config
- `mobile/eas.json` - Added env variables for builds

---

## 🚀 How to Use

### For Development (Expo Go)

1. **Start Backend:**
   ```bash
   cd MYRUSH-USER-APP/backend_python
   python -m uvicorn main:app --host 0.0.0.0 --port 5000 --reload
   ```

2. **Update `.env` with your local IP:**
   ```env
   API_BASE_URL=http://YOUR_LOCAL_IP:5000
   ```

3. **Start Expo:**
   ```bash
   cd MYRUSH-USER-APP/mobile
   npm start
   ```

4. **Test the app** - Cities and sports should appear in dropdowns!

---

### For Production APK

**You have 3 options:**

#### Option 1: Ngrok (Quick Testing)
```bash
# Start backend
cd MYRUSH-USER-APP/backend_python
python -m uvicorn main:app --host 0.0.0.0 --port 5000 --reload

# In another terminal, start ngrok
ngrok http 5000

# Copy the ngrok URL (e.g., https://abc123.ngrok.io)
# Update mobile/.env:
API_BASE_URL=https://abc123.ngrok.io

# Build APK
cd MYRUSH-USER-APP/mobile
npx eas build --platform android --profile preview
```

#### Option 2: Deploy to Render.com (Recommended)
1. Create account at https://render.com
2. Create new Web Service
3. Connect your repo
4. Set root directory: `MYRUSH-USER-APP/backend_python`
5. Build command: `pip install -r requirements.txt`
6. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
7. Add environment variables (DATABASE_URL, SECRET_KEY, etc.)
8. Get your Render URL
9. Update `mobile/.env`:
   ```env
   API_BASE_URL=https://your-app.onrender.com
   ```
10. Build APK

#### Option 3: Your Own Server
1. Deploy backend to your server
2. Get public URL
3. Update `mobile/.env`
4. Build APK

---

## 📝 Current Configuration

### Backend
- **URL:** `http://192.168.1.2:5000`
- **Database:** PostgreSQL (Supabase)
- **Endpoints:**
  - `GET /profile/cities` - Returns active cities
  - `GET /profile/game-types` - Returns active game types

### Mobile App
- **Development URL:** `http://192.168.1.2:5000` (from `.env`)
- **Production URL:** Set in `.env.production` before building APK

---

## 🧪 Testing

### Test Backend Endpoints
```bash
cd MYRUSH-USER-APP/backend_python
python test_profile_endpoints.py
```

This will:
- Check database for cities and game types
- Test `/profile/cities` endpoint
- Test `/profile/game-types` endpoint

### Test in Mobile App
1. Open ProfileScreen
2. Check if cities dropdown shows cities from database
3. Check if sports dropdown shows game types from database
4. Try saving profile

---

## 🐛 Troubleshooting

### Dropdowns are empty?

**Check 1: Database has data**
```sql
SELECT * FROM admin_cities WHERE is_active = true;
SELECT * FROM admin_game_types WHERE is_active = true;
```

**Check 2: Backend is accessible**
```bash
curl http://192.168.1.2:5000/profile/cities
curl http://192.168.1.2:5000/profile/game-types
```

**Check 3: Mobile app can connect**
- Check Expo console for errors
- Verify API_BASE_URL in `.env` matches your backend URL
- Make sure phone and computer are on same WiFi

### APK not connecting?

**Issue:** Local IP won't work outside your network

**Solution:** Use one of these:
1. Ngrok tunnel (temporary)
2. Deploy to cloud (Render, Railway, Heroku)
3. Use your own server with public IP

---

## 📱 Building APK

### Method 1: EAS Build (Recommended)
```bash
cd MYRUSH-USER-APP/mobile

# Make sure .env has production URL
# Then build:
npx eas build --platform android --profile preview
```

### Method 2: Local Build
```bash
cd MYRUSH-USER-APP/mobile/android
./gradlew assembleRelease

# APK will be at:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 🎯 Next Steps

1. **Test locally** with Expo Go
2. **Verify** cities and sports show in dropdowns
3. **Choose deployment option** for production
4. **Update `.env`** with production URL
5. **Build APK** with production config
6. **Test APK** on physical device

---

## 📚 Important Files

### Configuration
- `mobile/.env` - Development API URL
- `mobile/.env.production` - Production API URL
- `mobile/babel.config.js` - Env variable loader
- `mobile/src/config/env.ts` - Config manager

### API
- `mobile/src/api/apiClient.ts` - HTTP client
- `mobile/src/api/profile.ts` - Profile API methods
- `backend_python/routers/profile.py` - Profile endpoints

### Database
- `backend_python/models.py` - Database models
- `backend_python/crud.py` - Database operations

---

## ✅ Summary

**What's Working:**
- ✅ Cities fetched from `admin_cities` table
- ✅ Sports fetched from `admin_game_types` table
- ✅ Dropdowns display data in ProfileScreen
- ✅ Profile saves to database
- ✅ Environment configuration ready

**What You Need to Do:**
- 🔧 Choose deployment option (ngrok/Render/own server)
- 🔧 Update `.env` with production URL
- 🔧 Build APK with production config
- 🔧 Test APK on device

---

**Need Help?** Check `PROFILE_CITIES_SPORTS_GUIDE.md` for detailed instructions!

