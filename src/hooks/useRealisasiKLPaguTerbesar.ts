import { useQuery } from "@tanstack/react-query";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";
import { backendPath } from "@/lib/backend";

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
}

export function useRealisasiKLPaguTerbesar(
  options: UseRealisasiKLPaguTerbesarOptions = {}
) {
  const { kanwil } = options;
  const isClient = typeof window !== "undefined";

  return useQuery<KLPaguTerbesarItem[], Error>({
    queryKey: ["realisasi-kl-pagu-terbesar", kanwil],
    queryFn: async () => {
      // Check for authentication token
      const token = getAuthTokenFromCookie();
      if (!token) {
        throw new Error(
          "No authentication token found. Please log in to continue."
        );
      }

      try {
        // Build URL with kanwil parameter if provided
        const params = new URLSearchParams();
        if (kanwil) {
          params.append("kanwil", kanwil);
        }

        const url = backendPath(
          `/dashboard/realisasi-kl-pagu-terbesar${
            params.toString() ? "?" + params.toString() : ""
          }`
        );

        // Fetch data from backend
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: KLPaguTerbesarResponse = await response.json();

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