import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/auth';
import { apiClient, USER_KEY } from '../api/apiClient';

export interface UserProfile {
  id: string;
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  city?: string;
  avatarUrl?: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  tempOTP?: string; // Temporary OTP storage for new user registration

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  loginWithPhone: (phoneNumber: string, otpCode: string, profileData?: any) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setAuthSuccess: (token: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  setAuthSuccess: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.setToken(token);
      const user = await authApi.getProfile();

      // Persist user data for offline access
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

      set({
        user: {
          id: user.id,
          email: user.email,
          phoneNumber: user.phone_number,
          firstName: user.first_name,
          lastName: user.last_name,
          city: user.city,
          avatarUrl: user.avatar_url,
        },
        token: token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('[AUTH] setAuthSuccess error:', error);
      set({ isLoading: false, error: error.message || 'Failed to set auth state' });
    }
  },

  login: async (credentials: LoginCredentials): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const user = await authApi.login(credentials);

      set({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          city: user.city,
          avatarUrl: user.avatar_url,
        },
        token: await apiClient.getToken() || '',
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Login failed' });
      return false;
    }
  },

  loginWithPhone: async (phoneNumber: string, otpCode: string, profileData?: any): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      console.log('[AUTH] Verifying OTP:', { phoneNumber, otpCode, profileData });

      // Prepare payload for backend
      const payload: any = {
        phone_number: phoneNumber,
        otp_code: otpCode,
      };

      // Add profile data if provided
      if (profileData) {
        Object.assign(payload, profileData);
      }

      // Call backend verify-otp endpoint
      // Update interface to include optional fields
      const authResp = await apiClient.post<{
        access_token?: string;
        token_type?: string;
        needs_profile?: boolean;
        message?: string;
        phone_number?: string;
      }>(
        '/auth/verify-otp',
        payload
      );

      console.log('[AUTH] Verify response:', authResp);

      if (authResp?.needs_profile) {
        console.log('[AUTH] User needs profile completion');
        set({ isLoading: false, error: authResp.message || 'Please complete your profile' });
        return false;
      }

      if (!authResp || !authResp.access_token) {
        console.error('[AUTH] Invalid response structure:', authResp);
        set({ isLoading: false, error: 'Invalid OTP or verification failed' });
        return false;
      }

      // Store token
      await apiClient.setToken(authResp.access_token);
      console.log('[AUTH] Token stored successfully');

      // Fetch user profile
      console.log('[AUTH] Fetching user profile...');
      const user = await authApi.getProfile();
      console.log('[AUTH] User profile fetched:', user);

      // Save user and token in state
      set({
        user: {
          id: user.id,
          email: user.email,
          phoneNumber: phoneNumber,
          firstName: user.first_name,
          lastName: user.last_name,
          city: user.city,
        },
        token: authResp.access_token,
        isAuthenticated: true,
        isLoading: false,
      });

      console.log('[AUTH] Login successful!');
      return true;
    } catch (error: any) {
      console.error('[AUTH] Login error:', error);
      console.error('[AUTH] Error message:', error.message);
      console.error('[AUTH] Error stack:', error.stack);
      set({ isLoading: false, error: error.message || 'Login failed' });
      return false;
    }
  },

  register: async (data: RegisterData): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const user = await authApi.register({
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
      });

      // Auto-login after registration
      return await useAuthStore.getState().login({
        email: data.email,
        password: data.password,
      });
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Registration failed' });
      return false;
    }
  },

  logout: async (): Promise<void> => {
    await authApi.logout();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: async (): Promise<void> => {
    console.log('[AUTH] Starting checkAuth...');
    set({ isLoading: true });

    try {
      // 1. Check if we have a token
      const token = await apiClient.getToken();

      if (!token) {
        console.log('[AUTH] No token found - not authenticated');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        });
        return;
      }

      // 2. Try to fetch fresh profile from backend
      try {
        console.log('[AUTH] Token found, fetching fresh profile...');
        // We use a timeout here so we don't wait forever if network is flaky
        // But importantly, we catch the timeout error and fall back to cache
        // instead of logging out
        const user = await Promise.race([
          authApi.getProfile(),
          new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error('Network timeout')), 5000)
          )
        ]);

        // Success - update cache and state
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

        set({
          user: {
            id: user.id,
            email: user.email,
            phoneNumber: user.phone_number,
            firstName: user.first_name,
            lastName: user.last_name,
            city: user.city,
            avatarUrl: user.avatar_url,
          },
          token: token,
          isAuthenticated: true, // We have a working token and fresh user data
          isLoading: false,
        });
        console.log('[AUTH] checkAuth online success');
        return;

      } catch (networkError: any) {
        // 3. Handle Network/Timeout Errors vs Auth Errors
        console.log('[AUTH] Profile fetch failed:', networkError.message);

        // If explicitly unauthorized (401), verify token is actually invalid
        if (networkError.message && networkError.message.includes('401')) {
          console.log('[AUTH] Token expired/invalid (401) - logging out');
          await authApi.logout();
          set({ isAuthenticated: false, user: null, token: null, isLoading: false });
          return;
        }

        // For other errors (Network, Timeout, 500), try to load from cache
        console.log('[AUTH] Using offline/cached user data');
        const cachedUserJson = await AsyncStorage.getItem(USER_KEY);

        if (cachedUserJson) {
          const user = JSON.parse(cachedUserJson);
          set({
            user: {
              id: user.id,
              email: user.email,
              phoneNumber: user.phone_number,
              firstName: user.first_name,
              lastName: user.last_name,
              city: user.city,
              avatarUrl: user.avatar_url,
            },
            token: token,
            isAuthenticated: true, // Optimistically authenticated offline
            isLoading: false,
          });
          console.log('[AUTH] checkAuth offline success');
        } else {
          // No cache, but we have a token. 
          // Can't confirm user details, so we might have to force login 
          // or show a "Retry Connection" screen. For now, strict:
          console.log('[AUTH] No cached user data found - logging out');
          // await authApi.logout(); // Optional: Don't logout, just stay unauth
          set({ isAuthenticated: false, isLoading: false });
        }
      }

    } catch (error) {
      console.error('[AUTH] checkAuth critical error:', error);
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
