import { create } from 'zustand';
import * as authApi from '../api/auth';
import { apiClient } from '../api/apiClient';

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
      const isAuth = await Promise.race([
        authApi.isAuthenticated(),
        new Promise<boolean>((resolve) => setTimeout(() => {
          console.log('[AUTH] checkAuth timeout - assuming not authenticated');
          resolve(false);
        }, 3000)) // 3 second timeout
      ]);

      console.log('[AUTH] isAuthenticated result:', isAuth);

      if (isAuth) {
        try {
          const user = await authApi.getProfile();
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
            token: await apiClient.getToken() || '',
            isAuthenticated: true,
            isLoading: false,
          });
          console.log('[AUTH] checkAuth completed - user authenticated');
          return;
        } catch (error) {
          console.log('[AUTH] Profile fetch failed - logging out');
          // Token might be expired, clear auth state
          await authApi.logout();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        console.log('[AUTH] checkAuth completed - not authenticated');
        set({ isLoading: false, isAuthenticated: false });
      }
    } catch (error) {
      console.error('[AUTH] checkAuth error:', error);
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
