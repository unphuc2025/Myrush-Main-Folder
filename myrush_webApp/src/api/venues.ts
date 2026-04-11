import { apiClient } from './client';

export interface Venue {
    id: string;
    court_name: string;
    location: string;
    game_type: string;
    prices: string;
    description?: string;
    photos?: string[]; // Array of photo URLs
    videos?: string[]; // Array of video URLs
    created_at?: string;
    updated_at?: string;
    branch_name?: string;
    city_name?: string;
    google_map_url?: string;
    amenities?: Array<{
        id: string;
        name: string;
        description?: string;
        icon?: string;
        icon_url?: string;
    }>;
    terms_and_conditions?: string;
    rules?: string;
    area?: string;
    address_line2?: string;
    games_played?: number;
    rating?: number;
    reviews?: number;
    is_favorite?: boolean;
    branch_id?: string;
}

export interface VenuesFilter {
    location?: string;
    game_type?: string | string[];
    price_min?: number;
    price_max?: number;
    amenities?: string[];
    city?: string;
}

export const venuesApi = {
    /**
     * Fetch venues filtered by location and game type
     */
    getVenues: async (filter?: VenuesFilter) => {
        try {
            const params: Record<string, string> = {};
            if (filter?.city) params.city = filter.city;
            if (filter?.location) params.location = filter.location;
            if (filter?.game_type) {
                params.game_type = Array.isArray(filter.game_type)
                    ? filter.game_type.join(',')
                    : filter.game_type;
            }

            const queryString = new URLSearchParams(params).toString();
            // Endpoint matches unified-backend logic (routes/user/venues.py)
            const endpoint = `/venues/${queryString ? `?${queryString}` : ''}`;

            const response = await apiClient.get<Venue[]>(endpoint);
            return {
                success: true,
                data: response.data, // axios wraps response in .data, backend returns array directly
            };
        } catch (error: any) {
            console.error('[COURTS API] Exception:', error);
            return {
                success: false,
                data: [],
                error: error.message || 'Failed to fetch venues',
            };
        }
    },

    /**
     * Fetch all game types
     */
    getGameTypes: async () => {
        try {
            const response = await apiClient.get<string[]>('/venues/game-types');
            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            console.error('[VENUES API] Exception fetching game types:', error);
            return {
                success: false,
                data: [],
                error: error.message,
            };
        }
    },

    /**
     * Get a single venue by ID
     */
    getVenueById: async (venueId: string) => {
        try {
            const response = await apiClient.get<Venue>(`/venues/${venueId}`);
            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            return {
                success: false,
                data: null,
                error: error.message,
            };
        }
    },

    /**
     * Get available slots for a court on a specific date
     */
    getAvailableSlots: async (courtId: string, date: string) => {
        try {
            const response = await apiClient.get<{
                court_id: string;
                date: string;
                slots: Array<{
                    time: string;
                    display_time: string;
                    price: number;
                    available: boolean;
                    is_admin_blocked?: boolean;
                    occupied_mask?: number;
                    total_zones?: number;
                    logic_type?: string;
                }>;
            }>(`/courts/${courtId}/available-slots?date=${date}`);

            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            console.error('[COURTS API] Error fetching slots:', error);
            return {
                success: false,
                data: null,
                error: error.message,
            };
        }
    },

    /**
     * Get aggregated slots for a venue (branch)
     */
    getVenueSlots: async (venueId: string, date: string, gameType?: string) => {
        try {
            let endpoint = `/venues/${venueId}/slots?date=${date}`;
            if (gameType) {
                endpoint += `&game_type=${encodeURIComponent(gameType)}`;
            }

            const response = await apiClient.get<{
                venue_id: string;
                date: string;
                slots: Array<{
                    time: string;
                    display_time: string;
                    price: number;
                    available: boolean;
                    court_id: string;
                    is_admin_blocked?: boolean;
                    occupied_mask?: number;
                    total_zones?: number;
                    logic_type?: string;
                }>;
            }>(endpoint);

            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            console.error('[VENUES API] Error fetching slots:', error);
            return {
                success: false,
                data: null,
                error: error.message,
            };
        }
    },

    /**
     * Get all configured playing modes (zones) for divisible courts in a venue
     */
    getVenueZones: async (venueId: string, gameType?: string) => {
        try {
            let endpoint = `/venues/${venueId}/zones`;
            if (gameType) endpoint += `?game_type=${encodeURIComponent(gameType)}`;
            const response = await apiClient.get<{
                venue_id: string;
                zones: Array<{
                    court_id: string;
                    court_name: string;
                    court_game_type?: string;
                    logic_type: string;
                    total_zones: number;
                    slice_id: string;
                    slice_name: string;
                    mask: number;
                    sport_id: string;
                    sport_name?: string;
                    price_per_hour?: number;
                }>;
            }>(endpoint);
            return { success: true, data: response.data };
        } catch (error: any) {
            console.error('[VENUES API] Error fetching zones:', error);
            return { success: false, data: null, error: error.message };
        }
    },

    /**
     * Fetch branches filtered by city
     */
    getCities: async () => {
        try {
            const response = await apiClient.get<string[]>('/venues/cities');
            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            console.error('[VENUES API] Exception fetching cities:', error);
            return {
                success: false,
                data: [],
                error: error.message,
            };
        }
    },

    getBranches: async (city?: string) => {
        try {
            const endpoint = city ? `/venues/branches?city=${encodeURIComponent(city)}` : '/venues/branches';
            const response = await apiClient.get<Array<{
                id: string;
                name: string;
                location: string;
                city_name: string;
            }>>(endpoint);
            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            console.error('[VENUES API] Exception fetching branches:', error);
            return {
                success: false,
                data: [],
                error: error.message,
            };
        }
    },

    /**
     * Fetch active policies (GST, Cancellation, etc.)
     */
    getPublicPolicies: async (type?: string) => {
        try {
            const endpoint = type ? `/policies/?type=${type}` : '/policies/';
            const response = await apiClient.get<any[]>(endpoint);
            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            console.error('[POLICIES API] Exception fetching policies:', error);
            return {
                success: false,
                data: [],
                error: error.message,
            };
        }
    }
};

// Favorites API
export const favoritesApi = {
    /**
     * Toggle a court/venue as favorite
     */
    toggleFavorite: async (venueId: string) => {
        try {
            const response = await apiClient.post<{ status: string; court_id: string }>('/favorites/toggle', { court_id: venueId });
            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            console.error('[FAVORITES API] Error toggling favorite:', error);
            return {
                success: false,
                data: null,
                error: error.message,
            };
        }
    },

    /**
     * Get all favorite venues
     */
    getFavorites: async () => {
        try {
            const response = await apiClient.get<Venue[]>('/favorites/');
            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            console.error('[FAVORITES API] Error fetching favorites:', error);
            return {
                success: false,
                data: [],
                error: error.message,
            };
        }
    }
};
