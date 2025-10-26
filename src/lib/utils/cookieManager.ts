/**
 * Backward compatibility layer for cookieManager imports
 * Redirects to existing HTTP-only cookie system with unified auth integration
 */

import { getCookie } from '../api/httpClient';

// Re-export existing cookie utilities
export { getCookie };

// Simple auth token access (limited since cookies are HTTP-only)
export function getAuthTokenFromCookie(): string | null {
  return getCookie('access_token');
}

// Unified auth system integration - dispatch events for socket and component coordination
export const dispatchAuthEvent = {
  login: (user: any, accessToken?: string) => {
    // Dispatch event for socket system to connect
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:login', {
        detail: { user, accessToken }
      }));
    }
  },
  logout: (reason?: string) => {
    // Dispatch event for socket system to disconnect
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:logout', {
        detail: { reason }
      }));
    }
  },
  sessionExpired: (reason: string, message: string) => {
    console.warn('Session expired event dispatched:', { reason, message });
    // Dispatch logout event for cleanup
    dispatchAuthEvent.logout(reason);
  },
};

// Common cookie operations (server-side only)
export const cookieOperations = {
  // Note: These are no-ops on client since cookies are HTTP-only
  set: () => console.warn('Cookie setting is now handled server-side via HTTP-only cookies'),
  remove: () => console.warn('Cookie removal is now handled server-side via HTTP-only cookies'),
  get: getCookie,
};

// Clear any remaining client-side cookies (for cleanup)
export function clearNonHttpOnlyCookies(): void {
  if (typeof document === "undefined") return;

  // List of potential client-side cookies to clear
  const clientCookies = [
    'old_token', 'legacy_auth', 'user_data', 'XSRF-TOKEN', 'csrf_token',
    'session_state', 'auth_redirect'
  ];

  clientCookies.forEach(name => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
}

// Backward compatibility functions for socket cleanup
export function performLogoutCleanup(): void {
  clearNonHttpOnlyCookies();
  dispatchAuthEvent.logout();
}

export function waitForAuthToken(timeout = 5000): Promise<string | null> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const checkToken = () => {
      const token = getAuthTokenFromCookie();
      if (token) {
        resolve(token);
        return;
      }

      if (Date.now() - startTime > timeout) {
        resolve(null);
        return;
      }

      setTimeout(checkToken, 100);
    };

    checkToken();
  });
}
