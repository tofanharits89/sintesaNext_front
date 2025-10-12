import { useQuery } from '@tanstack/react-query';
import { apiPath } from '@/lib/base-path';

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
      // Use same-origin Next API proxy so httpOnly cookies (global auth) are forwarded
      const url = new URL(apiPath('/dashboard/persentase-realisasi-kl'), window.location.origin);
      if (params?.kanwil) url.searchParams.set('kanwil', params.kanwil);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
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
    enabled: isClient && (params?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
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
