"use client";

import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/config/base-path";

export interface KmkPencabutanRow {
  no_kmk: string;
  tgl_kmk: string | null;
  no_kmkcabut: string | null;
  tglcabut: string | null;
  nm_kriteria: string | null;
  nmjenis: string | null;
  kdkppn: string | null;
  kdpemda: string | null;
  nmkppn: string | null;
  nmpemda: string | null;
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
  if (!text.trim()) throw new Error("Empty response from server");
  const result = JSON.parse(text);
  return (result?.data as KmkPencabutanRow[]) ?? [];
};

export function useKmkPencabutan(no_kmk?: string) {
  const enabled = Boolean(no_kmk);
const url = no_kmk
    ? apiPath(`/transfer-daerah/dau/kmk/pencabutan?no_kmk=${encodeURIComponent(no_kmk)}`)
    : null;
  const { data, error, isLoading, refetch } = useQuery<KmkPencabutanRow[]>({
    queryKey: ["kmk-pencabutan", { no_kmk }],
    queryFn: () => fetcher(url!),
    enabled: !!url,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - financial data
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const mutate = refetch; // For backward compatibility

  return { rows: data || [], isLoading, error, mutate } as const;
}
