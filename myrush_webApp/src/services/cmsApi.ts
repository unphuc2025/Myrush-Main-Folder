import axios from 'axios';

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// VITE_API_URL contains '/api/user', so we strip it to get the base host url
const API_URL = RAW_API_URL.replace(/\/api\/user\/?$/, '');

export interface CMSPage {
    id: string;
    title: string;
    slug: string;
    content: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export const cmsApi = {
    // Get all public active CMS pages for the footer
    getAllActive: async (): Promise<CMSPage[]> => {
        try {
            console.log('Fetching CMS pages from:', `${API_URL}/api/user/cms`);
            const response = await axios.get(`${API_URL}/api/user/cms`, {
                params: { limit: 100 }
            });
            console.log('Raw CMS API Response:', response.data);
            const activePages = response.data.items?.filter((page: CMSPage) => page.is_active) || [];
            console.log('Filtered Active CMS Pages:', activePages);
            return activePages;
        } catch (error) {
            console.error('Failed to fetch CMS pages:', error);
            return [];
        }
    },

    // Get a specific page by its slug for the CmsPage component
    getBySlug: async (slug: string): Promise<CMSPage> => {
        const response = await axios.get(`${API_URL}/api/user/cms/${slug}`);
        return response.data;
    }
};
