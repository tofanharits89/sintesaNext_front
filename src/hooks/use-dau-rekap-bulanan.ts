"use client";

import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/config/base-path";

export interface DauRekapBulananRow {
  // shape depends on backend query; include common fields
  BULAN?: number;
  THANG?: number;
  KDPEMDA?: string;
  NMPEMDA?: string;
  KDKPPN?: string;
  NMKPPN?: string;
  ALOKASI?: number;
  NILAI?: number;
  [k: string]: any;
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
  return result?.data ?? result;
};

export function useDauRekapBulanan(params: {
  kdpemda?: string;
  bulan?: number | string;
}) {
  const q: string[] = [];
  if (params?.kdpemda) q.push(`kdpemda=${encodeURIComponent(params.kdpemda)}`);
  if (params?.bulan !== undefined && params?.bulan !== "")
    q.push(`bulan=${encodeURIComponent(String(params.bulan))}`);
  const key =
    params?.kdpemda && params?.bulan !== undefined
? apiPath(`/transfer-daerah/dau/rekap/bulanan?${q.join("&")}`)
      : null; // only fetch when both provided

  const { data, error, isLoading, refetch } = useQuery<
    DauRekapBulananRow[] | DauRekapBulananRow
  >({
    queryKey: ["dau-rekap-bulanan", params.kdpemda, params.bulan],
    queryFn: () => fetcher(key!),
    enabled: !!key,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const rows: DauRekapBulananRow[] = Array.isArray(data)
    ? data
    : data
    ? [data]
    : [];
  const mutate = refetch; // For backward compatibility

  return { rows, isLoading, error, mutate } as const;
}
