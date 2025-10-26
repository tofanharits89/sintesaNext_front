/**
 * Server-Safe Auth Utilities
 * Only exports utilities that can run in Edge/Node runtime (no React hooks)
 * Use this in middleware and server components
 */

// Re-export only server-safe utilities from utils.ts
export {
  // Middleware cache (Edge/Runtime)
  getAuthCache,
  setAuthCache,
  invalidateAuthCache,
  hashKey,
  type AuthCacheEntry,
} from "./simplified-utils";
