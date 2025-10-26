/**
 * Simplified Auth Utilities
 * Clean, focused utility functions
 * Removed: complex event coordination, cross-tab sync, middleware cache
 */

import { QueryClient } from "@tanstack/react-query";

// ============================================================================
// Cache Management
// ============================================================================

let globalQueryClient: QueryClient | null = null;

export function setGlobalQueryClient(qc: QueryClient) {
  globalQueryClient = qc;
}

/**
 * Clear all React Query cache when authentication fails
 */
export function clearAuthCacheOnFail() {
  if (!globalQueryClient) {
    console.warn("[AuthCache] No queryClient available for cache clearing");
    return;
  }

  try {
    globalQueryClient.clear();
    console.log("[AuthCache] ✅ All React Query cache cleared due to auth failure");
  } catch (error) {
    console.error("[AuthCache] Failed to clear cache:", error);
  }
}

/**
 * Clear specific data-related queries
 */
export function clearDataQueries() {
  if (!globalQueryClient) return;

  try {
    const authDependentKeys = [
      "realisasi-per-jenis-belanja",
      "realisasi-kl-per-fungsi",
      "quick-stats",
      "realisasi-kl-pagu-terbesar",
      "realisasi-kl-pagu-program-terbesar",
      "tren-realisasi-bulanan",
      "persentase-realisasi-kl",
    ];

    for (const key of authDependentKeys) {
      globalQueryClient.removeQueries({ queryKey: [key] });
    }

    console.log("[AuthCache] ✅ Auth-dependent queries cleared");
  } catch (error) {
    console.error("[AuthCache] Failed to clear specific queries:", error);
  }
}

export function isQueryClientAvailable(): boolean {
  return globalQueryClient !== null;
}

// ============================================================================
// Auth Redirect Utilities
// ============================================================================

/**
 * Simple auth redirect utility
 */
export function redirectToLoginIfNotAuth() {
  if (typeof window === 'undefined') return;
  
  const hasToken = document.cookie.includes('accessToken=');
  
  if (!hasToken) {
    window.location.href = '/login';
    return;
  }
  
  // For server-side validation, this would be handled by middleware
  // Client-side we rely on the auth state from useAuth hook
}

// ============================================================================
// Export for backward compatibility
// ============================================================================

export default {
  clearAuthCacheOnFail,
  clearDataQueries,
  redirectToLoginIfNotAuth,
};