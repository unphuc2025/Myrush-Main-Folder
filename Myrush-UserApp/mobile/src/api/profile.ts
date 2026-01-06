import { apiClient } from './apiClient';

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
};

export default profileApi;
