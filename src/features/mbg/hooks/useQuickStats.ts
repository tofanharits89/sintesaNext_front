import { useQuery } from "@tanstack/react-query";
import { getQuickStats } from "@/features/mbg/api/services";
import { createQueryOptions, queryKeyFactories } from "@/lib/config/query-configs";
import type { QuickStatView } from "@/features/mbg/api/services";

export function useQuickStats(year: string = "2026") {
  return useQuery<QuickStatView[], Error>({
    queryKey: queryKeyFactories.financial.mbg.quickStats(year),
    queryFn: () => getQuickStats(year),
    ...createQueryOptions('financial'),
    gcTime: 5 * 60_000,
  });
}
