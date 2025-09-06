"use client";

import useSWR from "swr";
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
  const key = no_kmk
    ? `${
        process.env.NEXT_PUBLIC_BASE_PATH || "/v3/next"
      }/api/transfer-daerah/dau/kmk/penundaan/kppn?no_kmk=${encodeURIComponent(
        no_kmk
      )}`
    : null;
  const { data, error, isLoading, mutate } = useSWR<KppnItem[]>(key, fetcher, {
    revalidateOnFocus: false,
  });

  const options = (data || []).map((d) => ({
    value: d.kdkppn,
    label: `${d.kdkppn} - ${d.nmkppn}`,
  }));
  return { items: data || [], options, isLoading, error, mutate } as const;
}
