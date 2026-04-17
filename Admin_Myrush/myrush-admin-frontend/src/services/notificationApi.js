import { apiRequest } from './adminApi';

export const notificationApi = {
    getInbox: async (limit = 50, skip = 0) => {
        return apiRequest(`/notifications/admin/inbox?limit=${limit}&skip=${skip}`);
    },

    markAsRead: async (id) => {
        return apiRequest(`/notifications/admin/${id}/read`, {
            method: 'PATCH'
        });
    },

    markAllAsRead: async () => {
        return apiRequest(`/notifications/admin/read-all`, {
            method: 'POST'
        });
    },

    send: async (notificationData) => {
        return apiRequest(`/notifications/send/`, {
            method: 'POST',
            body: JSON.stringify(notificationData)
        });
    },

    registerToken: async (tokenData) => {
        return apiRequest(`/notifications/tokens/`, {
            method: 'POST',
            body: JSON.stringify(tokenData)
        });
    }
};
