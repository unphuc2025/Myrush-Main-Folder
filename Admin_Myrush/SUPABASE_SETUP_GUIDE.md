# 🚀 Supabase PostgreSQL Migration - Quick Setup

## ✅ Status: Dependencies Installed

All required Python packages have been installed:
- ✅ psycopg2-binary (PostgreSQL driver)
- ✅ python-dotenv (Environment variables)
- ✅ mysql-connector-python (MySQL driver for migration)

---

## 📋 Next Steps

### Step 1: Add Your Supabase Password

**Edit this file:** `myrush-admin-backend-python/.env`

Replace `YOUR_PASSWORD` with your actual Supabase password:

```env
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.vqglejkydwtopmllymuf.supabase.co:5432/postgres?sslmode=require
```

**Example:**
```env
DATABASE_URL=postgresql://postgres:MySecurePass123@db.vqglejkydwtopmllymuf.supabase.co:5432/postgres?sslmode=require
```

---

### Step 2: Import Schema to Supabase

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to**: Your Project → SQL Editor
3. **Click**: "New Query"
4. **Copy & Paste**: The entire content of `postgresql_schema.sql`
5. **Click**: "Run" button
6. **Verify**: Check "Table Editor" to see all 14 tables created

**Alternative Method:**
- Upload `postgresql_schema.sql` file directly in SQL Editor

---

### Step 3: Run Data Migration

Once you've added your password and imported the schema:

```bash
cd "c:\Users\ajayp\Downloads\MyRush_Admin (3)\MyRush_Admin\Admin_Myrush"
python migrate_mysql_to_postgresql.py
```

This will:
- ✅ Connect to your MySQL database (port 3308)
- ✅ Connect to your Supabase PostgreSQL database
- ✅ Migrate all data from MySQL to Supabase
- ✅ Convert data types automatically

---

### Step 4: Test Connection

```bash
cd "c:\Users\ajayp\Downloads\MyRush_Admin (3)\MyRush_Admin\Admin_Myrush"
python test_postgres_connection.py
```

---

### Step 5: Start Backend

```bash
cd myrush-admin-backend-python
uvicorn main:app --reload --port 8000
```

---

## 🔐 Security Notes

### ⚠️ IMPORTANT: Never commit your password to Git!

Add to `.gitignore`:
```
.env
*.env
```

### 🔒 Password Best Practices

1. **Use a strong password** (Supabase requires this)
2. **Don't share** your `.env` file
3. **Rotate passwords** regularly
4. **Use environment variables** in production

---

## 📊 What Will Be Migrated

All **14 tables** from MySQL to Supabase:

### Admin Tables (10)
- ✅ admins
- ✅ admin_cities
- ✅ admin_areas
- ✅ admin_game_types
- ✅ admin_amenities
- ✅ admin_branches
- ✅ admin_branch_game_types
- ✅ admin_branch_amenities
- ✅ admin_courts
- ✅ adminvenues

### User Tables (4)
- ✅ users
- ✅ profiles
- ✅ otp_verifications
- ✅ booking

---

## 🌐 Supabase Connection Details

```
Host:     db.vqglejkydwtopmllymuf.supabase.co
Port:     5432
Database: postgres
User:     postgres
Password: [Your Supabase Password]
SSL Mode: require
```

---

## 🛠️ Troubleshooting

### Error: "Password not configured"
- Update `.env` file with your actual Supabase password
- Remove `YOUR_PASSWORD` placeholder

### Error: "Connection refused"
- Check your internet connection
- Verify Supabase project is active
- Check if your IP is allowed (Supabase allows all by default)

### Error: "relation does not exist"
- Import `postgresql_schema.sql` in Supabase SQL Editor first
- Verify tables are created in Table Editor

### Error: "SSL connection required"
- Make sure `?sslmode=require` is in your DATABASE_URL
- This is required for Supabase connections

---

## ✨ Benefits of Supabase PostgreSQL

1. **Cloud-Hosted**: No local PostgreSQL installation needed
2. **Auto-Backups**: Daily automated backups
3. **Scalable**: Easily scale as your app grows
4. **Dashboard**: Visual table editor and SQL editor
5. **Real-time**: Built-in real-time subscriptions
6. **Auth**: Optional built-in authentication
7. **Storage**: Built-in file storage
8. **Free Tier**: Generous free tier for development

---

## 📝 Quick Commands

### Check Supabase Connection
```bash
python test_postgres_connection.py
```

### Run Migration
```bash
python migrate_mysql_to_postgresql.py
```

### Start Backend
```bash
cd myrush-admin-backend-python
uvicorn main:app --reload
```

### View Logs
```bash
# Backend will show connection status and errors
```

---

## 🎯 Migration Checklist

- [ ] Supabase password added to `.env` file
- [ ] Schema imported in Supabase SQL Editor
- [ ] All 14 tables visible in Supabase Table Editor
- [ ] Migration script executed successfully
- [ ] Connection test passed
- [ ] Backend server started
- [ ] API endpoints tested

---

## 📞 Need Help?

### Supabase Dashboard
- **URL**: https://supabase.com/dashboard
- **Docs**: https://supabase.com/docs

### Check Your Project
1. Go to Supabase Dashboard
2. Select your project
3. Navigate to "Table Editor" to see tables
4. Navigate to "SQL Editor" to run queries

---

## 🚀 Ready to Migrate!

**Current Status:**
- ✅ Dependencies installed
- ⏳ Waiting for password in `.env` file
- ⏳ Waiting for schema import in Supabase

**Next Action:**
1. Add your Supabase password to `.env`
2. Import schema in Supabase SQL Editor
3. Run: `python migrate_mysql_to_postgresql.py`

---

**Good luck! 🎉**
