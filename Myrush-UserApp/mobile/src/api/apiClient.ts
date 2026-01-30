import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../config/env';

// Backend API Configuration
// This is now managed through environment variables (.env file)
// For development: uses local IP from .env
// For production APK: uses production URL from .env.production
const API_BASE_URL = config.apiBaseUrl;

// Log the API URL being used (helpful for debugging)
console.log(`[API Client] Using API Base URL: ${API_BASE_URL}`);

// Token storage keys
const TOKEN_KEY = '@myrush_access_token';
const USER_KEY = '@myrush_user';

/**
 * API Client for MyRush Backend
 */
class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    /**
     * Get stored access token
     */
    async getToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(TOKEN_KEY);
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    }

    /**
     * Store access token
     */
    async setToken(token: string): Promise<void> {
        try {
            await AsyncStorage.setItem(TOKEN_KEY, token);
        } catch (error) {
            console.error('Error setting token:', error);
        }
    }

    /**
     * Remove access token
     */
    async removeToken(): Promise<void> {
        try {
            await AsyncStorage.removeItem(TOKEN_KEY);
            await AsyncStorage.removeItem(USER_KEY);
        } catch (error) {
            console.error('Error removing token:', error);
        }
    }

    /**
     * Make authenticated request
     */
    async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const token = await this.getToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            try {
                const shortToken = `${token.substring(0, 12)}...${token.substring(token.length - 8)}`;
                console.log('[API Client] Using auth token for', endpoint, ':', shortToken);
            } catch {
                console.log('[API Client] Using auth token for', endpoint);
            }
        } else {
            console.log('[API Client] No auth token for', endpoint);
        }

        const url = `${this.baseUrl}${endpoint}`;
        console.log('[API Client] Request:', url, options.method || 'GET');

        // Add timeout logic
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                signal: controller.signal as any,
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const error = await response.json();
                        errorMessage = error.detail || error.message || errorMessage;
                    } else {
                        const text = await response.text();
                        console.error('Non-JSON error response:', text.substring(0, 200));
                        errorMessage = `Server error: ${response.status}`;
                    }
                } catch (e) {
                    // Failed to parse error, use default message
                    console.error('Error parsing error response:', e);
                }
                throw new Error(errorMessage);
            }

            return response.json();
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw new Error('Request timed out');
            }
            throw error;
        }
    }

    /**
     * POST request
     */
    async post<T>(endpoint: string, data: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * GET request
     */
    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'GET',
        });
    }

    /**
     * PUT request
     */
    async put<T>(endpoint: string, data: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    /**
     * DELETE request
     */
    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'DELETE',
        });
    }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export API base URL for reference
export { API_BASE_URL, TOKEN_KEY, USER_KEY };

export default apiClient;
