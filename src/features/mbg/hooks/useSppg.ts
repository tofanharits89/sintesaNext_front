import { useQuery } from "@tanstack/react-query";
import {
  getSppgKanwil,
  getSppgData,
  type SppgKanwilData,
  type SppgDataResponse,
} from "@/features/mbg/api/services";
import { createQueryOptions } from "@/lib/config/query-configs";

export function useSppgKanwil(year: string = "2026", kdkanwil?: string) {
  return useQuery<SppgKanwilData, Error>({
    queryKey: ["mbg", "sppg", "kanwil", year, kdkanwil ?? "all"],
    queryFn: () => getSppgKanwil(year, kdkanwil),
    ...createQueryOptions<SppgKanwilData, Error>("financial"),
  });
}

export function useSppgData(kanwil: string[], year: string = "2026", kdkanwil?: string) {
  return useQuery<SppgDataResponse, Error>({
    queryKey: ["mbg", "sppg", "data", kanwil.join(","), year, kdkanwil ?? "all"],
    queryFn: () => getSppgData(kanwil, year, kdkanwil),
    enabled: kanwil.length > 0,
    ...createQueryOptions<SppgDataResponse, Error>("financial"),
  });
}
