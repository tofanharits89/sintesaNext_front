"use client";

import useSWR from "swr";
import { backendPath } from "@/lib/backend";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";

export interface KppnItem {
  kdkppn: string;
  nmkppn: string;
  no_kmk: string;
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
  return (result?.data as KppnItem[]) ?? [];
};

export function useKppnByNoKmk(no_kmk?: string) {
  const key = no_kmk ? backendPath(`/transfer-daerah/dau/kmk/penundaan/kppn?no_kmk=${encodeURIComponent(no_kmk)}`) : null;
  const { data, error, isLoading, mutate } = useSWR<KppnItem[]>(key, fetcher, { revalidateOnFocus: false });

  const options = (data || []).map((d) => ({ value: d.kdkppn, label: `${d.kdkppn} - ${d.nmkppn}` }));
  return { items: data || [], options, isLoading, error, mutate } as const;
}
