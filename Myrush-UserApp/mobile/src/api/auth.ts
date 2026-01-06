import { apiClient, TOKEN_KEY, USER_KEY } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
    id: string;
    email: string;
    phone_number?: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    created_at: string;
}

export interface RegisterData {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}

export interface RegisterResponse {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    created_at: string;
}

/**
 * Register a new user
 */
export const register = async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/auth/register', data);
    return response;
};

/**
 * Login user
 */
export const login = async (data: LoginData): Promise<User> => {
    // FastAPI OAuth2 expects form data with 'username' field
    const formData = new FormData();
    formData.append('username', data.email);
    formData.append('password', data.password);

    const response = await fetch(`${(apiClient as any).baseUrl}/auth/login`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
    }

    const authData: AuthResponse = await response.json();

    // Store the token
    await apiClient.setToken(authData.access_token);

    // Get user profile
    const user = await getProfile();

    // Store user data
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

    return user;
};

/**
 * Get current user profile
 */
export const getProfile = async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/profile');
    return response;
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
    await apiClient.removeToken();
    await AsyncStorage.removeItem(USER_KEY);
};

/**
 * Get current user from storage
 */
export const getCurrentUser = async (): Promise<User | null> => {
    try {
        const userJson = await AsyncStorage.getItem(USER_KEY);
        if (userJson) {
            return JSON.parse(userJson);
        }
        return null;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
    const token = await apiClient.getToken();
    return token !== null;
};

export default {
    register,
    login,
    getProfile,
    logout,
    getCurrentUser,
    isAuthenticated,
};
