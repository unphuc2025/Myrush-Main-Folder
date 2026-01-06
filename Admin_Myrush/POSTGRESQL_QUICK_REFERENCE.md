# PostgreSQL Migration - Quick Reference

## 🚀 Quick Start (Automated)

```bash
cd "c:\Users\ajayp\Downloads\MyRush_Admin (3)\MyRush_Admin\Admin_Myrush"
setup_postgresql.bat
```

This will:
- ✅ Check PostgreSQL installation
- ✅ Create `myrush` database
- ✅ Import schema
- ✅ Install Python dependencies
- ✅ Update .env file

---

## 📋 Manual Steps

### 1. Create Database
```bash
psql -U postgres
CREATE DATABASE myrush;
\q
```

### 2. Import Schema
```bash
psql -U postgres -d myrush -f postgresql_schema.sql
```

### 3. Update .env
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/myrush
```

### 4. Install Dependencies
```bash
cd myrush-admin-backend-python
pip install -r requirements.txt
```

### 5. Migrate Data
```bash
# Edit migrate_mysql_to_postgresql.py first (update password)
python migrate_mysql_to_postgresql.py
```

### 6. Test Connection
```bash
python test_postgres_connection.py
```

### 7. Start Backend
```bash
cd myrush-admin-backend-python
uvicorn main:app --reload --port 8000
```

---

## 🔍 Useful PostgreSQL Commands

### Connect to Database
```bash
psql -U postgres -d myrush
```

### List All Tables
```sql
\dt
```

### View Table Structure
```sql
\d table_name
```

### Count Rows
```sql
SELECT COUNT(*) FROM table_name;
```

### View All Data
```sql
SELECT * FROM table_name LIMIT 10;
```

### Exit psql
```sql
\q
```

---

## 📊 Verify Migration

### Check Table Counts
```sql
SELECT 
    schemaname,
    tablename,
    (SELECT COUNT(*) FROM pg_catalog.pg_class c 
     WHERE c.relname = t.tablename) as row_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Compare with MySQL
```bash
# MySQL
mysql -u root -p -e "USE myrush; SELECT COUNT(*) FROM admin_cities;"

# PostgreSQL
psql -U postgres -d myrush -c "SELECT COUNT(*) FROM admin_cities;"
```

---

## 🛠️ Troubleshooting

### PostgreSQL not in PATH
Add to PATH: `C:\Program Files\PostgreSQL\16\bin`

### Password Authentication Failed
Update password in:
- `.env` file
- `migrate_mysql_to_postgresql.py`

### Connection Refused
Check if PostgreSQL service is running:
```bash
# Windows Services
services.msc
# Look for "postgresql-x64-16"
```

### Port Already in Use
PostgreSQL default port: 5432
Check if another service is using it

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `postgresql_schema.sql` | PostgreSQL database schema |
| `migrate_mysql_to_postgresql.py` | Data migration script |
| `test_postgres_connection.py` | Connection test script |
| `setup_postgresql.bat` | Automated setup script |
| `POSTGRESQL_MIGRATION_GUIDE.md` | Detailed migration guide |

---

## ⚡ Key Changes

### Database Configuration
```python
# OLD (MySQL)
DATABASE_URL=mysql+mysqlconnector://root:password@localhost:3308/myrush

# NEW (PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/myrush
```

### Python Models
```python
# OLD
from sqlalchemy import JSON
id = Column(String(36), primary_key=True)
images = Column(JSON)

# NEW
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
id = Column(UUID(as_uuid=True), primary_key=True)
images = Column(ARRAY(Text))
```

### Dependencies
```txt
# OLD
mysql-connector-python==9.1.0

# NEW
psycopg2-binary==2.9.9
```

---

## 🎯 Migration Checklist

- [ ] PostgreSQL installed
- [ ] Database `myrush` created
- [ ] Schema imported successfully
- [ ] Python dependencies updated
- [ ] `.env` file updated
- [ ] Migration script password updated
- [ ] Data migrated from MySQL
- [ ] Connection test passed
- [ ] Backend server starts successfully
- [ ] API endpoints tested
- [ ] Frontend connected to new backend

---

## 📞 Need Help?

Refer to: `POSTGRESQL_MIGRATION_GUIDE.md` for detailed instructions

---

**Happy Migrating! 🚀**
