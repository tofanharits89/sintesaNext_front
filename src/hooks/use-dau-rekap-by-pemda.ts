"use client";

import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/config/base-path";

export interface DauRekapByPemdaRow {
  KDPEMDA?: string;
  BULAN?: number;
  THANG?: number;
  [k: string]: any;
}

const fetcher = async (url: string) => {
  const headers: HeadersInit = { "Content-Type": "application/json" };

  const resp = await fetch(url, { credentials: "include", headers, signal: AbortSignal.timeout(20000) });
  const text = await resp.text();
  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`;
    try { const j = JSON.parse(text); msg = j?.message || j?.error || msg; } catch {}
    throw new Error(msg);
  }
  if (!text.trim()) throw new Error("Empty response from server");
  const result = JSON.parse(text);
  return result?.data ?? result;
};

export function useDauRekapByPemda(params: { kdpemda?: string; thang?: string | number }) {
  // Enhanced validation to prevent invalid kdpemda values
  const isValidKdpemda = params?.kdpemda &&
    params.kdpemda !== "undefined" &&
    params.kdpemda !== "null" &&
    params.kdpemda.trim() !== "";

  const q: string[] = [];
  if (isValidKdpemda) q.push(`kdpemda=${encodeURIComponent(params.kdpemda!)}`);
  if (params.thang) q.push(`thang=${encodeURIComponent(String(params.thang))}`);
  
  const url = isValidKdpemda
    ? apiPath(`/transfer-daerah/dau/rekap?${q.join("&")}`)
    : null;

  const { data, error, isLoading, refetch } = useQuery<DauRekapByPemdaRow[] | DauRekapByPemdaRow>({
    queryKey: ["dau-rekap-by-pemda", params.kdpemda, params.thang],
    queryFn: () => fetcher(url!),
    enabled: !!url,
    refetchOnWindowFocus: true,
    staleTime: 0, // 2 minutes - financial data changes more frequently
    gcTime: 5 * 60 * 1000, // 10 minutes
  });

  const rows: DauRekapByPemdaRow[] = Array.isArray(data) ? data : (data ? [data] : []);
  const mutate = refetch; // For backward compatibility

  return { rows, isLoading, error, mutate } as const;
}
