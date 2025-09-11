import { useQuery } from "@tanstack/react-query";
import { getRankings } from "@/features/mbg/api/services";
import { createQueryOptions, queryKeyFactories } from "@/lib/query-configs";

export function useRankings() {
  return useQuery({
    queryKey: queryKeyFactories.financial.mbg.all().concat('rankings'),
    queryFn: getRankings,
    ...createQueryOptions('financial'),
    gcTime: 5 * 60_000,
  });
}
