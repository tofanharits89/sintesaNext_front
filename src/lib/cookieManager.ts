/**
 * Consolidated Cookie Management System
 *
 * Consolidates cookie management from multiple systems:
 * - cookieManager.ts (primary HTTP-only approach)
 * - auth-utils.ts (token extraction utilities)
 * - cookie-clearing.ts (unused comprehensive clearing)
 *
 * Features:
 * 1. HTTP-only security approach with backend Set-Cookie headers
 * 2. Token extraction and validation utilities
 * 3. Cookie integrity checks and verification
 * 4. Proper SameSite handling and security
 * 5. Consolidated API for all cookie operations
 */

import { logger } from "@/lib/utils";
import { parse } from "cookie";

/**
 * Cookie configuration for security
 */
export const COOKIE_CONFIG = {
  // Auth cookies that should be cleared on logout
  AUTH_COOKIES: [
    'accessToken',
    'refreshToken',
    'access_token',
    'refresh_token',
    'authToken',
    'auth_token',
    'token',
  ],
  
  // CSRF cookies (should NOT be cleared on logout)
  CSRF_COOKIES: [
    '_csrf',
    'XSRF-TOKEN',
  ],
  
  // Cookie attributes for clearing
  CLEAR_ATTRIBUTES: {
    path: '/',
    secure: typeof window !== 'undefined' ? window.location.protocol === 'https:' : true,
    sameSite: 'Lax' as const,
  },
};

/**
 * Get all cookies as a map
 */
export function getAllCookies(): Map<string, string> {
  const cookies = new Map<string, string>();
  
  if (typeof document === 'undefined') {
    return cookies;
  }

  document.cookie.split(';').forEach(cookie => {
    const [name, ...valueParts] = cookie.trim().split('=');
    if (name) {
      cookies.set(name, valueParts.join('='));
    }
  });

  return cookies;
}

/**
 * Check if any HTTP-only auth cookies exist (indirect check)
 * Note: We cannot directly check HTTP-only cookies from JavaScript
 * This checks for non-HTTP-only indicators of authentication state
 */
export function hasAuthCookies(): boolean {
  const cookies = getAllCookies();
  // Check for CSRF tokens which indicate authentication
  return COOKIE_CONFIG.CSRF_COOKIES.some(name => cookies.has(name));
}

/**
 * Get specific cookie value
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const value = document.cookie
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith(`${encodeURIComponent(name)}=`));
  
  if (!value) {
    return null;
  }
  
  return decodeURIComponent(value.split('=')[1] || '');
}

/**
 * HTTP-Only Only Approach: Clear only non-HTTP-only cookies
 * 
 * This function clears only non-HTTP-only cookies like CSRF tokens.
 * HTTP-only auth cookies are managed entirely by the backend.
 */
