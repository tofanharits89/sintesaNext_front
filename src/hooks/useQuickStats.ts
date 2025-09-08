import { useQuery } from "@tanstack/react-query";
import { backendPath } from "@/lib/backend";

// Quick stats data format returned by the backend
interface QuickStatsData {
  jumlahDipa: number;
  paguApbn: number;
  paguDipa: number;
  realisasi: number;
  blokir: number;
  sisaPaguDipa: number;
}

interface DashboardMeta {
  asOfJakarta?: string | null;
  cacheExpiresAtUtc?: string | null;
  cacheMaxAgeSeconds?: number;
}

interface QuickStatsResponse {
  success: boolean;
  data: QuickStatsData;
  warning?: string;
  _meta?: DashboardMeta;
}

interface UseQuickStatsOptions {
  kanwil?: string;
}

export function useQuickStats(options: UseQuickStatsOptions = {}) {
  const { kanwil } = options;
  const isClient = typeof window !== "undefined";

  return useQuery<QuickStatsData, Error>({
    queryKey: ["quick-stats", kanwil],
    queryFn: async () => {
      try {
        // Build URL with same pattern as other dashboard endpoints
        const params = new URLSearchParams();
        if (kanwil) {
          params.append("kanwil", kanwil);
        }

        const url = new URL(
          (process.env.NEXT_PUBLIC_BASE_PATH || "/v3/next") +
            `/api/dashboard/quick-stats${
              params.toString() ? "?" + params.toString() : ""
            }`,
          window.location.origin
        );

        // Use same-origin Next API to forward httpOnly cookies; no Authorization header needed
        const response = await fetch(url.toString(), {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: QuickStatsResponse = await response.json();

        if (!result.success) {
          throw new Error("Failed to fetch quick stats data");
        }

        // Attach meta to the returned data for optional use in UI (last refresh time)
        const dataWithMeta: QuickStatsData & { _meta?: DashboardMeta } = {
          ...(result.data as QuickStatsData),
          _meta: result._meta,
        } as any;
        return dataWithMeta as any;
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
    staleTime: 5 * 60 * 1000, // 5 minutes
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
