import { apiClient } from '../api/client';

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
            const response = await apiClient.get('/cms', {
                params: { limit: 100 }
            });
            // The apiClient interceptor already unwraps response.data.data
            // We just need to handle the data structure from there
            const items = response.data.items || [];
            return items.filter((page: CMSPage) => page.is_active);
        } catch (error) {
            console.error('Failed to fetch CMS pages:', error);
            return [];
        }
    },

    // Get a specific page by its slug for the CmsPage component
    getBySlug: async (slug: string): Promise<CMSPage> => {
        const response = await apiClient.get(`/cms/${slug}`);
        return response.data;
    }
};
