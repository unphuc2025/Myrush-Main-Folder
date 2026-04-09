import { apiClient } from '../api/client';

export const IMAGE_BASE_URL = 'https://rush-prod-static-bucket.s3.ap-south-1.amazonaws.com/';

export interface SiteSettings {
    id: string;
    company_name?: string;
    email: string;
    contact_number: string;
    address: string;
    copyright_text: string;
    instagram_url?: string;
    youtube_url?: string;
    linkedin_url?: string;
    site_logo?: string;
}

export const settingsApi = {
    // Get global public site configuration
    get: async (): Promise<SiteSettings | null> => {
        try {
            const response = await apiClient.get('/settings');
            return response.data;
        } catch (error) {
            console.error('Failed to fetch site settings:', error);
            return null;
        }
    }
};
