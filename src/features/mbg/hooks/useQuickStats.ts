import { useQuery } from "@tanstack/react-query";
import { mbgKeys } from "@/features/mbg/api/queryKeys";
import { getQuickStats } from "@/features/mbg/api/services";
import { createQueryOptions, queryKeyFactories } from "@/lib/config/query-configs";
import type { QuickStatView } from "@/features/mbg/api/services";

export function useQuickStats() {
  return useQuery<QuickStatView[], Error>({
    queryKey: queryKeyFactories.financial.mbg.quickStats(),
    queryFn: getQuickStats,
    ...createQueryOptions('financial'),
    gcTime: 5 * 60_000,
  });
}
