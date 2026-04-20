import { useQuery } from "@tanstack/react-query";
import { getMapStats } from "@/features/mbg/api/services";
import { createQueryOptions, queryKeyFactories } from "@/lib/config/query-configs";
import type { MapScope, MapStats } from "@/features/mbg/types/domain";

export function useMapStats(scope: MapScope, id?: string, provinceName?: string, year: string = "2026") {
  return useQuery<MapStats | null, Error>({
    queryKey: queryKeyFactories.financial.mbg.mapStats(scope, id, provinceName, year),
    queryFn: () => getMapStats(scope, id, provinceName, year),
    ...createQueryOptions<MapStats | null, Error>("financial"),
  });
}
