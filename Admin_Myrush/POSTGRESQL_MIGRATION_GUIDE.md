# PostgreSQL Migration Guide

## Overview
This guide will help you migrate your MyRush Admin application from MySQL to PostgreSQL.

## Prerequisites
- PostgreSQL installed on your system
- Python 3.8+ installed
- Access to your current MySQL database

---

## Step 1: Install PostgreSQL

### Windows
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer
3. During installation:
   - Set a password for the `postgres` user (remember this!)
   - Default port: 5432
   - Install pgAdmin 4 (recommended for GUI management)

### Verify Installation
Open Command Prompt and run:
```bash
psql --version
```

---

## Step 2: Create PostgreSQL Database

### Option A: Using pgAdmin 4 (Recommended)
1. Open pgAdmin 4
2. Connect to your PostgreSQL server (localhost)
3. Right-click on "Databases" → "Create" → "Database"
4. Name: `myrush`
5. Click "Save"

### Option B: Using Command Line
```bash
psql -U postgres
CREATE DATABASE myrush;
\q
```

---

## Step 3: Import PostgreSQL Schema

### Using Command Line
```bash
cd "c:\Users\ajayp\Downloads\MyRush_Admin (3)\MyRush_Admin\Admin_Myrush"
psql -U postgres -d myrush -f postgresql_schema.sql
```

### Using pgAdmin 4
1. Open pgAdmin 4
2. Navigate to: Servers → PostgreSQL → Databases → myrush
3. Click "Query Tool" (top menu)
4. Open file: `postgresql_schema.sql`
5. Click "Execute" (▶️ button)

You should see all 14 tables created successfully.

---

## Step 4: Update Migration Script Configuration

Edit `migrate_mysql_to_postgresql.py` and update the PostgreSQL password:

```python
POSTGRESQL_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'user': 'postgres',
    'password': 'YOUR_POSTGRES_PASSWORD_HERE',  # ← UPDATE THIS
    'database': 'myrush'
}
```

---

## Step 5: Install Required Python Packages

```bash
cd "c:\Users\ajayp\Downloads\MyRush_Admin (3)\MyRush_Admin\Admin_Myrush\myrush-admin-backend-python"
pip install psycopg2-binary mysql-connector-python
```

---

## Step 6: Run Data Migration

```bash
cd "c:\Users\ajayp\Downloads\MyRush_Admin (3)\MyRush_Admin\Admin_Myrush"
python migrate_mysql_to_postgresql.py
```

This will:
- Connect to your MySQL database
- Connect to your PostgreSQL database
- Migrate all data from MySQL to PostgreSQL
- Convert data types appropriately (JSON → JSONB, JSON arrays → PostgreSQL arrays)

Expected output:
```
============================================================
MySQL to PostgreSQL Migration Tool
============================================================

🔌 Connecting to MySQL...
   ✅ MySQL connected successfully

🔌 Connecting to PostgreSQL...
   ✅ PostgreSQL connected successfully

🚀 Starting migration...

📊 Migrating table: admins
   ✅ Migrated X rows

📊 Migrating table: users
   ✅ Migrated X rows

... (continues for all 14 tables)

============================================================
✅ Migration completed! Total rows migrated: XXX
============================================================
```

---

## Step 7: Update Backend Configuration

