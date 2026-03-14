import config from '../config';
const API_BASE = config.API_URL;
export const IMAGE_BASE_URL = API_BASE.replace('/api/admin', '');

export const S3_BASE_URL = 'https://rush-prod-static-bucket.s3.ap-south-1.amazonaws.com/';

export const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    // If it's an S3 path (starts with known folders like settings, venues, etc. or doesn't start with /)
    if (!path.startsWith('/')) {
        return `${S3_BASE_URL}${path}`;
    }

    return `${IMAGE_BASE_URL}${path}`;
};

export const sanitizeImageUrl = (url) => {
    if (!url || typeof url !== 'string') return url;

    // Strip local API base
    if (url.startsWith(IMAGE_BASE_URL)) {
        return url.replace(IMAGE_BASE_URL, '');
    }

    // Strip S3 base if present (e.g., https://bucket.s3.region.amazonaws.com/key)
    if (url.includes('.amazonaws.com/')) {
        const parts = url.split('.amazonaws.com/');
        if (parts.length > 1) return parts[1];
    }

    return url;
};

const apiCache = new Map();

async function apiRequest(url, options = {}) {
    const token = localStorage.getItem('admin_token');
    const method = options.method || 'GET';
    const isGet = method.toUpperCase() === 'GET';
    const useCache = isGet && options.useCache !== false;

    if (!isGet) {
        // Clear cache for this resource type if possible, or everything for safety
        const resource = url.split('/')[1];
        if (resource) clearCache(`/${resource}`);
        else apiCache.clear();
    }

    if (useCache && apiCache.has(url)) {
        return apiCache.get(url);
    }

    const headers = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    if (!isGet && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const config = {
        method,
        headers,
        ...options
    };

    try {
        const response = await fetch(`${API_BASE}${url}`, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || (typeof errorData.detail === 'object' ? JSON.stringify(errorData.detail) : errorData.detail) || `API Error: ${response.status} ${response.statusText}`);
        }

        if (response.status === 204) return null;

        const contentType = response.headers.get("content-type");
        let result;
        if (contentType && contentType.includes("application/json")) {
            result = await response.json();
        } else {
            result = await response.text();
        }

        if (useCache) {
            apiCache.set(url, result);
            // Auto-clear cache after 30 seconds for local consistency
            setTimeout(() => apiCache.delete(url), 30000);
        }

        return result;
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

// Helper to clear cache when data is mutated
const clearCache = (prefix) => {
    if (!prefix) {
        apiCache.clear();
        return;
    }
    for (const key of apiCache.keys()) {
        if (key.startsWith(prefix)) apiCache.delete(key);
    }
};

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
    getAll: (options = {}) => {
        const params = new URLSearchParams();
        if (options.skip) params.append('skip', options.skip);
        if (options.limit) params.append('limit', options.limit);
        if (options.search) params.append('search', options.search);
        if (options.city_id) params.append('city_id', options.city_id);
        const query = params.toString();
        return apiRequest(`/branches${query ? `?${query}` : ''}`);
    },
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
    getAll: (options = {}) => {
        const params = new URLSearchParams();
        if (options.skip) params.append('skip', options.skip);
        if (options.limit) params.append('limit', options.limit);
        if (options.search) params.append('search', options.search);
        if (options.branch_id) params.append('branch_id', options.branch_id);
        if (options.game_type_id) params.append('game_type_id', options.game_type_id);
        const query = params.toString();
        return apiRequest(`/courts${query ? `?${query}` : ''}`);
    },
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
    bulkUpdateSlots: (date, slotFrom, slotTo, price, branchId = null, gameTypeId = null, originalSlotFrom = null, originalSlotTo = null) => {
        const formData = new FormData();
        formData.append('date', date);
        formData.append('slot_from', slotFrom);
        formData.append('slot_to', slotTo);
        formData.append('price', price);
        if (branchId) formData.append('branch_id', branchId);
        if (gameTypeId) formData.append('game_type_id', gameTypeId);
        if (originalSlotFrom) formData.append('original_slot_from', originalSlotFrom);
        if (originalSlotTo) formData.append('original_slot_to', originalSlotTo);

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
    },
    bulkDeleteSlots: (date, slotFrom, slotTo, branchId = null, gameTypeId = null) => {
        const formData = new FormData();
        formData.append('date', date);
        formData.append('slot_from', slotFrom);
        formData.append('slot_to', slotTo);
        if (branchId) formData.append('branch_id', branchId);
        if (gameTypeId) formData.append('game_type_id', gameTypeId);

        const token = localStorage.getItem('admin_token');
        return fetch(`${API_BASE}/courts/bulk-delete-slots`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData
        }).then(res => {
            if (!res.ok) {
                return res.json().then(err => {
                    throw new Error(err.detail || 'Failed to bulk delete slots');
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
        const response = await apiRequest(`/users?${query}`);
        return response;
    },
    get: (id) => apiRequest(`/users/${id}`),
    create: (data) => apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`/users/${id}`, {
        method: 'DELETE'
    }),
    toggleStatus: (id) => apiRequest(`/users/${id}/toggle`, {
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
    getActiveCoupons: () => apiRequest('/coupons/active-coupons'),
    lookupByCode: (code) => apiRequest(`/coupons/lookup?code=${encodeURIComponent(code)}`),
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
    getMe: () => apiRequest('/auth/me'),
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
        // Strip out empty/null/undefined params so we don't send ?search= when empty
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
        );
        const query = new URLSearchParams(cleanParams).toString();
        return apiRequest(`/faq${query ? '?' + query : ''}`);
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
    create: (data) => apiRequest('/cms/', {
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

// Facility Management APIs
export const facilityTypesApi = {
    getAll: () => apiRequest('/facilities/types'),
    create: (data) => apiRequest('/facilities/types', {
        method: 'POST',
        body: JSON.stringify(data)
    })
};

export const sharedGroupsApi = {
    getAll: (branchId = null) => apiRequest(`/facilities/shared-groups${branchId ? `?branch_id=${branchId}` : ''}`),
    create: (data) => apiRequest('/facilities/shared-groups', {
        method: 'POST',
        body: JSON.stringify(data)
    })
};

export const rentalItemsApi = {
    getAll: () => apiRequest('/facilities/rental-items'),
    create: (data) => apiRequest('/facilities/rental-items', {
        method: 'POST',
        body: JSON.stringify(data)
    })
};

export const courtUnitsApi = {
    getByCourt: (courtId) => apiRequest(`/facilities/${courtId}/units`),
    create: (courtId, data) => apiRequest(`/facilities/${courtId}/units`, {
        method: 'POST',
        body: JSON.stringify(data)
    })
};

export const divisionModesApi = {
    getByCourt: (courtId) => apiRequest(`/facilities/${courtId}/division-modes`),
    create: (courtId, data) => apiRequest(`/facilities/${courtId}/division-modes`, {
        method: 'POST',
        body: JSON.stringify(data)
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

// Playo Token Management API
export const playoTokensApi = {
    getAll: () => apiRequest('/playo-tokens/'),
    generate: (description) => apiRequest(`/playo-tokens/generate?description=${encodeURIComponent(description)}`, {
        method: 'POST'
    }),
    deactivate: (id) => apiRequest(`/playo-tokens/${id}/deactivate`, {
        method: 'POST'
    }),
    activate: (id) => apiRequest(`/playo-tokens/${id}/activate`, {
        method: 'POST'
    }),
    delete: (id) => apiRequest(`/playo-tokens/${id}`, {
        method: 'DELETE'
    })
};

// End of API definitions
// Force rebuild
