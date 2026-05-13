import { useQuery } from "@tanstack/react-query";
import { getRegencyRankings } from "@/features/mbg/api/services";
import { createQueryOptions, queryKeyFactories } from "@/lib/config/query-configs";
import type { ProvRankingsData } from "@/features/mbg/api/services";

export function useKabRankings(prov: string, year: string = "2026") {
  return useQuery<ProvRankingsData, Error>({
    queryKey: queryKeyFactories.financial.mbg.kabRankings(prov, year),
    queryFn: () => getRegencyRankings(prov, year),
    enabled: !!prov,
    ...createQueryOptions<ProvRankingsData, Error>("financial"),
  });
}
