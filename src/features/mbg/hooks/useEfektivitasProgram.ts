import { useQuery } from "@tanstack/react-query";
import {
  getEfektivitasProgram,
  type EfektivitasProgramData,
} from "@/features/mbg/api/services";
import {
  createQueryOptions,
  queryKeyFactories,
} from "@/lib/config/query-configs";

export function useEfektivitasProgram() {
  return useQuery<EfektivitasProgramData, Error>({
    queryKey: queryKeyFactories.financial.mbg.efektivitasProgram(),
    queryFn: getEfektivitasProgram,
    ...createQueryOptions<EfektivitasProgramData, Error>("financial"),
  });
}
