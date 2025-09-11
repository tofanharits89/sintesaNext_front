import { useQuery } from "@tanstack/react-query";
import { getMapStats } from "@/features/mbg/api/services";
import { createQueryOptions, queryKeyFactories } from "@/lib/query-configs";
import type { MapScope } from "@/features/mbg/types/domain";

export function useMapStats(scope: MapScope, id?: string) {
  return useQuery({
    queryKey: queryKeyFactories.financial.mbg.all().concat('mapStats', scope, id || 'all'),
    queryFn: () => getMapStats(scope, id),
    ...createQueryOptions('financial'),
  });
}
