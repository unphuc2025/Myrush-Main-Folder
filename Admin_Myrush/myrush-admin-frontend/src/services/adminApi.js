import config from '../config';
const API_BASE = config.API_URL;
export const IMAGE_BASE_URL = API_BASE.replace('/api/admin', '');

async function apiRequest(url, options = {}) {
    const token = localStorage.getItem('admin_token');

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(`${API_BASE}${url}`, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || (typeof errorData.detail === 'object' ? JSON.stringify(errorData.detail) : errorData.detail) || `API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

// Cities API
export const citiesApi = {
    getAll: () => apiRequest('/cities'),
    getById: (id) => apiRequest(`/cities/${id}`),
    create: (data) => apiRequest('/cities', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`/cities/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`/cities/${id}`, {
        method: 'DELETE'
    })
};

// Areas API
export const areasApi = {
    getAll: () => apiRequest('/areas'),
    getByCity: (cityId) => apiRequest(`/areas/city/${cityId}`),
    getById: (id) => apiRequest(`/areas/${id}`),
    create: (data) => apiRequest('/areas', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`/areas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`/areas/${id}`, {
        method: 'DELETE'
    })
};

// Game Types API
export const gameTypesApi = {
    getAll: () => apiRequest('/game-types'),
    getById: (id) => apiRequest(`/game-types/${id}`),
    create: (formData) => {
        const token = localStorage.getItem('admin_token');
        return fetch(`${API_BASE}/game-types`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData
        }).then(res => {
            if (!res.ok) {
                return res.json().then(err => {
                    throw new Error(err.error || 'Failed to create game type');
                });
            }
            return res.json();
        });
    },
    update: (id, formData) => {
        const token = localStorage.getItem('admin_token');
        return fetch(`${API_BASE}/game-types/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData
        }).then(res => {
            if (!res.ok) throw new Error('Failed to update game type');
            return res.json();
        });
    },
    delete: (id) => apiRequest(`/game-types/${id}`, {
        method: 'DELETE'
    })
};

// Amenities API
export const amenitiesApi = {
    getAll: () => apiRequest('/amenities'),
    getById: (id) => apiRequest(`/amenities/${id}`),
    create: (formData) => {
        const token = localStorage.getItem('admin_token');
        return fetch(`${API_BASE}/amenities`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData
        }).then(res => {
            if (!res.ok) {
                return res.json().then(err => {
                    throw new Error(err.error || 'Failed to create amenity');
                });
            }
            return res.json();
        });
    },
    update: (id, formData) => {
        const token = localStorage.getItem('admin_token');
        return fetch(`${API_BASE}/amenities/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData
        }).then(res => {
            if (!res.ok) throw new Error('Failed to update amenity');
            return res.json();
        });
    },
    delete: (id) => apiRequest(`/amenities/${id}`, {
        method: 'DELETE'
    })
};

// Branches API
export const branchesApi = {
    getAll: () => apiRequest('/branches'),
    getByCity: (cityId) => apiRequest(`/branches/city/${cityId}`),
    getById: (id) => apiRequest(`/branches/${id}`),
    create: (formData) => {
        const token = localStorage.getItem('admin_token');
        return fetch(`${API_BASE}/branches`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData
        }).then(res => {
            if (!res.ok) throw new Error('Failed to create branch');
            return res.json();
        });
    },
    update: (id, formData) => {
        const token = localStorage.getItem('admin_token');
        return fetch(`${API_BASE}/branches/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData
        }).then(res => {
            if (!res.ok) throw new Error('Failed to update branch');
            return res.json();
        });
    },
    delete: (id) => apiRequest(`/branches/${id}`, {
        method: 'DELETE'
    })
};

