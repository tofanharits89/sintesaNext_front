import { useQuery } from "@tanstack/react-query";
import { mbgKeys } from "@/features/mbg/api/queryKeys";
import { getChartsReady } from "@/features/mbg/api/services";
import { createQueryOptions, queryKeyFactories } from "@/lib/query-configs";

export function useChartsReady() {
  return useQuery({
    queryKey: queryKeyFactories.financial.mbg.charts(),
    queryFn: getChartsReady,
    ...createQueryOptions('dashboard', {
      staleTime: 5_000, // Keep faster refresh for chart readiness
      gcTime: 60_000,
    }),
  });
}
