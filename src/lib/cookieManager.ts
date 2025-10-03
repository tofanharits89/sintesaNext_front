/**
 * Improved Cookie Management
 * 
 * Addresses the issues with frontend cookie clearing by:
 * 1. Relying primarily on backend Set-Cookie headers
 * 2. Adding cookie integrity checks
 * 3. Implementing proper SameSite handling
 * 4. Providing verification mechanisms
 */

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
 * Check if any auth cookies exist
 */
export function hasAuthCookies(): boolean {
  const cookies = getAllCookies();
  return COOKIE_CONFIG.AUTH_COOKIES.some(name => cookies.has(name));
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
 * IMPROVED: Clear auth cookies with verification
 * 
 * This function attempts to clear cookies but acknowledges that:
 * 1. Frontend cannot reliably clear HttpOnly cookies
 * 2. Backend Set-Cookie headers are the authoritative way to clear cookies
 * 3. This is a best-effort cleanup for non-HttpOnly cookies
 */
export function clearAuthCookies(): {
  attempted: string[];
  remaining: string[];
  success: boolean;
} {
  if (typeof document === 'undefined') {
    console.log('[CookieManager] Cannot clear cookies - document is undefined (SSR)');
    return { attempted: [], remaining: [], success: false };
  }

  console.log('[CookieManager] ⚠️ Attempting to clear auth cookies');
  console.log('[CookieManager] Cookies before clear:', document.cookie);

  const attempted: string[] = [];
  const cookiesBefore = getAllCookies();

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

  // Clear each auth cookie with all domain/path combinations
  COOKIE_CONFIG.AUTH_COOKIES.forEach(name => {
    attempted.push(name);
    
    domains.forEach(domain => {
      const domainAttr = domain ? `domain=${domain};` : '';
      const secureAttr = COOKIE_CONFIG.CLEAR_ATTRIBUTES.secure ? 'secure;' : '';
      const sameSiteAttr = `SameSite=${COOKIE_CONFIG.CLEAR_ATTRIBUTES.sameSite};`;
      
      // Multiple clearing strategies
      const clearStrategies = [
        // Strategy 1: Standard clear with all attributes
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; ${domainAttr} ${secureAttr} ${sameSiteAttr}`,
        
        // Strategy 2: Clear with max-age=0
        `${name}=; max-age=0; path=/; ${domainAttr} ${secureAttr} ${sameSiteAttr}`,
        
        // Strategy 3: Clear with /api path (for API-specific cookies)
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/api; ${domainAttr} ${secureAttr} ${sameSiteAttr}`,
        
        // Strategy 4: Clear without domain (current domain only)
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; ${secureAttr} ${sameSiteAttr}`,
      ];

      clearStrategies.forEach(strategy => {
        document.cookie = strategy;
      });
    });
  });

  // Verify clearing
  const cookiesAfter = getAllCookies();
  const remaining = COOKIE_CONFIG.AUTH_COOKIES.filter(name => cookiesAfter.has(name));

  const success = remaining.length === 0;

  console.log('[CookieManager] Clear attempt completed:', {
    attempted: attempted.length,
    remaining: remaining.length,
    success,
  });

  if (remaining.length > 0) {
    console.warn('[CookieManager] ⚠️ Some cookies could not be cleared (likely HttpOnly):', remaining);
    console.warn('[CookieManager] This is expected - backend Set-Cookie headers will clear HttpOnly cookies');
  } else {
    console.log('[CookieManager] ✅ All non-HttpOnly auth cookies cleared');
  }

  console.log('[CookieManager] Cookies after clear:', document.cookie);

  return {
    attempted,
    remaining,
    success,
  };
}

/**
 * Verify that auth cookies are cleared
 * Returns true if no auth cookies exist
 */
export function verifyAuthCookiesCleared(): boolean {
  return !hasAuthCookies();
}

/**
 * Wait for cookies to be cleared (with timeout)
 * Useful after logout API call to ensure cookies are cleared
 */
export async function waitForCookiesCleared(
  timeoutMs: number = 2000,
  checkIntervalMs: number = 100
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (verifyAuthCookiesCleared()) {
      console.log('[CookieManager] ✅ Cookies verified as cleared');
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
 * Enhanced logout with cookie verification
 * This should be called after the logout API call
 */
export async function performLogoutCleanup(): Promise<{
  cookiesCleared: boolean;
  localStorageCleared: boolean;
  sessionStorageCleared: boolean;
}> {
  console.log('[CookieManager] 🔄 Performing logout cleanup...');

  // 1. Clear auth cookies (best effort)
  const cookieResult = clearAuthCookies();

  // 2. Clear localStorage auth data
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

  // 3. Clear sessionStorage auth data
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

  // 4. Wait for cookies to be cleared (by backend Set-Cookie headers)
  const cookiesCleared = await waitForCookiesCleared(2000);

  console.log('[CookieManager] ✅ Logout cleanup completed:', {
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

// Expose globally for debugging
if (typeof window !== 'undefined') {
  (window as any).__cookieManager = {
    getAllCookies,
    hasAuthCookies,
    clearAuthCookies,
    verifyAuthCookiesCleared,
    getCookieIntegrityReport,
    performLogoutCleanup,
  };
  console.log('[CookieManager] Debug functions available at window.__cookieManager');
}
