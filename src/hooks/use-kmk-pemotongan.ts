"use client";

import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/base-path";

export interface RawPemotonganItem {
  id: number | string;
  thang: number | string | null;
  nmbulan: string | null;
  no_kmk: string;
  kdkppn: string | null;
  bulan: number | null;
  kdakun: string | null;
  kdsatker: string | null;
  kdlokasi: string | null;
  kriteria: string | number | null;
  kdkabkota: string | null;
  nilai: number | null;
  nmpemda: string | null;
  nmkppn: string | null;
}

export interface PemotonganRow extends RawPemotonganItem {
  no: number;
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
  return result?.data ?? result;
};

export function useKmkPemotongan(no_kmk?: string, enabled: boolean = true) {
  const url =
    no_kmk && enabled
? apiPath(`/transfer-daerah/dau/kmk/pemotongan?no_kmk=${encodeURIComponent(no_kmk)}`)
      : null;

  const { data, error, isLoading, refetch } = useQuery<RawPemotonganItem[]>({
    queryKey: ["kmk-pemotongan", { no_kmk }],
    queryFn: () => fetcher(url!),
    enabled: !!url && enabled,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - financial data
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const rows: PemotonganRow[] = (data || []).map((r, idx) => ({
    ...r,
    no: idx + 1,
  }));

  const mutate = refetch; // For backward compatibility

  return { rows, isLoading, error, mutate } as const;
}
