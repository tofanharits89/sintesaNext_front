"use client";

import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/config/base-path";

export interface OptionItem {
  value: string;
  label: string;
}

const fetcher = async (url: string) => {
  const headers: HeadersInit = { "Content-Type": "application/json" };

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
const key = jenis ? apiPath(`/transfer-daerah/dau/ref/kriteria?jenis=${encodeURIComponent(jenis)}`) : null;
  const { data, error, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["kriteria-options", jenis],
    queryFn: () => fetcher(key!),
    enabled: !!key, // Only run when key exists (jenis provided)
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
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

  const mutate = refetch; // For backward compatibility

  return { options, isLoading, error, mutate } as const;
}
