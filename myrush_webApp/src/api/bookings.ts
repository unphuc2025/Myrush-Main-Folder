import { apiClient } from './client';

export interface CreateBookingPayload {
    courtId: string;
    bookingDate: string;
    startTime: string;
    durationMinutes: number;
    numberOfPlayers?: number;
    pricePerHour?: number;
    originalPricePerHour?: number;
    teamName?: string;
    specialRequests?: string;
    timeSlots?: any[];
    originalAmount?: number;
    discountAmount?: number;
    couponCode?: string;
    totalAmount?: number;
}

export const bookingsApi = {
    /**
     * Create a new booking
     */
    createBooking: async (bookingData: CreateBookingPayload) => {
        try {
            const payload = {
                court_id: bookingData.courtId,
                booking_date: bookingData.bookingDate,
                start_time: bookingData.startTime,
                duration_minutes: bookingData.durationMinutes,
                number_of_players: bookingData.numberOfPlayers || 2,
                price_per_hour: bookingData.pricePerHour || 200,
                original_price_per_hour: bookingData.originalPricePerHour,
                team_name: bookingData.teamName,
                special_requests: bookingData.specialRequests,
                time_slots: bookingData.timeSlots,
                original_amount: bookingData.originalAmount,
                discount_amount: bookingData.discountAmount,
                coupon_code: bookingData.couponCode,
            };

            const response = await apiClient.post('/bookings/', payload);
            return {
                success: true,
                data: response.data,
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
    getUserBookings: async (statusFilter?: string) => {
        try {
            const response = await apiClient.get<any[]>('/bookings/');
            let filteredData = response.data;
            if (statusFilter) {
                filteredData = response.data.filter(b => b.status === statusFilter);
            }
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

    /**
     * Submit a review for a completed booking
     */
    submitReview: async (bookingId: string, courtId: string, rating: number, reviewText?: string) => {
        try {
            const payload = {
                booking_id: bookingId,
                court_id: courtId,
                rating: rating,
                review_text: reviewText || ''
            };
            const response = await apiClient.post('/reviews/', payload);
            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            console.error('[BOOKINGS API] Exception submitting review:', error);
            return {
                success: false,
                data: null,
                error: error.message,
            };
        }
    },

    /**
     * Check if booking has been reviewed
     */
    checkBookingReviewed: async (bookingId: string) => {
        try {
            const response = await apiClient.get(`/reviews/booking/${bookingId}/exists`);
            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            console.error('[BOOKINGS API] Exception checking review status:', error);
            return {
                success: false,
                data: { has_reviewed: false },
                error: error.message,
            };
        }
    },
};
