import { apiClient, API_BASE_URL } from './apiClient';

export interface SaveProfilePayload {
  phoneNumber: string;
  fullName: string;
  age?: number;
  city: string;
  city_id?: string | null;
  gender?: string;
  handedness: string;
  skillLevel?: string;
  sports: string[];
  playingStyle: string;
}

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
  address_line1?: string;
}

export interface SaveProfileResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface ProfileData {
  id: string;
  phone_number: string;
  full_name: string;
  age?: number;
  city: string;
  gender?: string;
  handedness: string;
  skill_level?: string;
  sports: string[];
  playing_style: string;
  avatar_url?: string; // Added avatar_url
  created_at: string;
  updated_at?: string;
}

export const profileApi = {
  saveProfile: async (payload: SaveProfilePayload): Promise<SaveProfileResponse> => {
    try {
      console.log('[PROFILE API] Saving profile:', payload);

      // Convert payload to match backend schema
      const profileData = {
        phone_number: payload.phoneNumber,
        full_name: payload.fullName,
        age: payload.age || null,
        city: payload.city,
        gender: payload.gender || null,
        handedness: payload.handedness,
        skill_level: payload.skillLevel || null,
        sports: payload.sports,
        playing_style: payload.playingStyle,
      };

      const data = await apiClient.post<ProfileData>('/profile/', profileData);

      console.log('[PROFILE API] Success:', data);
      return {
        success: true,
        message: 'Profile saved successfully',
        data,
      };
    } catch (error: any) {
      console.error('[PROFILE API] Exception:', error);
      return {
        success: false,
        message: error.message || 'An error occurred while saving profile',
        error: error.message,
      };
    }
  },

  getProfile: async (phoneNumber: string): Promise<SaveProfileResponse> => {
    try {
      // Note: The backend uses auth tokens, not phone number lookup
      // So we'll get the current user's profile
      const data = await apiClient.get<ProfileData>('/profile/');

      return {
        success: true,
        message: 'Profile retrieved successfully',
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve profile',
        error: error.message,
      };
    }
  },

  getCities: async (): Promise<{ success: boolean; data: City[]; error?: string }> => {
    try {
      const data = await apiClient.get<City[]>('/profile/cities');
      return {
        success: true,
        data,
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
      const data = await apiClient.get<GameType[]>('/profile/game-types');
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      // Fallback data when backend is unavailable
      console.warn('[PROFILE API] Using fallback game types data:', error.message);
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
      const url = cityId ? `/profile/branches?city_id=${cityId}` : '/profile/branches';
      const data = await apiClient.get<Branch[]>(url);
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('[PROFILE API] Failed to fetch branches:', error.message);
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }
  },

  uploadAvatar: async (formData: FormData): Promise<SaveProfileResponse> => {
    try {
      const token = await apiClient.getToken();
      // Use the singleton instance's base URL (cleaner than requiring)
      const { API_BASE_URL } = require('./apiClient');
      const baseUrl = API_BASE_URL.replace(/\/$/, '');
      const url = `${baseUrl}/profile/upload-avatar`;

      console.log(`[PROFILE API] Uploading avatar to ${url} using fetch`);

      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      // CRITICAL: Do NOT set Content-Type for FormData. Fetch will set it with the boundary.

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      console.log('[PROFILE API] Response status:', response.status);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to upload avatar');
      }

      return {
        success: true,
        message: 'Avatar uploaded successfully',
        data,
      };
    } catch (error: any) {
      console.error('[PROFILE API] Upload failed:', error);
      return {
        success: false,
        message: error.message || 'Failed to upload avatar',
        error: error.message,
      };
    }
  },
};

export default profileApi;
