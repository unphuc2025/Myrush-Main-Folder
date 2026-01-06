# Quick Start Guide - MyRush Unified Backend

## 🚀 Get Started in 5 Minutes

### Step 1: Navigate to Unified Backend
```bash
cd c:\Users\ajayp\Desktop\myrush-Main-folder\unified-backend
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Configure Environment
```bash
# Copy the example .env file
copy .env.example .env

# Edit .env and update DATABASE_URL with your actual password
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.vqglejkydwtopmllymuf.supabase.co:5432/MYRUSH?sslmode=require
```

### Step 4: Run the Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 5: Test the API
Open your browser and visit:
- **API Documentation**: http://localhost:8000/docs
- **Admin API**: http://localhost:8000/api/admin
- **User API**: http://localhost:8000/api/user

---

## 🧪 Quick Tests

### Test Admin Login
```bash
curl -X POST http://localhost:8000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"mobile\": \"YOUR_ADMIN_MOBILE\", \"password\": \"YOUR_ADMIN_PASSWORD\"}"
```

### Test User OTP Login
```bash
# Send OTP
curl -X POST http://localhost:8000/api/user/auth/send-otp \
  -H "Content-Type: application/json" \
  -d "{\"phone_number\": \"9876543210\"}"

# Verify OTP (use dummy OTP: 12345)
curl -X POST http://localhost:8000/api/user/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"phone_number\": \"9876543210\", \"otp_code\": \"12345\"}"
```

---

## 📊 What's Different?

### API Endpoints Changed

**Admin Panel:**
- OLD: `http://localhost:8000/api/cities`
- NEW: `http://localhost:8000/api/admin/cities`

**User App:**
- OLD: `http://localhost:8000/auth/send-otp`
- NEW: `http://localhost:8000/api/user/auth/send-otp`

### Single Database
- Both admin and user apps now use the same backend
- Single `booking` table for all bookings
- Shared `users` and `reviews` tables

---

## 🔧 Troubleshooting

### Database Connection Error
```
Check your .env file DATABASE_URL
Ensure PostgreSQL is accessible
Test with: psql "postgresql://postgres:PASSWORD@db.vqglejkydwtopmllymuf.supabase.co:5432/MYRUSH?sslmode=require"
```

### Import Errors
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Port Already in Use
```bash
# Use a different port
uvicorn main:app --reload --port 8001
```

---

## 📱 Update Your Frontends

### Admin Panel
Update API base URL in your config:
```javascript
const API_BASE_URL = 'http://localhost:8000/api/admin';
```

### User Mobile App
Update API base URL in your config:
```javascript
const API_BASE_URL = 'http://localhost:8000/api/user';
```

See `FRONTEND_MIGRATION_GUIDE.md` for detailed instructions.

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ Server starts without errors
- ✅ http://localhost:8000/docs shows API documentation
- ✅ Admin login returns a token
- ✅ User OTP login works
- ✅ Bookings can be created and retrieved

---

## 📚 Next Steps

1. Read `README.md` for full documentation
2. Review `FRONTEND_MIGRATION_GUIDE.md` to update frontends
3. Test all endpoints using http://localhost:8000/docs
4. Update your admin panel to use `/api/admin/*`
5. Update your mobile app to use `/api/user/*`

---

## 🆘 Need Help?

- Check server logs for errors
- Visit http://localhost:8000/docs for interactive API testing
- Review `README.md` for detailed documentation
- Contact the development team

---

## 🎉 You're All Set!

Your unified backend is now running. Both admin panel and user app can connect to the same backend server!

**Admin API**: http://localhost:8000/api/admin  
**User API**: http://localhost:8000/api/user  
**API Docs**: http://localhost:8000/docs
