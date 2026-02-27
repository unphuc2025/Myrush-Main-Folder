import { apiClient } from './client';

export interface CourtRatings {
    court_id: string;
    average_rating: number;
    total_reviews: number;
    rating_distribution: {
        '5': number;
        '4': number;
        '3': number;
        '2': number;
        '1': number;
    };
}

export interface CourtReview {
    id: string;
    rating: number;
    review_text: string;
    user_name: string;
    created_at: string;
}

export interface CourtReviewsResponse {
    court_id: string;
    reviews: CourtReview[];
    total: number;
}

export const courtsApi = {
    getCourtRatings: async (courtId: string): Promise<{ success: boolean; data: CourtRatings }> => {
        try {
            const response = await apiClient.get<CourtRatings>(`/courts/${courtId}/ratings`);
            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            console.error('[COURTS API] Failed to fetch court ratings:', error.message);
            return {
                success: false,
                data: {
                    court_id: courtId,
                    average_rating: 0,
                    total_reviews: 0,
                    rating_distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }
                }
            };
        }
    },

    getCourtReviews: async (
        courtId: string,
        limit: number = 10,
        offset: number = 0
    ): Promise<{ success: boolean; data: CourtReviewsResponse }> => {
        try {
            const response = await apiClient.get<CourtReviewsResponse>(
                `/courts/${courtId}/reviews?limit=${limit}&offset=${offset}`
            );
            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            console.error('[COURTS API] Failed to fetch court reviews:', error.message);
            return {
                success: false,
                data: {
                    court_id: courtId,
                    reviews: [],
                    total: 0
                }
            };
        }
    },
    submitReview: async (courtId: string, rating: number, reviewText?: string) => {
        try {
            const payload = {
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
            console.error('[COURTS API] Exception submitting review:', error);
            return {
                success: false,
                data: null,
                error: error.message,
            };
        }
    },
};
