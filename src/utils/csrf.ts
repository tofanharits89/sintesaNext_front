/**
 * CSRF Token Utilities
 * Helper functions for reading and using CSRF tokens
 */

/**
 * Get CSRF token from cookie
 * The CSRF token is stored in the XSRF-TOKEN cookie (non-HTTP-only)
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; XSRF-TOKEN=`);
  
  if (parts.length === 2) {
    const token = parts.pop()?.split(';').shift();
    return token ? decodeURIComponent(token) : null;
  }
  
  return null;
}

/**
 * Get headers with CSRF token included
 * Use this when making state-changing requests (POST, PUT, DELETE)
 */
export function getHeadersWithCsrf(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {
    ...additionalHeaders,
  };
  
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  return headers;
}
