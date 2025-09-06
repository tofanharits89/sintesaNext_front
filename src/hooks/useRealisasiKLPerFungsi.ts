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

interface RealisasiKLPerFungsiResponse {
  success: boolean;
  data: ChartData;
  warning?: string;
}

interface UseRealisasiKLPerFungsiOptions {
  kanwil?: string;
}

export function useRealisasiKLPerFungsi(
  options: UseRealisasiKLPerFungsiOptions = {}
) {
  const { kanwil } = options;
  const isClient = typeof window !== "undefined";

  return useQuery<ChartData, Error>({
    queryKey: ["realisasi-kl-per-fungsi", kanwil],
    queryFn: async () => {
      try {
        // Build URL with kanwil parameter if provided
        const params = new URLSearchParams();
        if (kanwil) {
          params.append("kanwil", kanwil);
        }

        const url = new URL(
          (process.env.NEXT_PUBLIC_BASE_PATH || "/v3/next") +
            `/api/dashboard/realisasi-kl-per-fungsi${
              params.toString() ? "?" + params.toString() : ""
            }`,
          window.location.origin
        );

        // Use same-origin Next API to forward httpOnly cookies
        const response = await fetch(url.toString(), {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: RealisasiKLPerFungsiResponse = await response.json();

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
