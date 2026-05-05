import { useQuery } from "@tanstack/react-query";
import { getQuickStats } from "@/features/mbg/api/services";
import { createQueryOptions, queryKeyFactories } from "@/lib/config/query-configs";
import type { MbgQuickStatsResponse } from "@/features/mbg/api/services";

export function useQuickStats(year: string = "2026") {
  return useQuery<MbgQuickStatsResponse, Error>({
    queryKey: queryKeyFactories.financial.mbg.quickStats(year),
    queryFn: () => getQuickStats(year),
    ...createQueryOptions("financial"),
    gcTime: 5 * 60_000,
  });
}
