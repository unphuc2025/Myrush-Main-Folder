# 🔧 Fix Database Connection Error

## Problem
Backend is trying to connect to `localhost:5432` instead of Supabase database.

**Error:**
```
connection to server at "localhost" (::1), port 5432 failed: 
FATAL: password authentication failed for user "postgres"
```

## Root Cause
The `.env` file is missing in `backend_python/` folder, so it's using the default fallback connection.

---

## ✅ Solution

### Option 1: Use Interactive Setup Script (Easiest)

1. **Open terminal in backend folder:**
   ```bash
   cd MYRUSH-USER-APP/backend_python
   ```

2. **Run the setup script:**
   ```bash
   python setup_env.py
   ```

3. **Enter your Supabase password** when prompted

4. **Restart the backend server**

---

### Option 2: Manual Setup

1. **Create `.env` file** in `MYRUSH-USER-APP/backend_python/` folder

2. **Add this content** (replace `YOUR_PASSWORD` with your actual Supabase password):
   ```env
   # Database Configuration
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.vqglejkydwtopmllymuf.supabase.co:5432/postgres?sslmode=require

   # JWT Configuration
   SECRET_KEY=myrush_secret_key_change_this_in_production_12345
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

3. **Save the file**

4. **Restart the backend server**

---

## 🔍 How to Find Your Supabase Password

1. Go to your Supabase project: https://supabase.com/dashboard/project/vqglejkydwtopmllymuf

2. Click on **Settings** (gear icon) → **Database**

3. Scroll down to **Connection string**

4. Click **Show** to reveal the password

5. Copy the password (it's the part after `postgres:` and before `@`)

---

## ✅ Verify It Works

After creating the `.env` file:

1. **Check the environment:**
   ```bash
   cd MYRUSH-USER-APP/backend_python
   python check_env.py
   ```

   Should show:
   ```
   postgresql://postgres:***@db.vqglejkydwtopmllymuf.supabase.co:5432/postgres?sslmode=require
   ```

2. **Test the endpoints:**
   ```bash
   python test_profile_endpoints.py
   ```

   Should show:
   ```
   ✅ Success! Found X cities
   ✅ Success! Found X game types
   ```

---

## 🚀 Restart Backend

After fixing the `.env` file:

```bash
cd MYRUSH-USER-APP/backend_python
python -m uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

---

## 📝 Quick Reference

**Your Supabase Details:**
- Host: `db.vqglejkydwtopmllymuf.supabase.co`
- Port: `5432`
- Database: `postgres`
- Username: `postgres`
- Password: (from Supabase dashboard)
- SSL: Required

**Connection String Format:**
```
postgresql://postgres:PASSWORD@db.vqglejkydwtopmllymuf.supabase.co:5432/postgres?sslmode=require
```

---

## ⚠️ Important Notes

1. **Never commit `.env` to git** - It contains sensitive passwords
2. The `.env` file is already in `.gitignore`
3. Keep your Supabase password secure
4. Use different passwords for development and production

---

**Once fixed, your profile screen will work perfectly!** 🎉

