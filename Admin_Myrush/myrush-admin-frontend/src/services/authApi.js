import config from '../config';

export async function loginAdmin(mobile, password) {
  try {
    const API_BASE = config.API_URL;
    const response = await fetch(`${API_BASE}/auth/admins/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mobile, password }),
    });

    const result = await response.json();
    // Standardized wrapper support
    const data = (result && typeof result === 'object' && 'status' in result && 'data' in result) ? result.data : result;
    
    // Add success flag for legacy compatibility if original was successful
    if (response.ok && result.status === 'success' && typeof data === 'object') {
      data.success = true;
    }
    
    return { response, data };
  } catch (error) {
    throw new Error('Network error: ' + error.message);
  }
}
