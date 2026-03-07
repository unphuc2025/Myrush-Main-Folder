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
 * Get the root server URL (without /api/user suffix)
 */
export const getRootUrl = (): string => {
  const apiUrl = getApiBaseUrl();
  // Remove /api/user or /api/admin suffix to get the root
  return apiUrl.split('/api')[0];
};

/**
 * Ensures an image URL is absolute
 * If it's a relative path starting with /api/media, prepends the root URL
 */
export const getImageUrl = (path: string | null | undefined): string | undefined => {
  if (!path || typeof path !== 'string' || path.trim() === '' || path === 'null' || path === 'undefined') return undefined;

  const rootUrl = getRootUrl();

  // Handle double-slash protocol-relative URLs
  let normalizedPath = path.startsWith('//') ? `https:${path}` : path;

  // If it's already a full URL
  if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
    // Normalize localhost/127.0.0.1 to the current rootUrl's host
    if (normalizedPath.includes('localhost') || normalizedPath.includes('127.0.0.1')) {
      try {
        const urlParts = normalizedPath.split('://')[1].split('/');
        urlParts.shift(); // remove host:port
        const relativePath = urlParts.join('/');
        return `${rootUrl}/${relativePath}`;
      } catch (e) {
        return normalizedPath;
      }
    }
    return normalizedPath;
  }

  // It's a relative path.
  // Check if it already starts with /api/media or /uploads
  if (normalizedPath.startsWith('/api/media') || normalizedPath.startsWith('api/media') || 
      normalizedPath.startsWith('/uploads') || normalizedPath.startsWith('uploads')) {
    const formattedPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
    return `${rootUrl}${formattedPath}`;
  }

  // Otherwise, default to prepending /api/media/ for images from the DB that aren't resolved
  const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath;
  return `${rootUrl}/api/media/${cleanPath}`;
};

/**
 * App Configuration
 */
export const config = {
  apiBaseUrl: getApiBaseUrl(),
  rootUrl: getRootUrl(),
  appName: 'MyRush',
  isDevelopment: __DEV__,
};

export default config;
