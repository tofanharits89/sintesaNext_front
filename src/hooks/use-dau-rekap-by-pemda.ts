"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backendPath } from "@/lib/backend";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";

export interface DauRekapByPemdaRow {
  KDPEMDA?: string;
  BULAN?: number;
  THANG?: number;
  [k: string]: any;
}

const fetcher = async (url: string) => {
  const token = getAuthTokenFromCookie();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

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

export function useDauRekapByPemda(params: { kdpemda?: string }) {
  const enabled = Boolean(params?.kdpemda);
  const url = params?.kdpemda
    ? backendPath(`/transfer-daerah/dau/rekap?kdpemda=${encodeURIComponent(params.kdpemda)}`)
    : "";
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery<DauRekapByPemdaRow[] | DauRekapByPemdaRow>({
    queryKey: ["dau-rekap-by-pemda", params?.kdpemda ?? null],
    queryFn: () => fetcher(url),
    enabled,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 0,
  });
  const rows: DauRekapByPemdaRow[] = Array.isArray(data) ? data : (data ? [data] : []);
  const mutate = () => queryClient.invalidateQueries({ queryKey: ["dau-rekap-by-pemda"] });
  return { rows, isLoading, error, mutate } as const;
}