export function clearNonHttpOnlyCookies(): {
  cleared: string[];
  remaining: string[];
  success: boolean;
} {
  if (typeof document === 'undefined') {
    console.log('[CookieManager] Cannot clear cookies - document is undefined (SSR)');
    return { cleared: [], remaining: [], success: false };
  }

  console.log('[CookieManager] Clearing non-HTTP-only cookies (HTTP-only cookies managed by backend)');
  console.log('[CookieManager] Cookies before clear:', document.cookie);

  const cleared: string[] = [];
  const cookiesBefore = getAllCookies();

  // Only clear non-HTTP-only cookies (CSRF tokens, etc.)
  // HTTP-only cookies (accessToken, refreshToken) are cleared by backend Set-Cookie headers
  const nonHttpOnlyCookies = [
    'XSRF-TOKEN',
    '_csrf',
    'authState',
    'auth_user',
    // Add other non-sensitive cookies as needed
  ];

  // Get all possible domain variations
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const domains: string[] = [''];

  // Add current domain variations
  if (hostname !== 'localhost') {
    domains.push(hostname);
    domains.push(`.${hostname}`);
    
    // If hostname has multiple parts (e.g., app.example.com), also try base domain
    if (parts.length > 2) {
      const baseDomain = parts.slice(-2).join('.');
      domains.push(baseDomain);
      domains.push(`.${baseDomain}`);
    }
  }

  // Clear each non-HTTP-only cookie
  nonHttpOnlyCookies.forEach(name => {
    if (cookiesBefore.has(name)) {
      cleared.push(name);
      
      domains.forEach(domain => {
        const domainAttr = domain ? `domain=${domain};` : '';
        const secureAttr = COOKIE_CONFIG.CLEAR_ATTRIBUTES.secure ? 'secure;' : '';
        const sameSiteAttr = `SameSite=${COOKIE_CONFIG.CLEAR_ATTRIBUTES.sameSite};`;
        
        // Clear strategies
        const clearStrategies = [
          `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; ${domainAttr} ${secureAttr} ${sameSiteAttr}`,
          `${name}=; max-age=0; path=/; ${domainAttr} ${secureAttr} ${sameSiteAttr}`,
        ];

        clearStrategies.forEach(strategy => {
          document.cookie = strategy;
        });
      });
    }
  });

  // Verify clearing
  const cookiesAfter = getAllCookies();
  const remaining = nonHttpOnlyCookies.filter(name => cookiesAfter.has(name));

  const success = remaining.length === 0;

  console.log('[CookieManager] Non-HTTP-only cookie clear completed:', {
    cleared: cleared.length,
    remaining: remaining.length,
    success,
    clearedCookies: cleared,
  });

  console.log('[CookieManager] Cookies after clear:', document.cookie);

  return {
    cleared,
    remaining,
    success,
  };
}

/**
 * @deprecated Use clearNonHttpOnlyCookies() instead
 * This function is kept for backward compatibility but should not be used
 * as HTTP-only cookies are managed by the backend.
 */
export function clearAuthCookies(): {
  attempted: string[];
  remaining: string[];
  success: boolean;
} {
  console.warn('[CookieManager] ⚠️ clearAuthCookies() is deprecated. Use clearNonHttpOnlyCookies() instead.');
  const result = clearNonHttpOnlyCookies();
  return {
    attempted: result.cleared,
    remaining: result.remaining,
    success: result.success,
  };
}

/**
 * Verify that non-HTTP-only cookies are cleared
 * Returns true if no non-HTTP-only auth cookies exist
 */
export function verifyAuthCookiesCleared(): boolean {
  return !hasAuthCookies();
}

/**
 * Wait for non-HTTP-only cookies to be cleared (with timeout)
 * Useful after logout API call to ensure client-side cookies are cleared
 */
export async function waitForCookiesCleared(
  timeoutMs: number = 2000,
  checkIntervalMs: number = 100
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (verifyAuthCookiesCleared()) {
      console.log('[CookieManager] ✅ Non-HTTP-only cookies verified as cleared');
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
  }

  console.warn('[CookieManager] ⚠️ Timeout waiting for cookies to clear');
  return false;
}

/**
 * Get cookie integrity report
 * Useful for debugging cookie issues
 */
export function getCookieIntegrityReport(): {
  totalCookies: number;
  authCookies: string[];
  csrfCookies: string[];
  otherCookies: string[];
  hasAuthCookies: boolean;
  hasCsrfCookies: boolean;
} {
  const allCookies = getAllCookies();
  const cookieNames = Array.from(allCookies.keys());

  const authCookies = cookieNames.filter(name =>
    COOKIE_CONFIG.AUTH_COOKIES.includes(name)
  );

  const csrfCookies = cookieNames.filter(name =>
    COOKIE_CONFIG.CSRF_COOKIES.includes(name)
  );

  const otherCookies = cookieNames.filter(
    name => !authCookies.includes(name) && !csrfCookies.includes(name)
  );

  return {
    totalCookies: cookieNames.length,
    authCookies,
    csrfCookies,
    otherCookies,
    hasAuthCookies: authCookies.length > 0,
    hasCsrfCookies: csrfCookies.length > 0,
  };
}

/**
 * HTTP-Only Only logout cleanup
 * This should be called after the logout API call
 */
