import { useQuery } from "@tanstack/react-query";
import { getPenerimaByRegency } from "@/features/mbg/api/services";
import { createQueryOptions, queryKeyFactories } from "@/lib/config/query-configs";
import type { RankedItem } from "@/features/mbg/api/services";

export type KabRankingsData = {
  penerima: RankedItem[];
};

async function fetchKabRankings(prov: string, year: string): Promise<KabRankingsData> {
  const rows = await getPenerimaByRegency(prov, year);

  const total = rows.reduce((sum, r) => sum + r.penerimakab, 0);

  const penerima: RankedItem[] = rows
    .map((r) => ({
      name: r.kabkota,
      value: r.penerimakab,
      percentage: total > 0 ? parseFloat(((r.penerimakab / total) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return { penerima };
}

export function useKabRankings(prov: string, year: string = "2026") {
  return useQuery<KabRankingsData, Error>({
    queryKey: queryKeyFactories.financial.mbg.kabRankings(prov, year),
    queryFn: () => fetchKabRankings(prov, year),
    enabled: !!prov,
    ...createQueryOptions<KabRankingsData, Error>("financial"),
  });
}
