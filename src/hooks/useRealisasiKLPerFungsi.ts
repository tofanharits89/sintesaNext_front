import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/config/base-path";

// Chart data format returned by the backend
interface ChartData {
  categories: string[];
  series: {
    name: string;
    data: number[];
  }[];
  raw?: any[];
}

interface RealisasiKLPerFungsiResponse {
  success: boolean;
  data: ChartData;
  warning?: string;
}

interface UseRealisasiKLPerFungsiOptions {
  kanwil?: string;
  year?: string;
  enabled?: boolean;
}

export function useRealisasiKLPerFungsi(
  options: UseRealisasiKLPerFungsiOptions = {},
) {
  const { kanwil, year, enabled } = options;
  const isClient = typeof window !== "undefined";

  return useQuery<ChartData, Error>({
    queryKey: ["realisasi-kl-per-fungsi", kanwil, year],
    queryFn: async () => {
      try {
        // Build query parameters
        const params = new URLSearchParams();
        if (kanwil) {
          params.append("kanwil", kanwil);
        }
        if (year) {
          params.append("year", year);
        }

        const endpoint = `/dashboard/realisasi-kl-per-fungsi${
          params.toString() ? "?" + params.toString() : ""
        }`;

        // Use http client which includes auth interceptors and refresh logic
        const { apiClient } = await import("@/lib/api/httpClient");
        const result: RealisasiKLPerFungsiResponse = await apiClient.get(
          endpoint,
        );

        if (!result.success) {
          throw new Error("Failed to fetch Realisasi K/L per Fungsi data");
        }

        return result.data;
      } catch (error: any) {
        console.error("Error fetching Realisasi K/L per Fungsi:", error);
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
    enabled: isClient && (enabled ?? true),
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
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
