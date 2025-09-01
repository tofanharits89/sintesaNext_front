"use client";

import useSWR from "swr";
import { backendPath } from "@/lib/backend";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";

export interface KabKotaItem {
  kdkabkota: string; // kdpemda
  nmkabkota: string; // nmpemda
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
  if (!text.trim()) return [];
  const result = JSON.parse(text);
  return (result?.data as KabKotaItem[]) ?? [];
};

export function useKabKotaByNoKmk(_no_kmk?: string, kppn?: string) {
  const params = new URLSearchParams();
  if (kppn) params.set("kppn", kppn);
  const key = kppn ? backendPath(`/transfer-daerah/dau/kmk/penundaan/kabkota?${params.toString()}`) : null;
  const { data, error, isLoading, mutate } = useSWR<KabKotaItem[]>(key, fetcher, { revalidateOnFocus: false });

  const options = (data || []).map((d) => ({ value: d.kdkabkota, label: `${d.kdkabkota} - ${d.nmkabkota}` }));
  return { items: data || [], options, isLoading, error, mutate } as const;
}
