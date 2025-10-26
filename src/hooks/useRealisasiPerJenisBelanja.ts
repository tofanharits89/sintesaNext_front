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

interface RealisasiPerJenisBelanjaResponse {
  success: boolean;
  data: ChartData;
  warning?: string;
}

interface UseRealisasiPerJenisBelanjaOptions {
  kanwil?: string;
  enabled?: boolean;
}

export function useRealisasiPerJenisBelanja(
  options: UseRealisasiPerJenisBelanjaOptions = {},
) {
  const { kanwil, enabled } = options;
  const isClient = typeof window !== "undefined";

  return useQuery<ChartData, Error>({
    queryKey: ["realisasi-per-jenis-belanja", kanwil],
    queryFn: async () => {
      try {
        // Build query parameters
        const params = new URLSearchParams();
        if (kanwil) {
          params.append("kanwil", kanwil);
        }

        const endpoint = `/dashboard/realisasi-per-jenis-belanja${
          params.toString() ? "?" + params.toString() : ""
        }`;

        // Use http client which includes auth interceptors and refresh logic
        const { apiClient } = await import("@/lib/api/httpClient");
        const result: RealisasiPerJenisBelanjaResponse = await apiClient.get(
          endpoint,
        );

        if (!result.success) {
          throw new Error("Failed to fetch realisasi per jenis belanja data");
        }

        // Backend already returns the correct chart format, no transformation needed
        return result.data;
      } catch (error: any) {
        console.error("Error fetching realisasi per jenis belanja:", error);
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
