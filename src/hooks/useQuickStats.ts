import { useQuery } from "@tanstack/react-query";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";
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

interface QuickStatsResponse {
  success: boolean;
  data: QuickStatsData;
  warning?: string;
}

interface UseQuickStatsOptions {
  kanwil?: string;
}

export function useQuickStats(
  options: UseQuickStatsOptions = {}
) {
  const { kanwil } = options;
  const isClient = typeof window !== "undefined";

  return useQuery<QuickStatsData, Error>({
    queryKey: ["quick-stats", kanwil],
    queryFn: async () => {
      // Check for authentication token using the same method as other hooks
      const token = getAuthTokenFromCookie();
      if (!token) {
        throw new Error(
          "No authentication token found. Please log in to continue."
        );
      }

      try {
        // Build URL with same pattern as other dashboard endpoints
        const params = new URLSearchParams();
        if (kanwil) {
          params.append("kanwil", kanwil);
        }

        const url = backendPath(
          `/dashboard/quick-stats${
            params.toString() ? "?" + params.toString() : ""
          }`
        );

        // Use direct fetch with same headers as other hooks
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: QuickStatsResponse = await response.json();

        if (!result.success) {
          throw new Error("Failed to fetch quick stats data");
        }

        // Backend returns the correct format, no transformation needed
        return result.data;
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