# Mobile App API Integration Guide

## Backend Migration: Supabase → Python/MySQL

Your backend has been migrated from Supabase to a local Python/FastAPI server with MySQL.

---

## What Changed

### Old Setup:
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);
```

### New Setup:
```javascript
const API_BASE_URL = 'http://localhost:8000';  // or your server IP

// For authentication
async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  // Store data.access_token for subsequent requests
}
```

---

## API Endpoint Changes

### Authentication

**Register:**
```javascript
// OLD: Supabase
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password
});

// NEW: FastAPI
const response = await fetch(`${API_BASE_URL}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: email,
    password: password,
    first_name: firstName,
    last_name: lastName
  })
});
```

**Login:**
```javascript
// OLD: Supabase
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password
});

// NEW: FastAPI (OAuth2 format)
const formData = new FormData();
formData.append('username', email);  // Note: field is called 'username'
formData.append('password', password);

const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  body: formData
});
const data = await response.json();
// Save token: data.access_token
```

**Authenticated Requests:**
```javascript
// For all authenticated endpoints, add Authorization header
const response = await fetch(`${API_BASE_URL}/profile/`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

---

## Profile Management

**Create/Update Profile:**
```javascript
// OLD: Supabase
const { data, error } = await supabase
  .from('profiles')
  .upsert({ phone_number: phone, full_name: name, ... });

// NEW: FastAPI
const response = await fetch(`${API_BASE_URL}/profile/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    phone_number: phone,
    full_name: name,
    age: age,
    city: city,
    // ... other fields
  })
});
```

**Get Profile:**
```javascript
// NEW: FastAPI
const response = await fetch(`${API_BASE_URL}/profile/`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

---

## Bookings

**Create Booking:**
```javascript
// NEW: FastAPI
const response = await fetch(`${API_BASE_URL}/bookings/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    venue_id: venueId,
    booking_date: "2024-12-03",  // YYYY-MM-DD
    start_time: "14:00",         // HH:MM
    duration_minutes: 60,
    number_of_players: 2,
    team_name: "Team A",
    special_requests: "Notes here"
  })
});
```

**Get Bookings:**
```javascript
// NEW: FastAPI
const response = await fetch(`${API_BASE_URL}/bookings/`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

---

## Configuration for Different Devices

### Android Emulator:
```javascript
const API_BASE_URL = 'http://10.0.2.2:8000';
```

### iOS Simulator:
```javascript
const API_BASE_URL = 'http://localhost:8000';
```

### Physical Device:
```javascript
// Use your computer's local IP address
const API_BASE_URL = 'http://192.168.1.x:8000';
// To find your IP:
// Windows: ipconfig
// Mac/Linux: ifconfig
```

---

## Error Handling

### Response Format:
```javascript
// Success
{
  "success": true,
  "message": "...",
  "data": { ... }
}

// Error
{
  "detail": "Error message"
}
```

### Example Error Handling:
```javascript
const response = await fetch(url, options);
if (!response.ok) {
  const error = await response.json();
  console.error('API Error:', error.detail);
  // Handle error
}
const data = await response.json();
```

---

## Token Storage

**Save token after login:**
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// After successful login
await AsyncStorage.setItem('accessToken', data.access_token);
```

**Use token for requests:**
```javascript
const token = await AsyncStorage.getItem('accessToken');
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

---

## Testing the API

### Using Browser:
Visit `http://localhost:8000/docs` for interactive Swagger UI documentation.

### Using Postman/Thunder Client:
1. **Register:** POST `http://localhost:8000/auth/register`
2. **Login:** POST `http://localhost:8000/auth/login` (form-data)
3. Copy the `access_token` from response
4. Add header: `Authorization: Bearer <token>` for other requests

---

## Files to Update in Mobile App

1. Remove Supabase client initialization
2. Update all API calls to use fetch/axios
3. Implement token storage and management
4. Update API endpoint URLs
5. Update request/response format handling

---

## Quick Reference

| Feature | Endpoint | Method | Auth Required |
|---------|----------|--------|---------------|
| Register | `/auth/register` | POST | No |
| Login | `/auth/login` | POST | No |
| Get Profile | `/auth/profile` | GET | Yes |
| Update Profile | `/profile/` | POST | Yes |
| Create Booking | `/bookings/` | POST | Yes |
| List Bookings | `/bookings/` | GET | Yes |

---

## Need Help?

- API Documentation: `http://localhost:8000/docs`
- Backend README: `backend_python/README.md`
- Migration Summary: `MIGRATION_SUMMARY.md`
