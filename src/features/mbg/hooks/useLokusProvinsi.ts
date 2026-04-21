import { useQuery } from "@tanstack/react-query";
import {
  getLokusProvinsi,
  type LokusProvinsiData,
} from "@/features/mbg/api/services";
import {
  createQueryOptions,
  queryKeyFactories,
} from "@/lib/config/query-configs";

export function useLokusProvinsi(kdkanwil?: string) {
  return useQuery<LokusProvinsiData, Error>({
    queryKey: queryKeyFactories.financial.mbg.lokusProvinsi(kdkanwil),
    queryFn: () => getLokusProvinsi(kdkanwil),
    ...createQueryOptions<LokusProvinsiData, Error>("financial"),
  });
}
