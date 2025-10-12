import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { apiClient } from "@/lib/httpClient";

// Quick stats data format returned by the backend
export interface QuickStatsData {
  jumlahDipa: number;
  paguApbn: number;
  paguDipa: number;
  realisasi: number;
  blokir: number;
  sisaPaguDipa: number;
}

export interface DashboardMeta {
  asOfJakarta?: string | null;
  cacheExpiresAtUtc?: string | null;
  cacheMaxAgeSeconds?: number;
}

export interface QuickStatsResponse {
  success: boolean;
  data: QuickStatsData;
  warning?: string;
  _meta?: DashboardMeta;
}

export type QSReturn = QuickStatsData & { _meta?: DashboardMeta };

export interface UseQuickStatsOptions {
  kanwil?: string;
  enabled?: boolean;
}

export function useQuickStats(options: UseQuickStatsOptions = {}): UseQueryResult<QSReturn, Error> {
  const { kanwil, enabled } = options;
  const isClient = typeof window !== "undefined";

  return useQuery<QSReturn, Error>({
    queryKey: ["quick-stats", kanwil],
    queryFn: async () => {
      try {
        // Build URL with same pattern as other dashboard endpoints
        const params = new URLSearchParams();
        if (kanwil) {
          params.append("kanwil", kanwil);
        }

        const endpoint = `/dashboard/quick-stats${
          params.toString() ? "?" + params.toString() : ""
        }`;

        // Use global HTTP client with automatic authentication handling
        const result = await apiClient.get<QuickStatsResponse>(endpoint);

        if (!result.success) {
          throw new Error("Failed to fetch quick stats data");
        }

        // Attach meta to the returned data for optional use in UI (last refresh time)
        const meta = result._meta;
        const base = result.data;
        const dataWithMeta: QSReturn = meta !== undefined ? { ...base, _meta: meta } : { ...base };
        return dataWithMeta;
      } catch (error: any) {
        console.error("Error fetching quick stats:", error);
        // Let the global HTTP client handle authentication errors automatically
        // Just re-throw the error for TanStack Query to handle
        throw error;
      }
    },
    enabled: isClient && (enabled ?? true),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours to match backend cache
    retry: (failureCount, error) => {
      // Let the global HTTP client handle authentication retries
      // Only retry for general network issues
      if (error.message?.includes("Network Error") || error.message?.includes("fetch")) {
        return failureCount < 2;
      }
      return false; // Don't retry other errors
    },
  });
}
