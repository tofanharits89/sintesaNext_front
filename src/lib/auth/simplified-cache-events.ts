/**
 * Simplified Cache Events
 * Basic cache management without complex event coordination
 */

import { QueryClient } from "@tanstack/react-query";

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
// Simplified Cache Management
// ============================================================================

export function clearAllCaches() {
  if (globalQueryClient) {
    globalQueryClient.clear();
  }
  
  if (typeof window !== 'undefined') {
    localStorage.clear();
    sessionStorage.clear();
  }
  
  console.log("[Cache] All caches cleared");
}

export function clearAuthCaches() {
  if (globalQueryClient) {
    globalQueryClient.invalidateQueries({ queryKey: ['auth'] });
    globalQueryClient.invalidateQueries({ queryKey: ['user'] });
    globalQueryClient.removeQueries({ queryKey: ['auth', 'user'] });
  }
  
  console.log("[Cache] Auth caches cleared");
}

export function clearDataCaches() {
  if (globalQueryClient) {
    const dataQueryKeys = [
      'realisasi-per-jenis-belanja',
      'realisasi-kl-per-fungsi',
      'quick-stats',
      'realisasi-kl-pagu-terbesar',
      'realisasi-kl-pagu-program-terbesar',
      'tren-realisasi-bulanan',
      'persentase-realisasi-kl',
      'satker',
      'dashboard',
    ];

    dataQueryKeys.forEach(key => {
      globalQueryClient?.removeQueries({ queryKey: [key] });
    });
  }
  
  console.log("[Cache] Data caches cleared");
}

// ============================================================================
// Export for backward compatibility
// ============================================================================

// Create cacheEvents object for backward compatibility
export const cacheEvents = {
  invalidateAuth: clearAuthCaches,
  invalidateData: clearDataCaches,
  clearAllCaches,
  clearAuthCaches,
  clearDataCaches,
  onLogin: clearDataQueries, // Simplified login event
  onSessionExpired: clearAuthCaches, // Simplified session expiry
  onTokenRefresh: clearDataCaches, // Simplified token refresh
};

// Export clearUserCaches for backward compatibility
export function clearUserCaches() {
  // Simplified user cache clearing
  if (globalQueryClient) {
    globalQueryClient.invalidateQueries({ queryKey: ['user'] });
    globalQueryClient.removeQueries({ queryKey: ['user'] });
  }
  
  console.log("[Cache] User caches cleared");
}

export default {
  clearAllCaches,
  clearAuthCaches,
  clearDataCaches,
  clearUserCaches,
};
