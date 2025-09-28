"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backendPath } from "@/lib/backend";

export interface KabKotaItem {
  kdkabkota: string; // kdpemda
  nmkabkota: string; // nmpemda
}

const fetcher = async (url: string) => {
  const resp = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
  });
  const text = await resp.text();
  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`;
    try {
      const j = JSON.parse(text);
      msg = j?.message || j?.error || msg;
    } catch {}
    throw new Error(msg);
  }
  if (!text.trim()) return [];
  const result = JSON.parse(text);
  return (result?.data as KabKotaItem[]) ?? [];
};

export function useKabKotaByNoKmk(_no_kmk?: string, kppn?: string) {
  const params = new URLSearchParams();
  if (kppn) params.set("kppn", kppn);
  const enabled = Boolean(kppn);
  const url = kppn
    ? `${
        process.env.NEXT_PUBLIC_BASE_PATH || "/v3/next"
      }/api/transfer-daerah/dau/kmk/penundaan/kabkota?${params.toString()}`
    : "";
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery<KabKotaItem[]>({
    queryKey: ["kabkota-by-nokmk", kppn ?? null],
    queryFn: () => fetcher(url),
    enabled,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 0,
  });

  const options = (data || []).map((d) => ({
    value: d.kdkabkota,
    label: `${d.kdkabkota} - ${d.nmkabkota}`,
  }));
  const mutate = () => queryClient.invalidateQueries({ queryKey: ["kabkota-by-nokmk"] });
  return { items: data || [], options, isLoading, error, mutate } as const;
}
