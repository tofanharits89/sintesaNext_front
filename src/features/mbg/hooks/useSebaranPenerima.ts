import { useQuery } from "@tanstack/react-query";
import {
  getSebaranPenerima,
  type SebaranPenerimaData,
} from "@/features/mbg/api/services";
import {
  createQueryOptions,
  queryKeyFactories,
} from "@/lib/config/query-configs";

export function useSebaranPenerima() {
  return useQuery<SebaranPenerimaData, Error>({
    queryKey: queryKeyFactories.financial.mbg.sebaranPenerima(),
    queryFn: getSebaranPenerima,
    ...createQueryOptions<SebaranPenerimaData, Error>("financial"),
  });
}
