import { useQuery } from "@tanstack/react-query";
import { getMapStats } from "@/features/mbg/api/services";
import { createQueryOptions, queryKeyFactories } from "@/lib/query-configs";
import type { MapScope, MapStats } from "@/features/mbg/types/domain";

export function useMapStats(scope: MapScope, id?: string) {
  return useQuery<MapStats, Error>({
    queryKey: queryKeyFactories.financial.mbg.mapStats(scope, id),
    queryFn: () => getMapStats(scope, id),
    ...createQueryOptions<MapStats, Error>('financial'),
  });
}
