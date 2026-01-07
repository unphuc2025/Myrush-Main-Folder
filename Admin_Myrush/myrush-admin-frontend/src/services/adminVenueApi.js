import config from '../config';
const API_BASE = config.API_URL;

async function apiRequest(url, options = {}) {
  const token = localStorage.getItem('admin_token');
  if (!token) throw new Error('No authentication token found. Please login again.');

  const config = {
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(`${API_BASE}${url}`, config);

    if (response.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_info');
      window.location.href = '/login';
      throw new Error('Authentication expired. Please login again.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
}

export async function fetchVenues() {
  return apiRequest('/venues');
}

export async function createVenue(data) {
  if (!(data instanceof FormData)) {
    throw new Error('Venue data must be FormData');
  }
  return apiRequest('/venues', {
    method: 'POST',
    body: data
  });
}

export async function updateVenue(id, data) {
  if (!(data instanceof FormData)) {
    throw new Error('Venue data must be FormData');
  }
  return apiRequest(`/venues/${id}`, {
    method: 'PUT',
    body: data
  });
}

export async function deleteVenue(id) {
  return apiRequest(`/venues/${id}`, {
    method: 'DELETE'
  });
}