Update `.env` file in `myrush-admin-backend-python`:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/myrush
```

Replace `YOUR_PASSWORD` with your actual PostgreSQL password.

---

## Step 8: Update Python Dependencies

```bash
cd myrush-admin-backend-python
pip install -r requirements.txt
```

This will install `psycopg2-binary` (PostgreSQL driver) instead of `mysql-connector-python`.

---

## Step 9: Test Database Connection

Create a test script `test_postgres_connection.py`:

```python
from database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT current_database()"))
        db_name = result.scalar()
        print(f"✅ Connected to PostgreSQL database: {db_name}")
        
        # List all tables
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """))
        
        print("\n📊 Tables in database:")
        for row in result:
            print(f"   - {row[0]}")
            
except Exception as e:
    print(f"❌ Connection failed: {e}")
```

Run it:
```bash
python test_postgres_connection.py
```

---

## Step 10: Start the Backend Server

```bash
uvicorn main:app --reload --port 8000
```

The server should start successfully at `http://localhost:8000`

---

## Step 11: Verify Data in PostgreSQL

### Using pgAdmin 4
1. Navigate to: myrush → Schemas → public → Tables
2. Right-click on any table → "View/Edit Data" → "All Rows"
3. Verify your data has been migrated

### Using Command Line
```bash
psql -U postgres -d myrush
SELECT COUNT(*) FROM admins;
SELECT COUNT(*) FROM admin_cities;
SELECT COUNT(*) FROM admin_branches;
\q
```

---

## Key Differences: MySQL vs PostgreSQL

| Feature | MySQL | PostgreSQL |
|---------|-------|------------|
| **UUID Storage** | `CHAR(36)` | Native `UUID` type |
| **Arrays** | JSON arrays | Native `TEXT[]` arrays |
| **JSON** | `JSON` | `JSONB` (binary, faster) |
| **Auto-increment** | `AUTO_INCREMENT` | `SERIAL` or `uuid_generate_v4()` |
| **Timestamps** | `TIMESTAMP` | `TIMESTAMP WITH TIME ZONE` |
| **Boolean** | `TINYINT(1)` | Native `BOOLEAN` |

---

## Advantages of PostgreSQL

✅ **Native UUID support** - Better performance for UUID primary keys  
✅ **Native array types** - No need to serialize/deserialize JSON  
✅ **JSONB** - Binary JSON with indexing support  
✅ **Better concurrency** - MVCC (Multi-Version Concurrency Control)  
✅ **Advanced features** - Full-text search, GIS support, window functions  
✅ **ACID compliance** - Stronger data integrity guarantees  
✅ **Open source** - Truly free with no commercial restrictions  

---

## Troubleshooting

### Error: "psql: command not found"
Add PostgreSQL to your PATH:
1. Find PostgreSQL bin directory (e.g., `C:\Program Files\PostgreSQL\16\bin`)
2. Add to System Environment Variables → Path

### Error: "password authentication failed"
- Double-check your PostgreSQL password
- Update it in both `.env` and `migrate_mysql_to_postgresql.py`

### Error: "database does not exist"
Create the database first:
```bash
psql -U postgres
CREATE DATABASE myrush;
```

### Migration script errors
- Ensure MySQL is running on port 3308
- Verify MySQL credentials in the script
- Check that PostgreSQL schema has been imported

### Backend connection errors
- Verify `.env` file has correct PostgreSQL URL
- Ensure PostgreSQL service is running
- Check firewall settings (port 5432)

---

## Rollback Plan

If you need to rollback to MySQL:

1. Keep your MySQL database intact (don't delete it)
2. Update `.env`:
   ```env
   DATABASE_URL=mysql+mysqlconnector://root:9640351007Ajay%40@127.0.0.1:3308/myrush
   ```
3. Reinstall MySQL connector:
   ```bash
   pip uninstall psycopg2-binary
   pip install mysql-connector-python==9.1.0
   ```
4. Revert `models.py` and `database.py` to use MySQL types

---

## Next Steps After Migration

1. ✅ Test all API endpoints
2. ✅ Verify file uploads work correctly
3. ✅ Test frontend integration
4. ✅ Run performance tests
5. ✅ Update any SQL queries to use PostgreSQL syntax
6. ✅ Set up PostgreSQL backups
7. ✅ Configure PostgreSQL for production (connection pooling, etc.)

---

## Production Recommendations

### PostgreSQL Configuration
Edit `postgresql.conf`:
```
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
```

### Connection Pooling
Consider using PgBouncer for connection pooling in production.

### Backups
Set up automated backups:
```bash
pg_dump -U postgres myrush > backup_$(date +%Y%m%d).sql
```

### Monitoring
- Use pgAdmin 4 for monitoring
- Enable PostgreSQL logging
- Monitor query performance with `EXPLAIN ANALYZE`

---

## Support

If you encounter any issues:
1. Check PostgreSQL logs: `C:\Program Files\PostgreSQL\16\data\log`
2. Verify all services are running
3. Test connections individually (MySQL → PostgreSQL)
4. Review error messages carefully

---

**Migration completed successfully? 🎉**

You can now safely keep MySQL as a backup and use PostgreSQL as your primary database!
