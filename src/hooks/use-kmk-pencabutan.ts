"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backendPath } from "@/lib/backend";

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
    ? `${
        process.env.NEXT_PUBLIC_BASE_PATH || "/v3/next"
      }/api/transfer-daerah/dau/kmk/pencabutan?no_kmk=${encodeURIComponent(
        no_kmk
      )}`
    : "";
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery<KmkPencabutanRow[]>({
    queryKey: ["kmk-pencabutan", no_kmk ?? null],
    queryFn: () => fetcher(url),
    enabled,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 0,
  });
  const mutate = () => queryClient.invalidateQueries({ queryKey: ["kmk-pencabutan"] });
  return { rows: data || [], isLoading, error, mutate } as const;
}
