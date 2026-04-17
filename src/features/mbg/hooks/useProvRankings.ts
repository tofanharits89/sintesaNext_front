import { useQuery } from "@tanstack/react-query";
import {
  getProvRankings,
  type ProvRankingsData,
} from "@/features/mbg/api/services";
import {
  createQueryOptions,
  queryKeyFactories,
} from "@/lib/config/query-configs";

export function useProvRankings() {
  return useQuery<ProvRankingsData, Error>({
    queryKey: queryKeyFactories.financial.mbg.provRankings(),
    queryFn: getProvRankings,
    ...createQueryOptions<ProvRankingsData, Error>("financial"),
  });
}
