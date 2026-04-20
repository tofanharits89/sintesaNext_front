import { useQuery } from "@tanstack/react-query";
import { getProvRankings } from "@/features/mbg/api/services";
import { createQueryOptions, queryKeyFactories } from "@/lib/config/query-configs";
import type { ProvRankingsData } from "@/features/mbg/api/services";

export function useProvRankings(year: string = "2026") {
  return useQuery<ProvRankingsData, Error>({
    queryKey: queryKeyFactories.financial.mbg.provRankings(year),
    queryFn: () => getProvRankings(year),
    ...createQueryOptions<ProvRankingsData, Error>("financial"),
  });
}
