import { useQuery } from "@tanstack/react-query";
import { getRankings } from "@/features/mbg/api/services";
import { createQueryOptions, queryKeyFactories } from "@/lib/config/query-configs";
import type { RankingsData } from "@/features/mbg/api/services";

export function useRankings(year?: string) {
  return useQuery<RankingsData, Error>({
    queryKey: queryKeyFactories.financial.mbg.rankings(year),
    queryFn: () => getRankings(year),
    ...createQueryOptions('financial'),
    gcTime: 5 * 60_000,
  });
}
