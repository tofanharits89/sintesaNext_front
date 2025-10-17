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

// Hook exports
export {
  useAuth,
  useUnifiedAuth, // Legacy compatibility
  useAuthRedirect,
  useCacheDebug, // Phase 4: Cache debugging hook
  canManageUsers,
  canAccessSettings,
  getRoleDisplayName,
  authUtils,
  type UseAuthReturn,
} from "./hooks";

// Utility exports
export {
  // Cache management
  setGlobalQueryClient,
  clearAuthCacheOnFail,
  clearDataQueries,
  isQueryClientAvailable,
  
  // Middleware cache
  getAuthCache,
  setAuthCache,
  invalidateAuthCache,
  hashKey,
  type AuthCacheEntry,
  
  // Redirect utilities
  redirectToLoginIfNotAuth,
  
  // Event coordination
  authEventCoordinator,
  emitTokenRefreshStart,
  emitTokenRefreshSuccess,
  emitTokenRefreshError,
  emitAuthExpired,
  emitLoginStart,
  emitLoginSuccess,
  
  // Cross-tab sync
  crossTabSync,
  sendCrossTabEvent,
  listenForCrossTabEvents,
  CrossTabSyncManager,
} from "./utils";

// Cache Events (Phase 4: Unified Cache Invalidation)
export {
  cacheEvents,
  initializeCacheEvents,
  clearAuthCaches,
  clearUserCaches,
  clearDataCaches,
  clearAllCaches,
  getCacheStats,
  debugCacheState,
  type CacheInvalidationEvent,
  type CacheInvalidationOptions,
} from "./cache-events";

// Default export
export { useAuth as default } from "./hooks";
