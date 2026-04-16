import { apiClient } from '../api/client';

export interface Notification {
    id: string;
    title: string;
    body: string;
    type: string;
    metadata_json?: any;
    is_read: boolean;
    created_at: string;
}

export interface NotificationListResponse {
    items: Notification[];
    unread_count: number;
}

export const notificationApi = {
    getInbox: async (limit = 50, skip = 0): Promise<NotificationListResponse> => {
        const response = await apiClient.get('../notifications/inbox', {
            params: { limit, skip }
        });
        return response.data;
    },

    markAsRead: async (notification_id: string): Promise<Notification> => {
        const response = await apiClient.patch(`../notifications/${notification_id}/read`, {});
        return response.data;
    },

    markAllAsRead: async (): Promise<{ message: string }> => {
        const response = await apiClient.post('../notifications/read-all', {});
        return response.data;
    },

    registerToken: async (device_token: string, device_type: string = 'web'): Promise<any> => {
        const response = await apiClient.post('../notifications/tokens/', {
            device_token,
            device_type
        });
        return response.data;
    }
};
