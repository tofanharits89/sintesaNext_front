import { useQuery } from "@tanstack/react-query";
import { mbgKeys } from "@/features/mbg/api/queryKeys";
import { getMapStats } from "@/features/mbg/api/services";
import type { MapScope } from "@/features/mbg/types/domain";

export function useMapStats(scope: MapScope, id?: string) {
  return useQuery({
    queryKey: mbgKeys.mapStats(scope, id),
    queryFn: () => getMapStats(scope, id),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
