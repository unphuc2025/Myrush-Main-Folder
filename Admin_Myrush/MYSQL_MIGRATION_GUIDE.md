# MySQL Migration Guide

## Current Status

✅ MySQL schema file generated (`mysql_schema.sql`)
✅ Python backend structure created
✅ Python dependencies installed
⏳ Waiting for database connection configuration

## Next Steps

### 1. Import Schema to MySQL

You have two options:

#### Option A: Using MySQL Workbench (Recommended)
1. Open MySQL Workbench
2. Connect to your local MySQL server
3. Confirm the `myrush` database exists (you mentioned you created it)
4. Go to **File → Open SQL Script**
5. Select `mysql_schema.sql` from the project root
6. Click the **⚡ Execute** button
7. Refresh the schemas panel - you should see all 14 tables

#### Option B: Using MySQL CLI
1. Open Command Prompt
2. Navigate to `myrush-admin-backend-python` folder
3. Run: `import_schema.bat`
4. Enter your MySQL root password when prompted

### 2. Configure Database Connection

Update the `.env` file in `myrush-admin-backend-python`:

```env
DATABASE_URL=mysql+mysqlconnector://root:YOUR_PASSWORD@localhost:3306/myrush
```

Replace `YOUR_PASSWORD` with your actual MySQL root password.

If you don't have a password:
```env
DATABASE_URL=mysql+mysqlconnector://root:@localhost:3306/myrush
```

### 3. Test Database Connection

Run:
```bash
cd myrush-admin-backend-python
python test_db_connection.py
```

You should see:
```
✅ Successfully connected to database: myrush
📊 Listing tables:
   - admins
   - users
   - profiles
   ... (all 14 tables)
```

### 4. Start Python Backend Server

Once the connection test passes:
```bash
uvicorn main:app --reload --port 8000
```

The server will start at: `http://localhost:8000`

### 5. Update Frontend API URL

In your frontend `.env` file:
```env
VITE_API_URL=http://localhost:8000
```

## Database Schema Overview

The following 14 tables have been created:

### Admin Tables
- `admins` - Admin user accounts
- `admin_cities` - Cities
- `admin_areas` - Areas within cities
- `admin_game_types` - Types of games (e.g., Cricket, Football)
- `admin_amenities` - Available amenities
- `admin_branches` - Branch locations
- `admin_branch_game_types` - Junction table (branches ↔ game types)
- `admin_branch_amenities` - Junction table (branches ↔ amenities)
- `admin_courts` - Courts within branches
- `adminvenues` - Legacy venue table

### User Tables
- `users` - User accounts
- `profiles` - User profiles
- `otp_verifications` - OTP verification records
- `booking` - Bookings (links to users and adminvenues)

## Key Differences from PostgreSQL

- **UUIDs**: Stored as `CHAR(36)` instead of native UUID type
- **Arrays**: Converted to JSON arrays (e.g., `images`, `videos`, `favorite_sports`)
- **JSONB**: Converted to JSON
- **Timestamps**: Using MySQL `TIMESTAMP` with automatic updates

## Troubleshooting

### Connection Issues
- Verify MySQL is running
- Check username/password in `.env`
- Ensure `myrush` database exists
- Check MySQL is listening on port 3306

### Import Issues
- Make sure you're in the correct directory
- Verify MySQL CLI is in your PATH
- Check file permissions

### Python Issues
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Check Python version (3.8+ required)

## What's Next

After successful connection:
1. I will implement the API routers (cities, areas, branches, etc.)
2. Convert Node.js controller logic to Python FastAPI endpoints
3. Test all CRUD operations
4. Migrate file upload logic
5. Update frontend to use new Python backend
