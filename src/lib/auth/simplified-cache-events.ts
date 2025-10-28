/**
 * Simplified Cache Events
 * Bridges legacy helpers onto the unified auth cache utilities.
 */

import {
  getGlobalQueryClient,
  setGlobalQueryClient as setGlobalQueryClientUtil,
  clearAuthCacheOnFail as clearAuthCacheOnFailUtil,
  clearDataQueries as clearDataQueriesUtil,
} from "./simplified-utils";

// Re-export the canonical helpers so older imports keep working.
export const setGlobalQueryClient = setGlobalQueryClientUtil;
export const clearAuthCacheOnFail = clearAuthCacheOnFailUtil;
export const clearDataQueries = clearDataQueriesUtil;

export function isQueryClientAvailable(): boolean {
  return getGlobalQueryClient() !== null;
}

export function clearAllCaches() {
  const queryClient = getGlobalQueryClient();
  if (queryClient) {
    queryClient.clear();
  }

  if (typeof window !== "undefined") {
    localStorage.clear();
    sessionStorage.clear();
  }

  console.log("[Cache] All caches cleared");
}

export function clearAuthCaches() {
  const queryClient = getGlobalQueryClient();
  if (queryClient) {
    queryClient.invalidateQueries({ queryKey: ["auth"] });
    queryClient.invalidateQueries({ queryKey: ["user"] });
    queryClient.removeQueries({ queryKey: ["auth", "user"] });
  }

  console.log("[Cache] Auth caches cleared");
}

export function clearDataCaches() {
  const queryClient = getGlobalQueryClient();
  if (!queryClient) {
    console.log("[Cache] No query client available for data cache clearing");
    return;
  }

  const dataQueryKeys = [
    "realisasi-per-jenis-belanja",
    "realisasi-kl-per-fungsi",
    "quick-stats",
    "realisasi-kl-pagu-terbesar",
    "realisasi-kl-pagu-program-terbesar",
    "tren-realisasi-bulanan",
    "persentase-realisasi-kl",
    "satker",
    "dashboard",
  ];

  dataQueryKeys.forEach((key) => {
    queryClient.removeQueries({ queryKey: [key] });
  });

  console.log("[Cache] Data caches cleared");
}
