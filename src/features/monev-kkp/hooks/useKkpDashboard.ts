import { useQuery } from "@tanstack/react-query";
import { getKkpDashboardData } from "@/features/monev-kkp/api/services";
import { createQueryOptions } from "@/lib/config/query-configs";
import { monevKkpKeys } from "@/features/monev-kkp/api/queryKeys";
import type { KkpDashboardData } from "@/features/monev-kkp/api/services";

export function useKkpDashboard(year: string = "2026", triwulan: string = "1") {
  return useQuery<KkpDashboardData, Error>({
    queryKey: monevKkpKeys.dashboard(year, triwulan),
    queryFn: () => getKkpDashboardData(year, triwulan),
    ...createQueryOptions("financial"),
    gcTime: 5 * 60_000,
  });
}