// Courts API
export const courtsApi = {
    getAll: () => apiRequest('/courts'),
    getById: (id) => apiRequest(`/courts/${id}`),
    create: (formData) => {
        const token = localStorage.getItem('admin_token');
        return fetch(`${API_BASE}/courts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData
        }).then(res => {
            if (!res.ok) {
                return res.json().then(err => {
                    throw new Error(err.error || 'Failed to create court');
                });
            }
            return res.json();
        });
    },
    update: (id, formData) => {
        const token = localStorage.getItem('admin_token');
        return fetch(`${API_BASE}/courts/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData
        }).then(res => {
            if (!res.ok) throw new Error('Failed to update court');
            return res.json();
        });
    },
    delete: (id) => apiRequest(`/courts/${id}`, {
        method: 'DELETE'
    }),
    bulkUpdateSlots: (date, slotFrom, slotTo, price, branchId = null, gameTypeId = null) => {
        const formData = new FormData();
        formData.append('date', date);
        formData.append('slot_from', slotFrom);
        formData.append('slot_to', slotTo);
        formData.append('price', price);
        if (branchId) formData.append('branch_id', branchId);
        if (gameTypeId) formData.append('game_type_id', gameTypeId);

        const token = localStorage.getItem('admin_token');
        return fetch(`${API_BASE}/courts/bulk-update-slots`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData
        }).then(res => {
            if (!res.ok) {
                return res.json().then(err => {
                    throw new Error(err.detail || 'Failed to bulk update slots');
                });
            }
            return res.json();
        });
    }
};

// Global Price Conditions API
export const globalPriceConditionsApi = {
    getAll: () => apiRequest('/global-price-conditions'),
    create: (days, dates, slotFrom, slotTo, price, conditionType = 'recurring') => {
        const formData = new FormData();

        // Validate and prepare data
        if (conditionType === 'date') {
            if (!dates || !Array.isArray(dates) || dates.length === 0) {
                throw new Error('At least one date is required for date-specific condition');
            }
            formData.append('dates', JSON.stringify(dates));
            formData.append('days', '[]'); // Empty for date type
        } else {
            if (!days || !Array.isArray(days) || days.length === 0) {
                throw new Error('At least one day is required for recurring condition');
            }
            formData.append('days', JSON.stringify(days));
            formData.append('dates', '[]'); // Empty for recurring type
        }

        formData.append('slot_from', slotFrom || '');
        formData.append('slot_to', slotTo || '');
        formData.append('price', price || '');
        formData.append('condition_type', conditionType);

        console.log('Sending FormData:', {
            conditionType,
            days: conditionType === 'recurring' ? JSON.stringify(days) : '[]',
            dates: conditionType === 'date' ? JSON.stringify(dates) : '[]',
            slot_from: slotFrom,
            slot_to: slotTo,
            price: price
        });

        const token = localStorage.getItem('admin_token');
        return fetch(`${API_BASE}/global-price-conditions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData
        }).then(async res => {
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ detail: 'Unknown error' }));
                console.error('API Error:', errorData);
                throw new Error(errorData.detail || 'Failed to create global price condition');
            }
            return res.json();
        });
    },
    update: (id, data) => {
        const formData = new FormData();
        if (data.condition_type !== undefined) formData.append('condition_type', data.condition_type);
        if (data.days !== undefined) formData.append('days', JSON.stringify(data.days));
        if (data.dates !== undefined) formData.append('dates', JSON.stringify(data.dates));
        if (data.slot_from !== undefined) formData.append('slot_from', data.slot_from);
        if (data.slot_to !== undefined) formData.append('slot_to', data.slot_to);
        if (data.price !== undefined) formData.append('price', data.price);
        if (data.is_active !== undefined) formData.append('is_active', data.is_active);

        const token = localStorage.getItem('admin_token');
        return fetch(`${API_BASE}/global-price-conditions/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData
        }).then(res => {
            if (!res.ok) throw new Error('Failed to update global price condition');
            return res.json();
        });
    },
    delete: (id) => apiRequest(`/global-price-conditions/${id}`, {
        method: 'DELETE'
    }),
    applyToAllCourts: () => apiRequest('/global-price-conditions/apply-to-all-courts', {
        method: 'POST'
    })
};

