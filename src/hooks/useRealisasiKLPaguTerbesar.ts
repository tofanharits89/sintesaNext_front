import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/config/base-path";

// Data format for K/L dengan Pagu DIPA Terbesar
interface KLPaguTerbesarItem {
  kode_kementerian: string;
  nama_kementerian: string;
  pagu_dipa: number;
  realisasi: number;
}

interface KLPaguTerbesarResponse {
  success: boolean;
  data: KLPaguTerbesarItem[];
  warning?: string;
}

interface UseRealisasiKLPaguTerbesarOptions {
  kanwil?: string;
  year?: string;
  enabled?: boolean;
}

export function useRealisasiKLPaguTerbesar(
  options: UseRealisasiKLPaguTerbesarOptions = {},
) {
  const { kanwil, year, enabled } = options;
  const isClient = typeof window !== "undefined";

  return useQuery<KLPaguTerbesarItem[], Error>({
    queryKey: ["realisasi-kl-pagu-terbesar", kanwil, year],
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

        const endpoint = `/dashboard/realisasi-kl-pagu-terbesar${
          params.toString() ? "?" + params.toString() : ""
        }`;

        // Use http client which includes auth interceptors and refresh logic
        const { apiClient } = await import("@/lib/api/httpClient");
        const result: KLPaguTerbesarResponse = await apiClient.get(
          endpoint,
        );

        if (!result.success) {
          throw new Error("Failed to fetch K/L pagu terbesar data");
        }

        return result.data;
      } catch (error: any) {
        console.error("Error fetching K/L pagu terbesar:", error);
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
