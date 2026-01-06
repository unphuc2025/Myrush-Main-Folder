export async function loginAdmin(mobile, password) {
  try {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    const response = await fetch(`${API_BASE}/api/auth/admins/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mobile, password }),
    });

    const data = await response.json();
    return { response, data };
  } catch (error) {
    throw new Error('Network error: ' + error.message);
  }
}
