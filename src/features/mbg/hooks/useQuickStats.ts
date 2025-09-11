import { useQuery } from "@tanstack/react-query";
import { mbgKeys } from "@/features/mbg/api/queryKeys";
import { getQuickStats } from "@/features/mbg/api/services";
import { createQueryOptions, queryKeyFactories } from "@/lib/query-configs";

export function useQuickStats() {
  return useQuery({
    queryKey: queryKeyFactories.financial.mbg.quickStats(),
    queryFn: getQuickStats,
    ...createQueryOptions('financial'),
    gcTime: 5 * 60_000,
  });
}
