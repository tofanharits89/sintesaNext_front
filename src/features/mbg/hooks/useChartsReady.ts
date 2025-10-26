import { useQuery } from "@tanstack/react-query";
import { getChartsReady } from "@/features/mbg/api/services";
import { createQueryOptions, queryKeyFactories } from "@/lib/config/query-configs";

export function useChartsReady() {
  return useQuery<boolean, Error>({
    queryKey: queryKeyFactories.financial.mbg.charts(),
    queryFn: getChartsReady,
    ...createQueryOptions<boolean, Error>('dashboard', {
      staleTime: 5_000, // Keep faster refresh for chart readiness
      gcTime: 60_000,
    }),
  });
}
