"use client";

import { useQuery } from "@tanstack/react-query";
import { backendPath } from "@/lib/backend";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";

export interface DauPenundaanCabutRow {
  KDPEMDA?: string;
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

export function useDauPenundaanCabutByPemda(params: { kdpemda?: string }) {
  const enabled = Boolean(params?.kdpemda);
  const url = params?.kdpemda
    ? backendPath(`/transfer-daerah/dau/penundaan-cabut?kdpemda=${encodeURIComponent(params.kdpemda)}`)
    : null;

  const { data, error, isLoading, refetch } = useQuery<DauPenundaanCabutRow[] | DauPenundaanCabutRow>({
    queryKey: ["dau-penundaan-cabut-by-pemda", params.kdpemda],
    queryFn: () => fetcher(key!),
    enabled: !!key,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const rows: DauPenundaanCabutRow[] = Array.isArray(data) ? data : (data ? [data] : []);
  const mutate = refetch; // For backward compatibility

  return { rows, isLoading, error, mutate } as const;
}
