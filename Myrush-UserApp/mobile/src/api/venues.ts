import apiClient from './apiClient';

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
    amenities?: Array<{
        id: string;
        name: string;
        description?: string;
        icon?: string;
        icon_url?: string;
    }>;
    terms_and_conditions?: string;
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
            console.log('[COURTS API] Fetching courts with filter:', filter);

            const params: Record<string, string> = {};
            if (filter?.city) params.city = filter.city;
            if (filter?.location) params.location = filter.location;
            if (filter?.game_type) {
                params.game_type = Array.isArray(filter.game_type)
                    ? filter.game_type.join(',')
                    : filter.game_type;
            }

            // Construct query string
            const queryString = new URLSearchParams(params).toString();
            // IMPORTANT: Frontend calls /courts/ but backend router prefix is /venues for get_venues??
            // Wait, previous file view showed `router = APIRouter(prefix="/venues", ...)` in venues.py
            // And `main.py` likely mounts it.
            // Earlier `venuesApi.getVenues` called `/courts/`.
            // IF backend `get_venues` is in `venues.py` (prefix /venues) but my code calls `/courts/`...
            // Uh oh. The previous logic worked because I updated `routers/courts.py`?
            // No, `venues.py` has `get_venues`. `courts.py` has `get_courts`.
            // My previous change for `branch_name` was in `courts.py`.
            // So `getVenues` API hits `courts.py` logic.
            // BUT `get_game_types` I just added to `venues.py`.
            // So `getGameTypes` must call `/venues/game-types`.
            // Existing `getVenues` calls `/courts/`. This is fine.

            const endpoint = `/courts/${queryString ? `?${queryString}` : ''}`;

            const data = await apiClient.get<Venue[]>(endpoint);

            console.log('[COURTS API] Fetched courts:', data?.length || 0);
            return {
                success: true,
                data: data,
            };
        } catch (error: any) {
            console.error('[COURTS API] Exception:', error);
            return {
                success: false,
                data: [],
                error: error.message,
            };
        }
    },

    /**
     * Fetch all game types
     */
    getGameTypes: async () => {
        try {
            const data = await apiClient.get<string[]>('/venues/game-types');
            return {
                success: true,
                data: data,
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
            const data = await apiClient.get<Venue>(`/venues/${venueId}`);
            return {
                success: true,
                data: data,
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
            console.log('[COURTS API] Fetching available slots for court:', courtId, 'date:', date);
            const data = await apiClient.get<{
                court_id: string;
                date: string;
                slots: Array<{
                    time: string;
                    display_time: string;
                    price: number;
                    available: boolean;
                }>;
            }>(`/courts/${courtId}/available-slots?date=${date}`);

            console.log('[COURTS API] Available slots:', data.slots?.length || 0);
            return {
                success: true,
                data: data,
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
     * Seed venues (dev only)
     */
    seedVenues: async () => {
        try {
            const data = await apiClient.post<Venue[]>('/venues/seed', {});
            return { success: true, data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
};

export interface CouponValidationResult {
    valid: boolean;
    discount_percentage?: number;
    discount_amount?: number;
    final_amount?: number;
    message: string;
}

export interface AvailableCoupon {
    code: string;
    discount_type: string;
    discount_value: number;
    min_order_value?: number;
    description?: string;
}

// Coupons API
export const couponsApi = {
    /**
     * Get all available active coupons for dropdown
     */
    getAvailableCoupons: async () => {
        try {
            console.log('[COUPONS API] Fetching available coupons');

            const data = await apiClient.get<AvailableCoupon[]>('/coupons/available');

            console.log('[COUPONS API] Available coupons:', data?.length || 0);
            return {
                success: true,
                data: data,
            };
        } catch (error: any) {
            console.error('[COUPONS API] Exception fetching coupons:', error);
            return {
                success: false,
                data: [],
                error: error.message,
            };
        }
    },

    /**
     * Validate a coupon code and get discount information
     */
    validateCoupon: async (couponCode: string, totalAmount: number) => {
        try {
            console.log('[COUPONS API] Validating coupon:', couponCode, 'for amount:', totalAmount);

            const payload = {
                coupon_code: couponCode,
                total_amount: totalAmount
            };

            const data = await apiClient.post<CouponValidationResult>('/coupons/validate', payload);

            console.log('[COUPONS API] Coupon validation result:', data);
            return {
                success: true,
                data: data,
            };
        } catch (error: any) {
            console.error('[COUPONS API] Exception validating coupon:', error);
            return {
                success: false,
                data: {
                    valid: false,
                    message: error.message || 'Failed to validate coupon'
                },
                error: error.message,
            };
        }
    }
};

// Reviews API
export const reviewsApi = {
    /**
     * Create a new review for a booking
     */
    createReview: async (reviewData: {
        bookingId: string;
        courtId: string;
        rating: number;
        reviewText?: string;
    }) => {
        try {
            const payload = {
                booking_id: reviewData.bookingId,
                court_id: reviewData.courtId,
                rating: reviewData.rating,
                review_text: reviewData.reviewText || null
            };

            const data = await apiClient.post('/reviews/', payload);

            console.log('[REVIEWS API] Review created successfully:', data);
            return {
                success: true,
                data: data,
            };
        } catch (error: any) {
            console.error('[REVIEWS API] Exception creating review:', error);
            return {
                success: false,
                data: null,
                error: error.message,
            };
        }
    },

    /**
     * Check if user has already reviewed a booking
     */
    hasUserReviewedBooking: async (bookingId: string) => {
        try {
            const data = await apiClient.get<{
                has_reviewed: boolean;
                review?: {
                    id: string;
                    rating: number;
                    review_text: string | null;
                    created_at: string;
                };
            }>(`/reviews/booking/${bookingId}/exists`);

            console.log('[REVIEWS API] Review check result:', data);
            return {
                success: true,
                data: data,
            };
        } catch (error: any) {
            console.error('[REVIEWS API] Exception checking review:', error);
            return {
                success: false,
                data: null,
                error: error.message,
            };
        }
    },

    /**
     * Get existing review for a booking
     */
    getReviewForBooking: async (bookingId: string) => {
        try {
            // First check if review exists
            const existsResult = await reviewsApi.hasUserReviewedBooking(bookingId);
            if (!existsResult.success || !existsResult.data?.has_reviewed) {
                return {
                    success: true,
                    data: null, // No review exists
                };
            }

            // If review exists, we need to get the review data
            // For now, we'll modify the backend to return review data in the exists check
            // TODO: Add a separate endpoint to get review data by booking ID
            console.log('[REVIEWS API] Review exists for booking:', bookingId);
            return {
                success: true,
                data: existsResult.data, // This should include review data in future
            };
        } catch (error: any) {
            console.error('[REVIEWS API] Exception getting review:', error);
            return {
                success: false,
                data: null,
                error: error.message,
            };
        }
    },

    /**
     * Get all reviews submitted by the current user
     */
    getUserReviews: async () => {
        try {
            const data = await apiClient.get<any[]>('/reviews/user');

            console.log('[REVIEWS API] Fetched user reviews:', data?.length || 0);
            return {
                success: true,
                data: data,
            };
        } catch (error: any) {
            console.error('[REVIEWS API] Exception fetching user reviews:', error);
            return {
                success: false,
                data: [],
                error: error.message,
            };
        }
    },

    /**
     * Get unreviewed completed bookings for review reminder
     */
    getUnreviewedCompletedBookings: async () => {
        try {
            const data = await apiClient.get<any[]>('/reviews/unreviewed-completed-bookings');

            console.log('[REVIEWS API] Fetched unreviewed completed bookings:', data?.length || 0);
            return {
                success: true,
                data: data,
            };
        } catch (error: any) {
            console.error('[REVIEWS API] Exception fetching unreviewed completed bookings:', error);
            return {
                success: false,
                data: [],
                error: error.message,
            };
        }
    }
};

// Bookings API
export const bookingsApi = {
    /**
     * Create a new booking
     */
    createBooking: async (bookingData: {
        userId: string; // Not needed for backend call as it uses token, but kept for interface compat
        courtId: string; // Changed from venueId to courtId
        bookingDate: string;
        startTime: string; // Legacy/First slot start
        durationMinutes: number; // Total duration
        numberOfPlayers?: number;
        pricePerHour?: number; // Selected slot price (Legacy support)
        originalPricePerHour?: number; // Original price before discount
        teamName?: string;
        specialRequests?: string;

        // Multi-slot & detailed pricing support
        timeSlots?: any[];
        originalAmount?: number;
        discountAmount?: number;
        couponCode?: string;
        totalAmount?: number; // Final amount to be paid

        // Razorpay Payment Details
        razorpay_payment_id?: string;
        razorpay_order_id?: string;
        razorpay_signature?: string;
        payment_status?: string;
    }) => {
        try {
            const payload = {
                court_id: bookingData.courtId, // Changed from venue_id to court_id
                booking_date: bookingData.bookingDate,
                start_time: bookingData.startTime,
                duration_minutes: bookingData.durationMinutes,
                number_of_players: bookingData.numberOfPlayers || 2,
                price_per_hour: bookingData.pricePerHour || 200,
                original_price_per_hour: bookingData.originalPricePerHour,
                team_name: bookingData.teamName,
                special_requests: bookingData.specialRequests,

                // New fields for multi-slot support
                time_slots: bookingData.timeSlots,
                original_amount: bookingData.originalAmount,
                discount_amount: bookingData.discountAmount,
                coupon_code: bookingData.couponCode,
                // total_amount is calculated on backend usually but we can pass expectations if needed, 
                // but schema expects original/discount to derive standard total.

                // Razorpay Fields
                razorpay_payment_id: bookingData.razorpay_payment_id,
                razorpay_order_id: bookingData.razorpay_order_id,
                razorpay_signature: bookingData.razorpay_signature,
                payment_status: bookingData.payment_status,
            };

            const data = await apiClient.post<any>('/bookings/', payload);

            console.log('[BOOKINGS API] Booking created successfully:', data);
            return {
                success: true,
                data: data,
            };
        } catch (error: any) {
            console.error('[BOOKINGS API] Exception creating booking:', error);
            return {
                success: false,
                data: null,
                error: error.message,
            };
        }
    },

    /**
     * Get user's bookings
     */
    getUserBookings: async (userId: string, statusFilter?: string) => {
        try {
            // userId is ignored as backend uses token
            const data = await apiClient.get<any[]>('/bookings/');

            // Filter client-side if needed (or add backend filter)
            let filteredData = data;
            if (statusFilter) {
                filteredData = data.filter(b => b.status === statusFilter);
            }

            console.log('[BOOKINGS API] Fetched user bookings:', filteredData?.length || 0);
            return {
                success: true,
                data: filteredData,
            };
        } catch (error: any) {
            console.error('[BOOKINGS API] Exception fetching bookings:', error);
            return {
                success: false,
                data: [],
                error: error.message,
            };
        }
    },
};

// Payments API
export const paymentsApi = {
    /**
     * Create a Razorpay order
     */
    createOrder: async (bookingData: {
        courtId: string;
        bookingDate: string;
        startTime: string;
        durationMinutes: number;
        timeSlots: any[];
        numberOfPlayers: number;
        couponCode?: string;
    }) => {
        try {
            console.log('[PAYMENTS API] Creating order for:', bookingData);
            const payload = {
                court_id: bookingData.courtId,
                booking_date: bookingData.bookingDate,
                start_time: bookingData.startTime,
                duration_minutes: bookingData.durationMinutes,
                time_slots: bookingData.timeSlots,
                number_of_players: bookingData.numberOfPlayers,
                coupon_code: bookingData.couponCode,
            };

            const data = await apiClient.post<any>('/payments/create-order', payload);
            console.log('[PAYMENTS API] Order created:', data);
            return {
                success: true,
                data: data,
            };
        } catch (error: any) {
            console.error('[PAYMENTS API] Exception creating order:', error);
            return {
                success: false,
                data: null,
                error: error.message,
            };
        }
    }
};
