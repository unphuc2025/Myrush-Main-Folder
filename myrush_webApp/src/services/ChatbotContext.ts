import { venuesApi } from '../api/venues';

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
            fetch('http://localhost:8000/api/chatbot/knowledge/base'),
            fetch('http://localhost:8000/api/chatbot/knowledge/faqs')
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

        const response = await fetch(`http://localhost:8000/api/chatbot/search/venues?${queryParams.toString()}`);
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
 * Get detailed venue context including rules, pricing, amenities
 */
export const getVenueDetails = async (venueId: string) => {
    try {
        const response = await fetch(`http://localhost:8000/api/chatbot/context/venue/${venueId}`);
        const result = await response.json();

        if (result.success) {
            return {
                success: true,
                data: result.data
            };
        }
    } catch (error) {
        console.error('[CHATBOT] Failed to get venue details:', error);
    }

    return { success: false, data: null };
};

/**
 * Get all venues summary (lightweight)
 */
export const getAllVenuesSummary = async () => {
    try {
        const response = await fetch('http://localhost:8000/api/chatbot/knowledge/venues');
        const result = await response.json();

        if (result.success) {
            return {
                success: true,
                data: result.data
            };
        }
    } catch (error) {
        console.error('[CHATBOT] Failed to get venues summary:', error);
    }

    return { success: false, data: [] };
};

/**
 * Build enriched context for Gemini based on user query and intent
 */
export const buildChatbotContext = async (userQuery: string, intent?: string) => {
    const knowledge = await fetchKnowledgeBase();
    let contextData: any = {
        knowledge
    };

    // If the query mentions a specific city, fetch venues for that city
    const cityMatch = knowledge.cities.find(c =>
        userQuery.toLowerCase().includes(c.name.toLowerCase())
    );

    if (cityMatch) {
        const venues = await searchVenues({ city: cityMatch.name });
        contextData.venues = venues.data;
    }

    // If the query mentions a specific sport
    const sportMatch = knowledge.game_types.find(s =>
        userQuery.toLowerCase().includes(s.name.toLowerCase())
    );

    if (sportMatch && cityMatch) {
        const venues = await searchVenues({
            city: cityMatch.name,
            sport: sportMatch.name
        });
        contextData.sportVenues = venues.data;
    }

    // If the query mentions amenities
    const amenityMatch = knowledge.amenities.find(a =>
        userQuery.toLowerCase().includes(a.name.toLowerCase())
    );

    if (amenityMatch) {
        contextData.requestedAmenity = amenityMatch.name;
    }

    return contextData;
};
