import { useQuery } from '@tanstack/react-query';

// Check if we're running on the client side
const isClient = typeof window !== 'undefined';

interface PersentaseRealisasiKL {
  kode_ba: string;
  nama_ba: string;
  persentase: number;
}

interface PersentaseRealisasiKLResponse {
  success: boolean;
  data: PersentaseRealisasiKL[];
  message?: string;
}

// Allow optional filtering by kanwil (to match usage in dashboard page)
export function usePersentaseRealisasiKL(params?: { kanwil?: string; enabled?: boolean }) {
  return useQuery<PersentaseRealisasiKL[]>({
    queryKey: ['persentase-realisasi-kl', params?.kanwil],
    queryFn: async () => {
      try {
        // Build query parameters
        const urlParams = new URLSearchParams();
        if (params?.kanwil) {
          urlParams.append('kanwil', params.kanwil);
        }

        const endpoint = `/dashboard/persentase-realisasi-kl${
          urlParams.toString() ? '?' + urlParams.toString() : ''
        }`;

        // Use http client which includes auth interceptors and refresh logic
        const { apiClient } = await import('@/lib/api/httpClient');
        const result: PersentaseRealisasiKLResponse = await apiClient.get(endpoint);

        if (!result.success) {
          throw new Error("Failed to fetch persentase realisasi K/L data");
        }

        return result.data;
      } catch (error: any) {
        console.error("Error fetching persentase realisasi K/L:", error);
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
    enabled: isClient && (params?.enabled ?? true),
    staleTime: 12 * 60 * 60 * 1000,
    retry: (failureCount, error) => {
      if (
        (error as any).message?.includes("authentication") ||
        (error as any).message?.includes("401")
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });
}
