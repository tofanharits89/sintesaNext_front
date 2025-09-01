import { useQuery } from "@tanstack/react-query";
import { mbgKeys } from "@/features/mbg/api/queryKeys";
import { getRankings } from "@/features/mbg/api/services";

export function useRankings() {
  return useQuery({
    queryKey: mbgKeys.rankings(),
    queryFn: getRankings,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
