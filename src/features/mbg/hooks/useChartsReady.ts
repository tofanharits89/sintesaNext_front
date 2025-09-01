import { useQuery } from "@tanstack/react-query";
import { mbgKeys } from "@/features/mbg/api/queryKeys";
import { getChartsReady } from "@/features/mbg/api/services";

export function useChartsReady() {
  return useQuery({
    queryKey: mbgKeys.chartsReady(),
    queryFn: getChartsReady,
    staleTime: 5_000,
    gcTime: 60_000,
  });
}
