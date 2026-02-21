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
    // For Android Emulator: 10.0.2.2 maps to host's localhost
    // For iOS Simulator: localhost works  
    // For Physical Device: use your computer's local IP (e.g., 192.168.1.X)
    // DETECTED IP: 192.168.1.3 (current machine IP)
    return 'http://192.168.1.3:8000/api/user';
  }

  // Production fallback - hosted backend
  console.warn('⚠️ API_BASE_URL not set in environment variables. Using hosted backend.');
  return 'http://65.0.195.149:8000/api/user';
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
