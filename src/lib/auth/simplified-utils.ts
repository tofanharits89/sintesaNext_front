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

export function getGlobalQueryClient(): QueryClient | null {
  return globalQueryClient;
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

// ============================================================================
// Server-Safe Cache Utilities (for utils-server.ts)
// ============================================================================

/**
 * Simple in-memory cache for server-side auth operations
 */
const serverCache = new Map<string, any>();

export function getAuthCache(key: string): any {
  return serverCache.get(key);
}

export function setAuthCache(key: string, value: any): void {
  serverCache.set(key, value);
}

export function invalidateAuthCache(key?: string): void {
  if (key) {
    serverCache.delete(key);
  } else {
    serverCache.clear();
  }
}

export function hashKey(key: string): string {
  return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
}

export interface AuthCacheEntry {
  data: any;
  timestamp: number;
  ttl?: number;
}
