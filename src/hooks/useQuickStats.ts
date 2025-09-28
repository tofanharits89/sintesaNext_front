import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiPath } from "@/lib/base-path";

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

type NotModifiedResponse = { success?: boolean; notModified: true; _meta?: DashboardMeta };
type ProxyResponse = QuickStatsResponse | NotModifiedResponse | null;
export type QSReturn = QuickStatsData & { _meta?: DashboardMeta };

export interface UseQuickStatsOptions {
  kanwil?: string;
}

export function useQuickStats(options: UseQuickStatsOptions = {}): UseQueryResult<QSReturn, Error> {
  const { kanwil } = options;
  const isClient = typeof window !== "undefined";
  const queryClient = useQueryClient();

  return useQuery<QSReturn, Error>({
    queryKey: ["quick-stats", kanwil],
    queryFn: async () => {
      try {
        // Build URL with same pattern as other dashboard endpoints
        const params = new URLSearchParams();
        if (kanwil) {
          params.append("kanwil", kanwil);
        }

        const url = new URL(
          apiPath(`/dashboard/quick-stats${
            params.toString() ? "?" + params.toString() : ""
          }`),
          window.location.origin
        );

        // Use same-origin Next API to forward httpOnly cookies; no Authorization header needed
        const response = await fetch(url.toString(), {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        // If server responded 304 (Not Modified), reuse existing cached data
        if (response.status === 304) {
          const prev = queryClient.getQueryData<QuickStatsData & { _meta?: DashboardMeta }>([
            "quick-stats",
            kanwil,
          ] as const);
          if (prev) return prev;
          // If no previous data, treat as error to trigger normal error flow
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse JSON payload if any
        let result: ProxyResponse = null;
        const rawText = await response.text();
        if (rawText) {
          try {
            result = JSON.parse(rawText) as ProxyResponse;
          } catch {
            result = null;
          }
        }

        // Our Next proxy may convert 304 into 200 with notModified flag. In that case, return cached data but update meta.
        if ((result as NotModifiedResponse | null)?.notModified) {
          const prev = queryClient.getQueryData<QSReturn>([
            "quick-stats",
            kanwil,
          ] as const);
          if (prev) {
            const meta = (result as NotModifiedResponse)._meta;
            return meta !== undefined ? { ...prev, _meta: meta } : { ...prev };
          }
          // If no previous data, fall through to error (no data to show)
          throw new Error("No cached data available for notModified response");
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!result || ("success" in result && !result.success)) {
          throw new Error("Failed to fetch quick stats data");
        }

        // Attach meta to the returned data for optional use in UI (last refresh time)
        const meta = (result as QuickStatsResponse)._meta;
        const base = (result as QuickStatsResponse).data;
        const dataWithMeta: QSReturn = meta !== undefined ? { ...base, _meta: meta } : { ...base };
        return dataWithMeta;
      } catch (error: any) {
        console.error("Error fetching quick stats:", error);
        // Handle 401 errors specifically
        if (
          error.message?.includes("401") ||
          error.message?.includes("status: 401")
        ) {
          throw new Error("Authentication failed. Please log in to continue.");
        }
        throw error;
      }
    },
    enabled: isClient,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours to match HTTP cache
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (
        error.message?.includes("authentication") ||
        error.message?.includes("401")
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });
}
