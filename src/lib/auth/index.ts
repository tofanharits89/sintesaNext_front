/**
 * Consolidated Auth Module
 * Single entry point for all authentication functionality
 * 
 * ⚠️ IMPORTANT: This file contains client-side React hooks.
 * For middleware/server contexts, use: @/lib/auth/utils-server
 */

// Client exports
export {
  AuthClient,
  authClient,
  login,
  logout,
  getCurrentUser,
  validateSession,
  refreshToken,
  getCSRFToken,
  type User,
  type AuthUser,
  type AuthResponse,
} from "./client";

// Hook exports - use simplified version
export {
  useAuth,
  useUnifiedAuth, // Legacy compatibility
  useAuthRedirect,
  canManageUsers,
  canAccessSettings,
  getRoleDisplayName,
  type UseAuthReturn,
} from "./simplified-hooks";

// Utility exports - use simplified version
export {
  // Cache management
  setGlobalQueryClient,
  clearAuthCacheOnFail,
  clearDataQueries,
  isQueryClientAvailable,
  
  // Redirect utilities
  redirectToLoginIfNotAuth,
} from "./simplified-utils";



// Cache Events - use simplified version
export {
  cacheEvents,
  clearAuthCaches,
  clearUserCaches,
  clearDataCaches,
  clearAllCaches,
} from "./simplified-cache-events";



// Server-safe exports (for middleware, API routes, server components)
export {
  getAuthCache,
  setAuthCache,
  invalidateAuthCache,
  hashKey,
  type AuthCacheEntry,
} from "./utils-server";

// Default export - use simplified version
export { useAuth as default } from "./simplified-hooks";
