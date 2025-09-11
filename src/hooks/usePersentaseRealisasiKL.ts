import { useQuery } from '@tanstack/react-query';
import { backendPath } from '@/lib/backend';

// Check if we're running on the client side
const isClient = typeof window !== 'undefined';

interface PersentaseRealisasiKL {
  kl_id: string;
  kl_nama: string;
  pagu: number;
  realisasi: number;
  persentase: number;
}

interface PersentaseRealisasiKLResponse {
  success: boolean;
  data: PersentaseRealisasiKL[];
  message?: string;
}

export function usePersentaseRealisasiKL() {
  return useQuery<PersentaseRealisasiKLResponse>({
    queryKey: ['persentase-realisasi-kl'],
    queryFn: async () => {
      const response = await fetch(backendPath('/dashboard/persentase-realisasi-kl'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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
