import { apiRequest } from './adminApi';

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
