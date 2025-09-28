"use client";

import { useQuery } from "@tanstack/react-query";
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

export function useDasarPemotonganOptions(kriteria?: string) {
  const key = kriteria ? backendPath(`/transfer-daerah/dau/ref/dasar-pemotongan?kriteria=${encodeURIComponent(kriteria)}`) : null;
  const { data, error, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["dasar-pemotongan-options", kriteria],
    queryFn: () => fetcher(key!),
    enabled: !!key,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const options: OptionItem[] = (data || [])
    .map((r) => {
      const noKmk = String(r.no_kmk ?? r.value ?? "");
      if (!noKmk) return null;
      const label = String(r.no_kmk ?? r.label ?? noKmk);
      return { value: noKmk, label } as OptionItem;
    })
    .filter(Boolean) as OptionItem[];

  const mutate = refetch; // For backward compatibility

  return { options, isLoading, error, mutate } as const;
}
