import { apiClient } from './apiClient';

export interface PushTokenCreate {
    device_token: string;
    device_type?: string;
    device_info?: any;
}

export interface PushTokenResponse {
    id: string;
    user_id: string;
    device_token: string;
    device_type: string;
    is_active: boolean;
    last_used_at?: string;
    created_at: string;
    updated_at?: string;
}

export interface SendNotificationRequest {
    user_ids?: string[];
    device_tokens?: string[];
    title: string;
    body: string;
    data?: any;
}

export interface SendNotificationResponse {
    success: boolean;
    message: string;
    sent_count: number;
    failed_count: number;
    errors?: string[];
}

/**
 * Notification API client
 */
class NotificationApi {
    /**
     * Register push token for current user
     */
    async registerPushToken(tokenData: PushTokenCreate): Promise<PushTokenResponse> {
        return apiClient.post<PushTokenResponse>('/notifications/tokens/', tokenData);
    }

    /**
     * Get user's registered push tokens
     */
    async getUserPushTokens(): Promise<PushTokenResponse[]> {
        return apiClient.get<PushTokenResponse[]>('/notifications/tokens/');
    }

    /**
     * Delete a push token
     */
    async deletePushToken(deviceToken: string): Promise<void> {
        return apiClient.delete(`/notifications/tokens/${encodeURIComponent(deviceToken)}`);
    }

    /**
     * Send notification to users or tokens
     */
    async sendNotification(notificationData: SendNotificationRequest): Promise<SendNotificationResponse> {
        return apiClient.post<SendNotificationResponse>('/notifications/send/', notificationData);
    }

    /**
     * Send test notification to current user
     */
    async sendTestNotification(): Promise<SendNotificationResponse> {
        return apiClient.post<SendNotificationResponse>('/notifications/test/', {});
    }

    /**
     * Get notification statistics
     */
    async getNotificationStats(): Promise<any> {
        return apiClient.get('/notifications/stats/');
    }
}

// Export singleton instance
export const notificationApi = new NotificationApi();
export default notificationApi;
