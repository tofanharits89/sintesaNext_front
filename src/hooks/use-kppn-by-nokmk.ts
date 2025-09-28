"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backendPath } from "@/lib/backend";

export interface KppnItem {
  kdkppn: string;
  nmkppn: string;
  no_kmk: string;
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
  return (result?.data as KppnItem[]) ?? [];
};

export function useKppnByNoKmk(no_kmk?: string) {
  const enabled = Boolean(no_kmk);
  const url = no_kmk
    ? `${
        process.env.NEXT_PUBLIC_BASE_PATH || "/v3/next"
      }/api/transfer-daerah/dau/kmk/penundaan/kppn?no_kmk=${encodeURIComponent(
        no_kmk
      )}`
    : "";
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery<KppnItem[]>({
    queryKey: ["kppn-by-nokmk", no_kmk ?? null],
    queryFn: () => fetcher(url),
    enabled,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 0,
  });

  const options = (data || []).map((d) => ({
    value: d.kdkppn,
    label: `${d.kdkppn} - ${d.nmkppn}`,
  }));
  const mutate = () => queryClient.invalidateQueries({ queryKey: ["kppn-by-nokmk"] });
  return { items: data || [], options, isLoading, error, mutate } as const;
}
