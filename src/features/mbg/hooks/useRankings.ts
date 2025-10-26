import { useQuery } from "@tanstack/react-query";
import { getRankings } from "@/features/mbg/api/services";
import { createQueryOptions, queryKeyFactories } from "@/lib/config/query-configs";
import type { RankingsData } from "@/features/mbg/api/services";

export function useRankings() {
  return useQuery<RankingsData, Error>({
    queryKey: queryKeyFactories.financial.mbg.rankings(),
    queryFn: getRankings,
    ...createQueryOptions('financial'),
    gcTime: 5 * 60_000,
  });
}
