import { useQuery } from "@tanstack/react-query";
import { mbgKeys } from "@/features/mbg/api/queryKeys";
import { getQuickStats } from "@/features/mbg/api/services";

export function useQuickStats() {
  return useQuery({
    queryKey: mbgKeys.quickStats(),
    queryFn: getQuickStats,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
