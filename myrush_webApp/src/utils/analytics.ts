/**
 * Google Analytics 4 (GTags) Utility Service
 * Enforces snake_case naming and provides safe wrapper functions.
 */

const GA_MEASUREMENT_ID = 'G-L2EZSSN2YF';

// Extend window object for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Identify the current user in GA4.
 * Should be called right after login/profile fetch.
 */
export const setGAUser = (user_id: string | number) => {
  if (typeof window.gtag === 'function' && user_id) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      user_id: user_id
    });
    // Log explicit identification event
    window.gtag('event', 'logged_in', { user_id });
  }
};

/**
 * Clear user identification on logout.
 */
export const clearGAUser = () => {
  if (typeof window.gtag === 'function') {
    window.gtag('config', GA_MEASUREMENT_ID, {
      user_id: null
    });
  }
};

/**
 * Track a custom event with parameters.
 * Automatically handles safety checks.
 */
export const trackGAEvent = (event_name: string, params: Record<string, any> = {}) => {
  if (typeof window.gtag === 'function') {
    // Parameter keys are expected to be in snake_case per user requirement
    window.gtag('event', event_name, params);
  } else {
    console.warn(`[Analytics] gtag not available for event: ${event_name}`);
  }
};
