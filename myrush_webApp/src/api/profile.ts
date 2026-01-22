import { apiClient } from './client';

export interface City {
    id: string;
    name: string;
}

export interface GameType {
    id: string;
    name: string;
}

export interface Branch {
    id: string;
    name: string;
    city_id?: string;
}

export interface ProfileData {
    id?: string;
    full_name: string;
    email?: string;
    phone_number?: string;
    age?: number;
    city?: string;
    city_id?: string;
    gender?: string;
    handedness?: string;
    skill_level?: string;
    sports?: string[];
    playing_style?: string;
    role?: string;
}

export const profileApi = {
    getProfile: async (phoneNumber?: string) => {
        try {
            // Use the correct profile endpoint for reading
            const response = await apiClient.get<ProfileData>('/profile');
            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
            };
        }
    },

    createOrUpdateProfile: async (profileData: Partial<ProfileData>) => {
        try {
            // Use the correct profile endpoint from backend router
            const response = await apiClient.post('/profile', profileData);
            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            console.error('[PROFILE API] Failed to update profile:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    getCities: async (): Promise<{ success: boolean; data: City[]; error?: string }> => {
        try {
            const response = await apiClient.get<City[]>('/profile/cities');
            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            console.error('[PROFILE API] Failed to fetch cities:', error.message);
            return {
                success: false,
                data: [],
                error: error.message,
            };
        }
    },

    getGameTypes: async (): Promise<{ success: boolean; data: GameType[]; error?: string }> => {
        try {
            const response = await apiClient.get<GameType[]>('/profile/game-types');
            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            // Fallback
            return {
                success: true,
                data: [
                    { id: '1', name: 'Badminton' },
                    { id: '2', name: 'Tennis' },
                    { id: '3', name: 'Squash' },
                    { id: '4', name: 'Table Tennis' },
                ],
            };
        }
    },

    getBranches: async (cityId?: string): Promise<{ success: boolean; data: Branch[]; error?: string }> => {
        try {
            // Correct endpoint from mobile: /profile/branches
            const url = cityId ? `/profile/branches?city_id=${cityId}` : '/profile/branches';
            const response = await apiClient.get<Branch[]>(url);
            return { success: true, data: response.data };
        } catch (error: any) {
            return { success: false, data: [] };
        }
    }
};
