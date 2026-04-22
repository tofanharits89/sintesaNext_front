import { useQuery } from "@tanstack/react-query";
import {
  getSppgKanwil,
  getSppgData,
  type SppgKanwilData,
  type SppgDataResponse,
} from "@/features/mbg/api/services";
import { createQueryOptions } from "@/lib/config/query-configs";

export function useSppgKanwil(kdkanwil?: string) {
  return useQuery<SppgKanwilData, Error>({
    queryKey: ["mbg", "sppg", "kanwil", kdkanwil ?? "all"],
    queryFn: () => getSppgKanwil(kdkanwil),
    ...createQueryOptions<SppgKanwilData, Error>("financial"),
  });
}

export function useSppgData(kanwil: string[], kdkanwil?: string) {
  return useQuery<SppgDataResponse, Error>({
    queryKey: ["mbg", "sppg", "data", kanwil.join(","), kdkanwil ?? "all"],
    queryFn: () => getSppgData(kanwil, kdkanwil),
    enabled: kanwil.length > 0,
    ...createQueryOptions<SppgDataResponse, Error>("financial"),
  });
}
