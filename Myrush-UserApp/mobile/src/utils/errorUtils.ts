/**
 * Checks if an error is a network-related error (offline, DNS, timeout)
 * In React Native fetch, this usually manifests as "Network request failed"
 */
export const isNetworkError = (error: any): boolean => {
  if (!error) return false;
  
  const message = error.message || '';
  return (
    message.toLowerCase().includes('network request failed') ||
    message.toLowerCase().includes('failed to fetch') ||
    message.toLowerCase().includes('timed out') ||
    message.toLowerCase().includes('timeout') ||
    message.toLowerCase().includes('unreachable')
  );
};

/**
 * Returns a user-friendly error message for a given error
 */
export const getFriendlyErrorMessage = (error: any, fallback: string = 'Something went wrong. Please try again.'): string => {
  if (isNetworkError(error)) {
    return 'No internet connection. Please check your network and try again.';
  }
  
  return error.message || fallback;
};