// Users API
export const usersApi = {
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        const response = await apiRequest(`/auth/users?${query}`);
        // Return just the items array for backward compatibility
        return response;
    },
    get: (id) => apiRequest(`/auth/users/${id}`),
    create: (data) => apiRequest('/auth/users', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`/auth/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`/auth/users/${id}`, {
        method: 'DELETE'
    }),
    toggleStatus: (id) => apiRequest(`/auth/users/${id}/toggle`, { // Assuming toggle endpoint exists on backend or will use update
        method: 'PATCH'
    })
};

export const bookingsApi = {
    getAll: (branchId = null) => {
        const url = branchId ? `/bookings?branch_id=${branchId}` : '/bookings';
        return apiRequest(url);
    },
    getById: (id) => apiRequest(`/bookings/${id}`),
    getByDateRange: (startDate, endDate) => apiRequest(`/bookings/date-range?start_date=${startDate}&end_date=${endDate}`),
    create: (data) => apiRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`/bookings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    updateStatus: (id, status) => apiRequest(`/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
    }),
    delete: (id) => apiRequest(`/bookings/${id}`, {
        method: 'DELETE'
    })
};

// Coupons API
export const couponsApi = {
    getAll: (skip = 0, limit = 100) => apiRequest(`/coupons?skip=${skip}&limit=${limit}`),
    getById: (id) => apiRequest(`/coupons/${id}`),
    create: (data) => apiRequest('/coupons', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`/coupons/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`/coupons/${id}`, {
        method: 'DELETE'
    }),
    toggleStatus: (id) => apiRequest(`/coupons/${id}/toggle`, {
        method: 'PATCH'
    })
};

// Policies API
export const policiesApi = {
    getAll: (type = null) => {
        const url = type ? `/policies?type=${type}` : '/policies';
        return apiRequest(url);
    },
    getById: (id) => apiRequest(`/policies/${id}`),
    create: (data) => apiRequest('/policies', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`/policies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`/policies/${id}`, {
        method: 'DELETE'
    })
};



// Admins API
export const adminsApi = {
    getAll: () => apiRequest('/auth/admins'),
    create: (data) => apiRequest('/auth/admins', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`/auth/admins/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`/auth/admins/${id}`, {
        method: 'DELETE'
    })
};

// Reviews API
export const reviewsApi = {
    getAll: () => apiRequest('/reviews'),
    updateStatus: (id, isActive) => apiRequest(`/reviews/${id}/status?is_active=${isActive}`, {
        method: 'PUT'
    })
};

// Roles API
export const rolesApi = {
    getAll: () => apiRequest('/roles'),
    getById: (id) => apiRequest(`/roles/${id}`),
    create: (data) => apiRequest('/roles', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`/roles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`/roles/${id}`, {
        method: 'DELETE'
    })
};

// FAQ API
export const faqsApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/faq?${query}`);
    },
    getById: (id) => apiRequest(`/faq/${id}`),
    create: (data) => apiRequest('/faq/', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`/faq/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`/faq/${id}`, {
        method: 'DELETE'
    })
};

// CMS Pages API
export const cmsApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/cms?${query}`);
    },
    getBySlug: (slug) => apiRequest(`/cms/${slug}`),
    create: (data) => apiRequest('/cms', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`/cms/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`/cms/${id}`, {
        method: 'DELETE'
    })
};

// Site Settings API
export const settingsApi = {
    get: () => apiRequest('/settings'),
    update: (formData) => {
        const token = localStorage.getItem('admin_token');
        return fetch(`${API_BASE}/settings`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                // Content-Type not set to let browser handle multipart/form-data boundary
            },
            body: formData
        }).then(async res => {
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to update settings');
            }
            return res.json();
        });
    }
};

// End of API definitions
// Force rebuild
