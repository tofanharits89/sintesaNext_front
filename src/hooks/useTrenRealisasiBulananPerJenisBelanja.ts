import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/config/base-path";

// Chart data format for monthly trend by expense type
interface ChartData {
  categories: string[]; // Monthly labels (Jan, Feb, Mar, etc.)
  series: {
    name: string; // Expense type name (51-Pegawai, 52-Barang, etc.)
    data: number[]; // Monthly values
  }[];
  raw?: any[];
}

interface TrenRealisasiBulananPerJenisBelanjaResponse {
  success: boolean;
  data: ChartData;
  warning?: string;
}

interface UseTrenRealisasiBulananPerJenisBelanjaOptions {
  kanwil?: string;
  year?: string;
  enabled?: boolean;
}

export function useTrenRealisasiBulananPerJenisBelanja(
  options: UseTrenRealisasiBulananPerJenisBelanjaOptions = {},
) {
  const { kanwil, year, enabled } = options;
  const isClient = typeof window !== "undefined";

  return useQuery<ChartData, Error>({
    queryKey: ["tren-realisasi-bulanan-per-jenis-belanja", kanwil, year],
    queryFn: async () => {
      try {
        // Build query parameters if provided
        const params = new URLSearchParams();
        if (kanwil) {
          params.append("kanwil", kanwil);
        }
        if (year) {
          params.append("year", year);
        }

        const endpoint = `/dashboard/tren-realisasi-bulanan-per-jenis-belanja${
          params.toString() ? "?" + params.toString() : ""
        }`;

        // Use http client which includes auth interceptors and refresh logic
        const { apiClient } = await import("@/lib/api/httpClient");
        const result: TrenRealisasiBulananPerJenisBelanjaResponse =
          await apiClient.get(endpoint);

        if (!result.success) {
          throw new Error(
            "Failed to fetch tren realisasi bulanan per jenis belanja data",
          );
        }

        // Backend returns the correct chart format for line charts
        return result.data;
      } catch (error: any) {
        console.error(
          "Error fetching tren realisasi bulanan per jenis belanja:",
          error,
        );
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
