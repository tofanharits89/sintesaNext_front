/**
 * @deprecated This file is deprecated. All cookie utilities have been consolidated
 * into @/lib/cookieManager.ts. Please update your imports to use the consolidated system.
 *
 * Migration:
 * OLD: import { getAuthTokenFromCookie } from "@/utils/auth-utils"
 * NEW: import { getAuthTokenFromCookie } from "@/lib/cookieManager"
 *
 * This file will be removed in a future version.
 */

// Re-export all functions from the consolidated cookie manager for backward compatibility
export {
  // Core cookie functions
  getCookie,
  getAllCookies,
  hasAuthCookies,
  clearNonHttpOnlyCookies,
  clearAuthCookies,
  verifyAuthCookiesCleared,
  getCookieIntegrityReport,
  performLogoutCleanup,

  // Token functions (merged from original auth-utils.ts)
  getAuthTokenFromCookie,
  getRefreshTokenFromCookie,
  waitForAuthToken,
  isAuthenticated,
  isAuthSync,
  dispatchAuthEvent,
  refreshAccessToken,
  clearAuthToken,
} from "@/lib/cookieManager";

// Console warning for developers using deprecated imports
if (typeof console !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.warn(
    '[DEPRECATED] @/utils/auth-utils is deprecated. ' +
    'Please update your imports to use @/lib/cookieManager instead. ' +
    'This file will be removed in a future version.'
  );
}