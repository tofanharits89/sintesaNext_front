import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/config/base-path";

// Data format for K/L dengan Pagu Program Terbesar
interface KLPaguProgramTerbesarItem {
  kode_program: string;
  nama_program: string;
  pagu_dipa: number;
  realisasi: number;
}

interface KLPaguProgramTerbesarResponse {
  success: boolean;
  data: KLPaguProgramTerbesarItem[];
  warning?: string;
}

interface UseRealisasiKLPaguProgramTerbesarOptions {
  kanwil?: string;
  enabled?: boolean;
}

export function useRealisasiKLPaguProgramTerbesar(
  options: UseRealisasiKLPaguProgramTerbesarOptions = {},
) {
  const { kanwil, enabled } = options;
  const isClient = typeof window !== "undefined";

  return useQuery<KLPaguProgramTerbesarItem[], Error>({
    queryKey: ["realisasi-kl-pagu-program-terbesar", kanwil],
    queryFn: async () => {
      try {
        // Build query parameters
        const params = new URLSearchParams();
        if (kanwil) {
          params.append("kanwil", kanwil);
        }

        const endpoint = `/dashboard/realisasi-kl-pagu-program-terbesar${
          params.toString() ? "?" + params.toString() : ""
        }`;

        // Use http client which includes auth interceptors and refresh logic
        const { apiClient } = await import("@/lib/api/httpClient");
        const result: KLPaguProgramTerbesarResponse = await apiClient.get(
          endpoint,
        );

        if (!result.success) {
          throw new Error("Failed to fetch K/L pagu program terbesar data");
        }

        return result.data;
      } catch (error: any) {
        console.error("Error fetching K/L pagu program terbesar:", error);
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
