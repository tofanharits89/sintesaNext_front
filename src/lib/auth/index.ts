/**
 * Consolidated Auth Module
 * Single entry point for all authentication functionality
 *
 * ⚠️ IMPORTANT: This file contains client-side React hooks.
 * For middleware/server contexts, use: @/lib/auth/simplified-utils
 */

// Client exports
export {
  AuthClient,
  authClient,
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
} from "./simplified-utils";

// Cache Events - use simplified version
export {
  clearAuthCaches,
  clearDataCaches,
  clearAllCaches,
} from "./simplified-cache-events";

// Default export - use simplified version
export { useAuth as default } from "./simplified-hooks";
