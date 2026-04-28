import { useQuery } from "@tanstack/react-query";
import { getKkpSankeyData } from "@/features/monev-kkp/api/services";
import { createQueryOptions } from "@/lib/config/query-configs";
import { monevKkpKeys } from "@/features/monev-kkp/api/queryKeys";
import type { SankeyFlowItem } from "@/features/monev-kkp/api/services";
import { useAuth } from "@/hooks/useAuth";

export function useKkpSankey(
  year: string = "2026",
  triwulan: string = "1",
  kdkanwil?: string,
  kdkppn?: string
) {
  const { user } = useAuth();

  const effectiveKanwil = kdkanwil !== undefined ? kdkanwil : user?.kdkanwil || "all";
  const effectiveKppn = kdkppn !== undefined ? kdkppn : user?.kdkppn || "all";

  return useQuery<SankeyFlowItem[], Error>({
    queryKey: monevKkpKeys.sankey(
      year,
      triwulan,
      user?.role,
      `${effectiveKanwil}-${effectiveKppn}`
    ),
    queryFn: () => getKkpSankeyData(year, triwulan, kdkanwil, kdkppn),
    ...createQueryOptions("dashboard", {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }),
  });
}
