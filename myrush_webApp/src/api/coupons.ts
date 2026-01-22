import { apiClient } from './client';

export interface AvailableCoupon {
    code: string;
    discount_type: string;
    discount_value: number;
    min_order_value?: number;
    description?: string;
}

export interface CouponValidationRequest {
    coupon_code: string;
    total_amount: number;
}

export interface CouponValidationResponse {
    valid: boolean;
    message: string;
    discount_percentage?: number;
    discount_amount?: number;
    final_amount?: number;
}

export const couponsApi = {
    /**
     * Get all available active coupons
     */
    getAvailableCoupons: async (): Promise<{ success: boolean; data: AvailableCoupon[]; error?: string }> => {
        try {
            const response = await apiClient.get<AvailableCoupon[]>('/coupons/available');
            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            console.error('[COUPONS API] Failed to fetch available coupons:', error.message);
            return {
                success: false,
                data: [],
                error: error.message || 'Failed to fetch coupons',
            };
        }
    },

    /**
     * Validate a coupon code
     */
    validateCoupon: async (couponCode: string, totalAmount: number): Promise<{ success: boolean; data: CouponValidationResponse; error?: string }> => {
        try {
            const request: CouponValidationRequest = {
                coupon_code: couponCode.toUpperCase(),
                total_amount: totalAmount
            };

            const response = await apiClient.post<CouponValidationResponse>('/coupons/validate', request);
            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            console.error('[COUPONS API] Failed to validate coupon:', error.message);
            return {
                success: false,
                data: {
                    valid: false,
                    message: error.message || 'Failed to validate coupon'
                },
                error: error.message,
            };
        }
    },
};

export default couponsApi;