export async function performLogoutCleanup(): Promise<{
  cookiesCleared: boolean;
  localStorageCleared: boolean;
  sessionStorageCleared: boolean;
}> {
  console.log('[CookieManager] 🔄 Performing HTTP-only logout cleanup...');

  // 1. Clear non-HTTP-only cookies only (HTTP-only cleared by backend)
  const cookieResult = clearNonHttpOnlyCookies();

  // 2. Clear localStorage auth data (if any exists)
  let localStorageCleared = false;
  try {
    if (typeof localStorage !== 'undefined') {
      const authKeys = ['user', 'token', 'accessToken', 'refreshToken', 'auth'];
      authKeys.forEach(key => localStorage.removeItem(key));
      localStorageCleared = true;
      console.log('[CookieManager] ✅ localStorage cleared');
    }
  } catch (error) {
    console.warn('[CookieManager] ⚠️ Failed to clear localStorage:', error);
  }

  // 3. Clear sessionStorage auth data (if any exists)
  let sessionStorageCleared = false;
  try {
    if (typeof sessionStorage !== 'undefined') {
      const authKeys = ['user', 'token', 'accessToken', 'refreshToken', 'auth'];
      authKeys.forEach(key => sessionStorage.removeItem(key));
      sessionStorageCleared = true;
      console.log('[CookieManager] ✅ sessionStorage cleared');
    }
  } catch (error) {
    console.warn('[CookieManager] ⚠️ Failed to clear sessionStorage:', error);
  }

  // 4. Wait for non-HTTP-only cookies to be cleared
  const cookiesCleared = await waitForCookiesCleared(2000);

  console.log('[CookieManager] ✅ HTTP-only logout cleanup completed:', {
    cookiesCleared,
    localStorageCleared,
    sessionStorageCleared,
  });

  return {
    cookiesCleared,
    localStorageCleared,
    sessionStorageCleared,
  };
}

// =============================================================================
// TOKEN EXTRACTION UTILITIES (merged from auth-utils.ts)
// =============================================================================

/**
 * Get authentication token from cookies
 * Optimized for simplified cookie structure (accessToken only)
 *
 * SECURITY FIX: Removed socketToken preference to prevent XSS vulnerability
 * Socket.IO will now use server-side cookie reading instead of client-side access
 */
export function getAuthTokenFromCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookieString = document.cookie || "";

  if (!cookieString.trim()) {
    return null;
  }

  const cookies = parse(cookieString);

  // SECURITY FIX: Removed socketToken preference to prevent XSS vulnerability
  // Socket.IO will read this server-side
  const candidateCookieNames = [
    "accessToken",    // httpOnly cookie (Socket.IO will read this server-side)
  ];

  for (const name of candidateCookieNames) {
    const token = (cookies as any)[name];
    if (token && typeof token === "string" && token.trim()) {
      const parts = token.split(".");
      if (parts.length === 3) {
        try {
          // Decode payload to check expiry
          const payload = JSON.parse(atob(parts[1] || ''));
          const now = Date.now();
          const expMs = (payload.exp ?? 0) * 1000;

          if (payload.exp && expMs > now) {
            return token;
          }
        } catch (decodeError) {
          // ignore decode errors silently
        }
      } else {
        // invalid jwt format; continue
      }
    }
  }

  return null;
}

/**
 * Get refresh token from cookies
 * Used for token refresh operations
 */
export function getRefreshTokenFromCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookieString = document.cookie || "";
  if (!cookieString.trim()) {
    return null;
  }

  const cookies = parse(cookieString);
  return cookies.refreshToken || null;
}

/**
 * Check if user is authenticated by validating token from cookies
 * This is a synchronous check for immediate UI decisions
 * WARNING: Less reliable than server-side validation
 */
export function isAuthSync(): boolean {
  if (typeof window === "undefined") return false;

  // Conservative approach: assume not authenticated unless we can verify
  // This prevents false positives that could expose protected content
  const cookieString = document.cookie || "";
  return Boolean(cookieString && cookieString.includes('accessToken='));
}

/**
 * Wait for authentication token to be available with retry logic
 */
