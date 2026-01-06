/**
 * Environment Configuration
 * 
 * This file manages environment-specific settings for the app.
 * It reads from .env files and provides fallback values.
 */

// Import environment variables
// Note: react-native-dotenv should be configured in babel.config.js
import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

/**
 * Get API Base URL based on environment
 * Priority:
 * 1. Environment variable from .env file
 * 2. Fallback to localhost for development
 */
export const getApiBaseUrl = (): string => {
  // Try to get from environment variable
  if (ENV_API_BASE_URL) {
    return ENV_API_BASE_URL;
  }

  // Fallback for development
  // Use local IP for physical devices, localhost for emulator
  const isDevelopment = __DEV__;

  if (isDevelopment) {
    // Default to local network IP for development
    // Update to match your local IP
    return 'http://192.168.1.3:8000/api/user';
  }

  // Production fallback - this should be set in .env.production
  console.warn('⚠️ API_BASE_URL not set in environment variables. Using fallback.');
  return 'http://192.168.1.3:8000/api/user';
};

/**
 * App Configuration
 */
export const config = {
  apiBaseUrl: getApiBaseUrl(),
  appName: 'MyRush',
  isDevelopment: __DEV__,
};

export default config;
