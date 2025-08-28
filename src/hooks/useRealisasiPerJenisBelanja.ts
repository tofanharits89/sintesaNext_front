import { useQuery } from "@tanstack/react-query";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";
import { backendPath } from "@/lib/backend";

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
}

export function useRealisasiPerJenisBelanja(
  options: UseRealisasiPerJenisBelanjaOptions = {}
) {
  const { kanwil } = options;
  const isClient = typeof window !== "undefined";

  return useQuery<ChartData, Error>({
    queryKey: ["realisasi-per-jenis-belanja", kanwil],
    queryFn: async () => {
      // Check for authentication token using the same method as quick stats
      const token = getAuthTokenFromCookie();
      if (!token) {
        throw new Error(
          "No authentication token found. Please log in to continue."
        );
      }

      try {
        // Build URL with same pattern as quick stats
        const params = new URLSearchParams();
        if (kanwil) {
          params.append("kanwil", kanwil);
        }

        const url = backendPath(
          `/dashboard/realisasi-per-jenis-belanja${
            params.toString() ? "?" + params.toString() : ""
          }`
        );

        // Use direct fetch with same headers as quick stats
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: RealisasiPerJenisBelanjaResponse = await response.json();

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
