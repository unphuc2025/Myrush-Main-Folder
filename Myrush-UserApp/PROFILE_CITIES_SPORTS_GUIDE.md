# ✅ Profile Screen - Cities & Sports Dropdown Guide

## Current Status

### ✅ Already Implemented!

Your ProfileScreen (`PlayerProfileScreen.tsx`) **already fetches and displays**:
- **Cities** from `admin_cities` table
- **Favorite Sports** from `admin_game_types` table

### How It Works

1. **Backend API Endpoints** (Already Working ✅)
   - `GET /profile/cities` - Fetches all active cities
   - `GET /profile/game-types` - Fetches all active game types

2. **Frontend Implementation** (Already Working ✅)
   - Fetches data on component mount
   - Displays cities in dropdown
   - Displays sports in multi-select dropdown
   - Saves selections to user profile

---

## 🚀 For Downloaded APK to Work

### The Problem

The API URL is currently set to `http://192.168.1.2:5000` which only works on your local network.

### Solutions

You have **3 options** to make the APK work anywhere:

#### Option 1: Use Ngrok (Quick & Easy for Testing) ⚡

1. **Install ngrok:**
   ```bash
   # Download from https://ngrok.com/download
   # Or use chocolatey:
   choco install ngrok
   ```

2. **Start your backend:**
   ```bash
   cd MYRUSH-USER-APP/backend_python
   python -m uvicorn main:app --host 0.0.0.0 --port 5000 --reload
   ```

3. **Create ngrok tunnel:**
   ```bash
   ngrok http 5000
   ```

4. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`)

5. **Update `.env` file:**
   ```env
   API_BASE_URL=https://abc123.ngrok.io
   ```

6. **Rebuild your APK:**
   ```bash
   cd MYRUSH-USER-APP/mobile
   npx eas build --platform android --profile preview
   ```

**Note:** Ngrok URLs change every time you restart ngrok (unless you have a paid plan).

---

#### Option 2: Deploy Backend to Cloud (Recommended for Production) ☁️

**Deploy to Render.com (Free Tier):**

1. **Create account** at https://render.com

2. **Create New Web Service**
   - Connect your GitHub repo
   - Root Directory: `MYRUSH-USER-APP/backend_python`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Add Environment Variables** in Render dashboard:
   ```
   DATABASE_URL=postgresql://postgres:***@db.vqglejkydwtopmllymuf.supabase.co:5432/MYRUSH?sslmode=require
   SECRET_KEY=your_super_secret_key_here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

4. **Get your Render URL** (e.g., `https://myrush-api.onrender.com`)

5. **Update `.env` file:**
   ```env
   API_BASE_URL=https://myrush-api.onrender.com
   ```

6. **Rebuild your APK**

---

#### Option 3: Use Your Own Server 🖥️

If you have a VPS or dedicated server:

1. **Deploy backend** to your server
2. **Get public IP or domain** (e.g., `http://your-server.com:5000`)
3. **Update `.env` file:**
   ```env
   API_BASE_URL=http://your-server.com:5000
   ```
4. **Rebuild your APK**

---

## 📝 Configuration Files Created

### 1. `.env` (Development)
```env
API_BASE_URL=http://192.168.1.2:5000
APP_NAME=MyRush
APP_ENV=development
```

### 2. `.env.production` (Production)
```env
API_BASE_URL=https://your-production-url.com
APP_NAME=MyRush
APP_ENV=production
```

### 3. `babel.config.js`
Configured to load environment variables from `.env` files.

### 4. `src/config/env.ts`
Centralized configuration management.

---

## 🔧 How to Update API URL

### For Testing (Expo Go):
1. Edit `MYRUSH-USER-APP/mobile/.env`
2. Change `API_BASE_URL` to your ngrok URL or server URL
3. Restart Expo: Press `r` in terminal or shake device → Reload

### For APK Build:
1. Edit `MYRUSH-USER-APP/mobile/.env`
2. Change `API_BASE_URL` to your production URL
3. Also update `eas.json` → `build.preview.env.API_BASE_URL`
4. Rebuild APK:
   ```bash
   cd MYRUSH-USER-APP/mobile
   npx eas build --platform android --profile preview
   ```

---

## ✅ Testing Checklist

- [ ] Backend is running and accessible
- [ ] Cities are populated in `admin_cities` table
- [ ] Game types are populated in `admin_game_types` table
- [ ] API endpoints return data:
  - Test: `http://your-api-url/profile/cities`
  - Test: `http://your-api-url/profile/game-types`
- [ ] Mobile app can connect to backend
- [ ] Dropdowns show cities and sports
- [ ] Profile saves successfully

---

## 🐛 Troubleshooting

### Cities/Sports not showing in dropdown?

1. **Check backend is running:**
   ```bash
   curl http://192.168.1.2:5000/profile/cities
   curl http://192.168.1.2:5000/profile/game-types
   ```

2. **Check database has data:**
   ```sql
   SELECT * FROM admin_cities WHERE is_active = true;
   SELECT * FROM admin_game_types WHERE is_active = true;
   ```

3. **Check mobile app logs:**
   - Open Expo app
   - Shake device → Debug Remote JS
   - Check console for errors

### APK not connecting to backend?

1. **Verify API URL is accessible from internet**
2. **Check firewall settings**
3. **Ensure backend allows CORS** (already configured in your FastAPI app)
4. **Test API URL in browser** from your phone

---

## 📱 Next Steps

1. **Choose deployment option** (ngrok for testing, Render for production)
2. **Update `.env` file** with your API URL
3. **Test in Expo** to make sure it works
4. **Build APK** with updated configuration
5. **Install and test APK** on physical device

---

## 💡 Pro Tips

- Keep `.env` in `.gitignore` (already done)
- Use different URLs for development and production
- Test thoroughly before building APK
- Consider using a custom domain for production
- Monitor your backend logs for errors

---

**Need help?** Check the backend logs and mobile app console for detailed error messages.

