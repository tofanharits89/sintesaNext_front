import { useQuery } from "@tanstack/react-query";
import { getMapStats } from "@/features/mbg/api/services";
import { createQueryOptions, queryKeyFactories } from "@/lib/config/query-configs";
import type { MapScope, MapStats } from "@/features/mbg/types/domain";

export function useMapStats(scope: MapScope, id?: string, provinceName?: string) {
  return useQuery<MapStats | null, Error>({
    queryKey: queryKeyFactories.financial.mbg.mapStats(scope, id, provinceName),
    queryFn: () => getMapStats(scope, id, provinceName),
    ...createQueryOptions<MapStats | null, Error>("financial"),
  });
}
