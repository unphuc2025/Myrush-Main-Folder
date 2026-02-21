import { apiClient } from './apiClient';

export interface PaymentMethod {
    id: string;
    type: 'card' | 'upi';
    provider?: string;
    details: any;
    is_default: boolean;
    created_at: string;
}

export const paymentsApi = {
    getMethods: async (): Promise<{ success: boolean; data: PaymentMethod[]; error?: string }> => {
        try {
            const data = await apiClient.get<PaymentMethod[]>('/payments/methods');
            return { success: true, data };
        } catch (error: any) {
            return { success: false, data: [], error: error.message };
        }
    },

    addMethod: async (payload: any): Promise<{ success: boolean; data?: PaymentMethod; error?: string }> => {
        try {
            const data = await apiClient.post<PaymentMethod>('/payments/methods', payload);
            return { success: true, data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    deleteMethod: async (id: string): Promise<{ success: boolean; error?: string }> => {
        try {
            await apiClient.delete(`/payments/methods/${id}`);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    setDefault: async (id: string): Promise<{ success: boolean; error?: string }> => {
        try {
            await apiClient.post(`/payments/methods/${id}/default`, {});
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
};
