import { useQuery } from "@tanstack/react-query";
import {
  getMapChoropleth,
  type MbgProvChoroplethRow,
} from "@/features/mbg/api/services";
import {
  createQueryOptions,
  queryKeyFactories,
} from "@/lib/config/query-configs";

export function useMapChoropleth() {
  return useQuery<MbgProvChoroplethRow[], Error>({
    queryKey: queryKeyFactories.financial.mbg.mapChoropleth(),
    queryFn: getMapChoropleth,
    ...createQueryOptions<MbgProvChoroplethRow[], Error>("financial"),
  });
}
