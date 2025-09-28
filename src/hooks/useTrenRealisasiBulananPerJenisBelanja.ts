import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/base-path";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";
import { backendPath } from "@/lib/backend";

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
}

export function useTrenRealisasiBulananPerJenisBelanja(
  options: UseTrenRealisasiBulananPerJenisBelanjaOptions = {}
) {
  const { kanwil } = options;
  const isClient = typeof window !== "undefined";

  return useQuery<ChartData, Error>({
    queryKey: ["tren-realisasi-bulanan-per-jenis-belanja", kanwil],
    queryFn: async () => {
      try {
        // Build URL with kanwil parameter if provided
        const params = new URLSearchParams();
        if (kanwil) {
          params.append("kanwil", kanwil);
        }

        const url = new URL(
          apiPath(`/dashboard/tren-realisasi-bulanan-per-jenis-belanja${
            params.toString() ? "?" + params.toString() : ""
          }`),
          window.location.origin
        );

        // Use same-origin Next API to forward httpOnly cookies
        const response = await fetch(url.toString(), {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: TrenRealisasiBulananPerJenisBelanjaResponse =
          await response.json();

        if (!result.success) {
          throw new Error(
            "Failed to fetch tren realisasi bulanan per jenis belanja data"
          );
        }

        // Backend returns the correct chart format for line charts
        return result.data;
      } catch (error: any) {
        console.error(
          "Error fetching tren realisasi bulanan per jenis belanja:",
          error
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