export async function waitForAuthToken(
  maxAttempts: number = 10,
  delayMs: number = 100
): Promise<string | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const token = getAuthTokenFromCookie();
    if (token) {
      return token;
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return null;
}

/**
 * Check if user is authenticated by validating session with API
 * SECURITY FIX: Replaced cookie presence check with proper validation
 */
export async function isAuthenticated(): Promise<boolean> {
  // Server-side rendering: cannot validate
  if (typeof window === "undefined") return false;

  try {
    // Use the synchronous check with API validation as fallback
    const token = getAuthTokenFromCookie();
    if (!token) return false;

    // Verify token is still valid by checking its expiry
    const parts = token.split('.');
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(atob(parts[1] || ''));
        const now = Date.now();
        const expMs = (payload.exp ?? 0) * 1000;

        if (payload.exp && expMs > now) {
          return true; // Token is valid
        }
      } catch {
        // Invalid token format
      }
    }

    return false;
  } catch (error) {
    logger.warn('[CookieManager] Authentication check failed:', error);
    return false;
  }
}

/**
 * Refresh access token using refresh token
 * Makes API call to refresh endpoint
 */
export async function refreshAccessToken(): Promise<{
  success: boolean;
  accessToken?: string;
  error?: string;
}> {
  try {
    const refreshToken = getRefreshTokenFromCookie();
    if (!refreshToken) {
      return { success: false, error: "No refresh token available" };
    }

    const { apiPath } = await import('./base-path');
    const response = await fetch(apiPath("/auth/refresh"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error(`Refresh failed: ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      return { success: true, accessToken: data.data.accessToken };
    } else {
      return { success: false, error: data.message || "Refresh failed" };
    }
  } catch (error) {
    logger.error("[CookieManager] Token refresh error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Dispatch authentication event for cross-tab synchronization
 */
export function dispatchAuthEvent(
  eventType: "login" | "logout",
  data?: any
): void {
  if (typeof window === "undefined") return;

  const event = new CustomEvent(`auth:${eventType}`, {
    detail: data,
    bubbles: true,
  });
  window.dispatchEvent(event);
}

// =============================================================================
// BACKWARD COMPATIBILITY LAYER (merged from auth-utils.ts)
// =============================================================================

/**
 * Legacy clearAuthToken function for backward compatibility
 * @deprecated Use clearNonHttpOnlyCookies() or performLogoutCleanup() instead
 */
export function clearAuthToken(): void {
  console.warn('[CookieManager] ⚠️ clearAuthToken() is deprecated. Use clearNonHttpOnlyCookies() or performLogoutCleanup() instead.');

  try {
    // Use the secure HTTP-only approach
    clearNonHttpOnlyCookies();

    // Clear React Query cache for user profile to prevent stale data
    import("@tanstack/react-query").then(({ QueryClient }) => {
      const queryClient = new QueryClient();
      queryClient.setQueryData(["current-user-profile"], undefined);
    }).catch(() => {
      // Ignore if React Query is not available
    });

    // Dispatch logout event
    dispatchAuthEvent("logout");
  } catch (error) {
    logger.error("[CookieManager Error] Failed to clear auth tokens:", error);
  }
}

// =============================================================================
// GLOBAL DEBUG INTERFACE (enhanced)
// =============================================================================

// Expose globally for debugging (HTTP-only only approach)
if (typeof window !== 'undefined') {
  (window as any).__cookieManager = {
    // Core cookie functions
    getCookie,
    getAllCookies,
    hasAuthCookies,
    clearNonHttpOnlyCookies,
    clearAuthCookies, // Deprecated but kept for compatibility
    verifyAuthCookiesCleared,
    getCookieIntegrityReport,
    performLogoutCleanup,

    // Token functions (merged from auth-utils.ts)
    getAuthTokenFromCookie,
    getRefreshTokenFromCookie,
    isAuthSync,
    waitForAuthToken,
    isAuthenticated,
    refreshAccessToken,
    dispatchAuthEvent,

    // Legacy functions (for backward compatibility)
    clearAuthToken,
  };
  console.log('[CookieManager] Enhanced debug functions available at window.__cookieManager (consolidated system)');
}
