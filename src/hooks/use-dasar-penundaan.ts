"use client";

import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/config/base-path";

export interface DasarPenundaanItem {
  no_kmk: string;
  tgl_kmk?: string | null;
  jenis?: string | number | null;
  kriteria?: string | number | null;
  uraian?: string | null;
}

const fetcher = async (url: string) => {
  const headers: HeadersInit = { "Content-Type": "application/json" };

  const resp = await fetch(url, {
    credentials: "include",
    headers,
    signal: AbortSignal.timeout(20000),
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
  const rows = (result?.data as DasarPenundaanItem[]) ?? [];

  return rows.map((item) => {
    const no_kmk = String(item.no_kmk ?? "").trim();
    const jenis =
      item.jenis === null || item.jenis === undefined
        ? null
        : String(item.jenis).trim() || null;
    const kriteria =
      item.kriteria === null || item.kriteria === undefined
        ? null
        : String(item.kriteria).trim() || null;
    return {
      ...item,
      no_kmk,
      jenis,
      kriteria,
      uraian: item.uraian?.trim?.() ?? item.uraian ?? null,
    };
  });
};

export function useDasarPenundaanOptions(enabled: boolean = true) {
  const key = enabled
    ? apiPath("/transfer-daerah/dau/kmk/penundaan/dasar")
    : null;
  const { data, error, isLoading, refetch } = useQuery<DasarPenundaanItem[]>({
    queryKey: ["dasar-penundaan"],
    queryFn: () => fetcher(key!),
    enabled: !!key && enabled,
    refetchOnWindowFocus: false,
    staleTime: 20 * 60 * 1000, // 20 minutes - reference data
    gcTime: 60 * 60 * 1000, // 60 minutes
  });

  const options = (data || []).map((d) => {
    const noKmk = String(d.no_kmk ?? "").trim();
    return {
      value: noKmk,
      label: noKmk,
    };
  });

  const mutate = refetch; // For backward compatibility

  return { items: data || [], options, isLoading, error, mutate } as const;
}
