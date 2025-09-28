"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backendPath } from "@/lib/backend";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";

export interface OptionItem {
  value: string;
  label: string;
}

const fetcher = async (url: string) => {
  const token = getAuthTokenFromCookie();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const resp = await fetch(url, { credentials: "include", headers, signal: AbortSignal.timeout(20000) });
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

export function useKriteriaOptions(jenis?: string) {
  // Hierarchical: only fetch when jenis is provided
  const enabled = Boolean(jenis);
  const url = jenis ? backendPath(`/transfer-daerah/dau/ref/kriteria?jenis=${encodeURIComponent(jenis)}`) : "";
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery<any[]>({
    queryKey: ["kriteria-options", jenis ?? null],
    queryFn: () => fetcher(url),
    enabled,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 0,
  });

  const options: OptionItem[] = (data || [])
    .map((r) => {
      const idKriteria = String(r.id_kriteria ?? "");
      const nm = String(r.nm_kriteria ?? "");
      if (!idKriteria) return null; // filter out invalid empty values
      return {
        value: idKriteria,
        label: nm ? `${idKriteria} - ${nm}` : idKriteria,
      } as OptionItem;
    })
    .filter(Boolean) as OptionItem[];

  const mutate = () => queryClient.invalidateQueries({ queryKey: ["kriteria-options"] });
  return { options, isLoading, error, mutate } as const;
}
