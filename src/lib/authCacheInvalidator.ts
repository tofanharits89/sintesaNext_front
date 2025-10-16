/**
 * Global Auth Cache Invalidator
 * 
 * Clears React Query cache when authentication fails.
 * This prevents stale error states from blocking new auth attempts.
 * 
 * Solves: After server crash with old cached auth, React Query retains 401 errors
 * which blocks subsequent API calls from retrying even after successful login.
 */

import { useQueryClient } from "@tanstack/react-query";

// Store queryClient reference globally so we can clear cache from interceptors
let globalQueryClient: ReturnType<typeof useQueryClient> | null = null;

export function setGlobalQueryClient(qc: ReturnType<typeof useQueryClient>) {
  globalQueryClient = qc;
}

/**
 * Clear all React Query cache when authentication fails
 * This ensures that stale 401 error states don't persist across login attempts
 */
export function clearAuthCacheOnFail() {
  if (!globalQueryClient) {
    console.warn("[AuthCache] No queryClient available for cache clearing");
    return;
  }

  try {
    // Clear all queries to force fresh API calls after re-auth
    globalQueryClient.clear();
    console.log("[AuthCache] ✅ All React Query cache cleared due to auth failure");
  } catch (error) {
    console.error("[AuthCache] Failed to clear cache:", error);
  }
}

/**
 * Clear specific data-related queries
 * Useful when we know certain queries are auth-dependent
 */
export function clearDataQueries() {
  if (!globalQueryClient) return;

  try {
    // List of query keys that are auth-dependent and should be cleared
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
      globalQueryClient.removeQueries({
        queryKey: [key],
      });
    }

    console.log("[AuthCache] ✅ Auth-dependent queries cleared");
  } catch (error) {
    console.error("[AuthCache] Failed to clear specific queries:", error);
  }
}

/**
 * Check if queryClient is available
 */
export function isQueryClientAvailable(): boolean {
  return globalQueryClient !== null;
}
