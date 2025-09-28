"use client";

import { useQuery } from "@tanstack/react-query";
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
    : null;
  const { data, error, isLoading, refetch } = useQuery<KabKotaItem[]>({
    queryKey: ["kabkota-lookup", { kppn }],
    queryFn: () => fetcher(key!),
    enabled: !!key,
    refetchOnWindowFocus: false,
    staleTime: 15 * 60 * 1000, // 15 minutes - lookup data
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const options = (data || []).map((d) => ({
    value: d.kdkabkota,
    label: `${d.kdkabkota} - ${d.nmkabkota}`,
  }));

  const mutate = refetch; // For backward compatibility

  return { items: data || [], options, isLoading, error, mutate } as const;
}
