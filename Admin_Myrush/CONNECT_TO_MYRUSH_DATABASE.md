# Connect to Supabase MYRUSH Database - Setup Guide

## 🎯 Overview
This guide will help you connect your MyRush Admin application to the **MYRUSH** database you created in pgAdmin 4 on Supabase.

## 📋 Connection Details

Based on your JDBC URL, here are your connection details:

```
Host: db.vqglejkydwtopmllymuf.supabase.co
Port: 5432 (Direct Connection)
Database: MYRUSH
Username: postgres
SSL Mode: require
```

## 🔧 Step 1: Set Your Supabase Password

You need to update the `.env` file with your actual Supabase password.

### Find Your Supabase Password

1. **Option 1 - From Supabase Dashboard:**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to **Settings** → **Database**
   - Look for **Connection String** or **Database Password**

2. **Option 2 - From pgAdmin 4:**
   - If you saved the password when connecting to pgAdmin 4, use that same password

### Update the .env File

Open the file:
```
myrush-admin-backend-python\.env
```

Replace `YOUR_PASSWORD` with your actual Supabase password:

```bash
# Before:
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.vqglejkydwtopmllymuf.supabase.co:5432/MYRUSH?sslmode=require

# After (example):
DATABASE_URL=postgresql://postgres:your_actual_password_here@db.vqglejkydwtopmllymuf.supabase.co:5432/MYRUSH?sslmode=require
```

⚠️ **Important:** Replace `your_actual_password_here` with your real password!

## ✅ Step 2: Test the Connection

Run the test script to verify the connection:

```bash
cd myrush-admin-backend-python
python test_myrush_connection.py
```

### Expected Output

If successful, you should see:
```
✅ Connection successful!
📊 PostgreSQL Version: PostgreSQL 15.x on ...
📋 Tables in MYRUSH database (X tables):
   ✓ admins (X rows)
   ✓ users (X rows)
   ✓ admin_cities (X rows)
   ...
```

### If Connection Fails

**Error: "password authentication failed"**
- Double-check your password in the `.env` file
- Make sure there are no extra spaces or quotes

**Error: "database MYRUSH does not exist"**
- Verify you created the MYRUSH database in pgAdmin 4
- Check the database name is exactly "MYRUSH" (case-sensitive)

**Error: "could not connect to server"**
- Check your internet connection
- Verify port 5432 is not blocked by your firewall
- Try using the connection pooler (port 6543) if port 5432 is blocked

## 📊 Step 3: Import Schema (If Tables Don't Exist)

If the test shows "No tables found", you need to import your schema:

### Option 1: Using pgAdmin 4

1. Open pgAdmin 4
2. Connect to your Supabase server
3. Right-click on **MYRUSH** database → **Query Tool**
4. Open the file: `postgresql_schema_myrush.sql`
5. Execute the SQL script

### Option 2: Using Command Line

```bash
# From the Admin_Myrush directory
psql "postgresql://postgres:YOUR_PASSWORD@db.vqglejkydwtopmllymuf.supabase.co:5432/MYRUSH?sslmode=require" -f postgresql_schema_myrush.sql
```

## 🚀 Step 4: Start Your Backend

Once the connection test is successful, start your backend:

```bash
cd myrush-admin-backend-python
uvicorn main:app --reload
```

Your backend will now connect to the MYRUSH database on Supabase!

## 🌐 Step 5: Access Your Application

- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Frontend:** (Start your frontend separately)

## 📝 Configuration Files Updated

The following files have been updated to connect to your MYRUSH database:

1. **`.env`** - Database connection URL
2. **`database.py`** - SQLAlchemy configuration

## 🔄 Alternative: Using Connection Pooler (Port 6543)

If port 5432 is blocked by your firewall, you can use the connection pooler:

Update your `.env` file to use port 6543:

```bash
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/MYRUSH?sslmode=require
```

## 🆘 Troubleshooting

### Issue: "relation does not exist"
- Make sure you imported the schema into the MYRUSH database
- Verify you're connected to the correct database (not 'postgres')

### Issue: Firewall blocking port 5432
- Use the connection pooler (port 6543) as shown above
- Or configure your firewall to allow outbound connections to port 5432

### Issue: SSL connection error
- Make sure `sslmode=require` is in your connection URL
- Supabase requires SSL connections

## 📚 Next Steps

1. ✅ Set your password in `.env`
2. ✅ Run `test_myrush_connection.py` to verify connection
3. ✅ Import schema if needed
4. ✅ Start your backend with `uvicorn main:app --reload`
5. ✅ Test your API endpoints at http://localhost:8000/docs

## 🎉 Success!

Once you see "Connection successful" in the test script, your application is ready to use the MYRUSH database on Supabase. All your data will be stored in the cloud and accessible globally!

---

**Need Help?** If you encounter any issues, check the error messages from the test script for specific troubleshooting steps.
