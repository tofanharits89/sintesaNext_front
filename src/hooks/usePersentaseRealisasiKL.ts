import { useQuery } from "@tanstack/react-query";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";
import { backendPath } from "@/lib/backend";

interface PersentaseRealisasiKLItem {
  kode_ba: string;
  nama_ba: string;
  persentase: number; // 0..100
}

interface PersentaseRealisasiKLResponse {
  success: boolean;
  data: PersentaseRealisasiKLItem[];
  warning?: string;
}

interface UsePersentaseRealisasiKLOptions {
  kanwil?: string;
}

export function usePersentaseRealisasiKL(
  options: UsePersentaseRealisasiKLOptions = {}
) {
  const { kanwil } = options;
  const isClient = typeof window !== "undefined";

  return useQuery<PersentaseRealisasiKLItem[], Error>({
    queryKey: ["persentase-realisasi-kl", kanwil],
    queryFn: async () => {
      const token = getAuthTokenFromCookie();
      if (!token) {
        throw new Error("No authentication token found. Please log in to continue.");
      }

      const params = new URLSearchParams();
      if (kanwil) params.append("kanwil", kanwil);

      const url = backendPath(
        `/dashboard/persentase-realisasi-kl${params.toString() ? "?" + params.toString() : ""}`
      );

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: PersentaseRealisasiKLResponse = await response.json();
      if (!result.success) {
        throw new Error("Failed to fetch persentase realisasi K/L data");
      }

      return result.data;
    },
    enabled: isClient,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error.message?.includes("authentication") || error.message?.includes("401")) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

