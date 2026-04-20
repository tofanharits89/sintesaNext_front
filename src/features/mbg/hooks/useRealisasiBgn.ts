import { useQuery } from "@tanstack/react-query";
import {
  getRealisasiBgn,
  type RealisasiBgnData,
} from "@/features/mbg/api/services";
import {
  createQueryOptions,
  queryKeyFactories,
} from "@/lib/config/query-configs";

export function useRealisasiBgn() {
  return useQuery<RealisasiBgnData, Error>({
    queryKey: queryKeyFactories.financial.mbg.realisasiBgn(),
    queryFn: getRealisasiBgn,
    ...createQueryOptions<RealisasiBgnData, Error>("financial"),
  });
}
