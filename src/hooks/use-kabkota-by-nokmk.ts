"use client";

import useSWR from "swr";
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
  const key = kppn
    ? `${
        process.env.NEXT_PUBLIC_BASE_PATH || "/v3/next"
      }/api/transfer-daerah/dau/kmk/penundaan/kabkota?${params.toString()}`
    : null;
  const { data, error, isLoading, mutate } = useSWR<KabKotaItem[]>(
    key,
    fetcher,
    { revalidateOnFocus: false }
  );

  const options = (data || []).map((d) => ({
    value: d.kdkabkota,
    label: `${d.kdkabkota} - ${d.nmkabkota}`,
  }));
  return { items: data || [], options, isLoading, error, mutate } as const;
}
