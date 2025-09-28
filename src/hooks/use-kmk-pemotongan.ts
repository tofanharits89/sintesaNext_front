"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backendPath } from "@/lib/backend";

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
      ? `${
          process.env.NEXT_PUBLIC_BASE_PATH || "/v3/next"
        }/api/transfer-daerah/dau/kmk/pemotongan?no_kmk=${encodeURIComponent(
          no_kmk
        )}`
      : "";
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery<RawPemotonganItem[]>({
    queryKey: ["kmk-pemotongan", no_kmk ?? null, enabled],
    queryFn: () => fetcher(url),
    enabled: Boolean(no_kmk) && enabled,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 0,
  });

  const rows: PemotonganRow[] = (data || []).map((r, idx) => ({
    ...r,
    no: idx + 1,
  }));

  const mutate = () => queryClient.invalidateQueries({ queryKey: ["kmk-pemotongan"] });
  return { rows, isLoading, error, mutate } as const;
}
