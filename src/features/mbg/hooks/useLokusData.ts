import { useQuery } from "@tanstack/react-query";
import {
  getLokusData,
  type LokusDataResponse,
} from "@/features/mbg/api/services";
import {
  createQueryOptions,
  queryKeyFactories,
} from "@/lib/config/query-configs";

export function useLokusData(prov: string[], tahun: string, kdkanwil?: string) {
  return useQuery<LokusDataResponse, Error>({
    queryKey: queryKeyFactories.financial.mbg.lokusData(prov, tahun, kdkanwil),
    queryFn: () => getLokusData(prov, tahun, kdkanwil),
    enabled: prov.length > 0,
    ...createQueryOptions<LokusDataResponse, Error>("financial"),
  });
}
