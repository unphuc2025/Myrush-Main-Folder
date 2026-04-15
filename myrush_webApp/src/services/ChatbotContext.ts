

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/user').replace('/api/user', '');

// ============================================================================
// KNOWLEDGE BASE CACHING
// ============================================================================

interface KnowledgeBase {
    cities: Array<{ id: string; name: string, short_code: string; areas?: any[] }>;
    game_types: Array<{ id: string; name: string; short_code: string; description?: string }>;
    amenities: Array<{ id: string; name: string; description?: string }>;
    venue_count: number;
    city_count: number;
    faqs: Array<{ category: string; question: string; answer: string }>;
}

let cachedKnowledge: KnowledgeBase | null = null;

/**
 * Fetch and cache platform knowledge base
 */
export const fetchKnowledgeBase = async (): Promise<KnowledgeBase> => {
    if (cachedKnowledge) {
        return cachedKnowledge;
    }

    try {
        const [baseRes, faqRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/chatbot/knowledge/base`),
            fetch(`${API_BASE_URL}/api/chatbot/knowledge/faqs`)
        ]);

        const baseResult = await baseRes.json();
        const faqResult = await faqRes.json();

        if (baseResult.success) {
            cachedKnowledge = {
                ...baseResult.data,
                faqs: faqResult.success ? faqResult.data : []
            };
            return cachedKnowledge!;
        }
    } catch (error) {
        console.error('[CHATBOT] Failed to fetch knowledge base:', error);
    }

    // Fallback if API fails
    return {
        cities: [],
        game_types: [],
        amenities: [],
        venue_count: 0,
        city_count: 0,
        faqs: []
    };
};

/**
 * Search venues smartly with multiple filters
 */
export const searchVenues = async (params: {
    city?: string;
    sport?: string;
    area?: string;
    amenity?: string;
    price_max?: number;
}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.city) queryParams.append('city', params.city);
        if (params.sport) queryParams.append('sport', params.sport);
        if (params.area) queryParams.append('area', params.area);
        if (params.amenity) queryParams.append('amenity', params.amenity);
        if (params.price_max) queryParams.append('price_max', params.price_max.toString());

        const response = await fetch(`${API_BASE_URL}/api/chatbot/search/venues?${queryParams.toString()}`);
        const result = await response.json();

        if (result.success) {
            return {
                success: true,
                data: result.data
            };
        }
    } catch (error) {
        console.error('[CHATBOT] Failed to search venues:', error);
    }

    return { success: false, data: [] };
};

/**
 * Get detailed venue context including rules, pricing, amenities, and court metadata
 */
export const getVenueDetails = async (venueId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/chatbot/context/venue/${venueId}`);
        const result = await response.json();

        if (result.success) {
            return result.data;
        }
    } catch (error) {
        console.error('[CHATBOT] Failed to get venue details:', error);
    }

    return null;
};

/**
 * Look up booking details by display ID
 */
export const getBookingDetails = async (displayId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/chatbot/booking/${displayId}`);
        const result = await response.json();

        if (result.success) {
            return result.data;
        }
    } catch (error) {
        console.error('[CHATBOT] Failed to get booking details:', error);
    }

    return { error: 'Booking not found' };
};

/**
 * Calculate pricing for a draft booking (AI Quote)
 */
export const calculateBookingPrice = async (data: {
    court_id: string;
    date: string;
    slot_times: string[];
    number_of_players?: number;
    slice_mask?: number;
}) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/chatbot/booking/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('[CHATBOT] Pricing error:', error);
        return { success: false, message: 'Failed to calculate price' };
    }
};

/**
 * Get all venues summary (lightweight)
 */
export const getAllVenuesSummary = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/chatbot/knowledge/venues`);
        const result = await response.json();

        if (result.success) {
            return result.data;
        }
    } catch (error) {
        console.error('[CHATBOT] Failed to get venues summary:', error);
    }

    return [];
};
