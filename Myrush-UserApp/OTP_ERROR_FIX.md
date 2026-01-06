# OTP 500 Error - Root Cause and Fix

## Problem
You're getting a **500 Internal Server Error** when trying to send OTP because:

```
ERROR: Can't connect to MySQL server on '127.0.0.1:3308' (10061)
```

## Root Cause
**The MySQL server on port 3308 is NOT running.** The backend is trying to connect to MySQL to store OTP records, but the database server is down.

## Solution

### Option 1: Start MySQL Server (Recommended)

1. **If using XAMPP:**
   - Open XAMPP Control Panel
   - Click "Start" next to MySQL
   - Make sure it's running on port 3308

2. **If using MySQL Workbench:**
   - Start the MySQL service from Services (Windows)
   - Or use: `net start MySQL80` (or your MySQL service name)

3. **Verify MySQL is running:**
   ```bash
   cd MYRUSH-USER-APP\backend_python
   python check_mysql.py
   ```

4. **Run the migration to create tables:**
   ```bash
   cd MYRUSH-USER-APP\backend_python
   python create_db.py
   ```

5. **Restart the backend server:**
   ```bash
   cd MYRUSH-USER-APP\backend_python
   start_server.bat
   ```

### Option 2: Use SQLite (Quick Fix for Development)

If you don't want to use MySQL, you can switch to SQLite:

1. **Edit `database.py`:**
   - Change the `SQLALCHEMY_DATABASE_URL` to use SQLite:
   ```python
   SQLALCHEMY_DATABASE_URL = "sqlite:///./myrush.db"
   ```

2. **Create the SQLite database:**
   ```bash
   cd MYRUSH-USER-APP\backend_python
   python create_db.py
   ```

3. **Restart the backend server:**
   ```bash
   cd MYRUSH-USER-APP\backend_python
   start_server.bat
   ```

## Current Status

- ✅ OTP endpoint code is correct
- ✅ OTP table schema is defined
- ✅ Error handling is in place
- ❌ **MySQL server is NOT running** ← This is the issue!

## Next Steps

1. Start MySQL server (Option 1) OR switch to SQLite (Option 2)
2. Run migrations to create tables
3. Restart the backend server
4. Test OTP sending again

## Testing After Fix

Once MySQL is running, test the OTP endpoint:

```bash
curl -X POST http://192.168.1.7:8000/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+919676402161"}'
```

Expected response:
```json
{
  "message": "OTP sent successfully",
  "success": true,
  "verification_id": "1",
  "otp_code": "12345"
}
```

## Development Mode

The OTP endpoint uses a fixed OTP code `12345` for development, so you don't need actual SMS integration. Just make sure the database is running to store the OTP records.
