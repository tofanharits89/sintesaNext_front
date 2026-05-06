import { useQuery } from "@tanstack/react-query";
import { getKkpDashboardData } from "@/features/monev-kkp/api/services";
import { createQueryOptions } from "@/lib/config/query-configs";
import { monevKkpKeys } from "@/features/monev-kkp/api/queryKeys";
import type { KkpDashboardData } from "@/features/monev-kkp/api/services";
import { useAuth } from "@/hooks/useAuth";

export function useKkpDashboard(
  year: string = "2026", 
  triwulan: string = "1",
  kdkanwil?: string,
  kdkppn?: string
) {
  const { user } = useAuth();
  
  // Use explicit parameters if provided, otherwise default to user's unit for the key
  const effectiveKanwil = kdkanwil !== undefined ? kdkanwil : user?.kdkanwil || "all";
  const effectiveKppn = kdkppn !== undefined ? kdkppn : user?.kdkppn || "all";

  return useQuery<KkpDashboardData, Error>({
    queryKey: monevKkpKeys.dashboard(
      year, 
      triwulan, 
      user?.role, 
      `${effectiveKanwil}-${effectiveKppn}`
    ),
    queryFn: () => getKkpDashboardData(
      year, 
      triwulan, 
      effectiveKanwil !== "all" ? effectiveKanwil : undefined, 
      effectiveKppn !== "all" ? effectiveKppn : undefined
    ),
    ...createQueryOptions("dashboard", {
      staleTime: 12 * 60 * 60 * 1000, // 12 hours
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
    }),
  });
}
