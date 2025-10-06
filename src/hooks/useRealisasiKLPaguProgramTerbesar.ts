import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/base-path";
import { getAuthTokenFromCookie } from "@/lib/cookieManager";
import { backendPath } from "@/lib/backend";

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
}

export function useRealisasiKLPaguProgramTerbesar(
  options: UseRealisasiKLPaguProgramTerbesarOptions = {}
) {
  const { kanwil } = options;
  const isClient = typeof window !== "undefined";

  return useQuery<KLPaguProgramTerbesarItem[], Error>({
    queryKey: ["realisasi-kl-pagu-program-terbesar", kanwil],
    queryFn: async () => {
      try {
        // Build URL with kanwil parameter if provided
        const params = new URLSearchParams();
        if (kanwil) {
          params.append("kanwil", kanwil);
        }

        const url = new URL(
          apiPath(`/dashboard/realisasi-kl-pagu-program-terbesar${
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

        const result: KLPaguProgramTerbesarResponse = await response.json();

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
