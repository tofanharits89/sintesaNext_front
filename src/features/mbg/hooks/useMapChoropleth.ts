import { useQuery } from "@tanstack/react-query";
import {
  getMapChoropleth,
  type MbgProvChoroplethRow,
} from "@/features/mbg/api/services";
import { createQueryOptions, queryKeyFactories } from "@/lib/config/query-configs";

export function useMapChoropleth(year: string = "2026") {
  return useQuery<MbgProvChoroplethRow[], Error>({
    queryKey: queryKeyFactories.financial.mbg.mapChoropleth(year),
    queryFn: () => getMapChoropleth(year),
    ...createQueryOptions<MbgProvChoroplethRow[], Error>("financial"),
  });
}
