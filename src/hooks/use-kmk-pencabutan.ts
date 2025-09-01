"use client";

import useSWR from "swr";
import { backendPath } from "@/lib/backend";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";

export interface KmkPencabutanRow {
  no_kmk: string;
  tgl_kmk: string | null;
  no_kmkcabut: string | null;
  tglcabut: string | null;
  nm_kriteria: string | null;
  nmjenis: string | null;
  kdkppn: string | null;
  kdpemda: string | null;
  nmkppn: string | null;
  nmpemda: string | null;
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
  return (result?.data as KmkPencabutanRow[]) ?? [];
};

export function useKmkPencabutan(no_kmk?: string) {
  const key = no_kmk ? backendPath(`/transfer-daerah/dau/kmk/pencabutan?no_kmk=${encodeURIComponent(no_kmk)}`) : null;
  const { data, error, isLoading, mutate } = useSWR<KmkPencabutanRow[]>(key, fetcher, { revalidateOnFocus: false });
  return { rows: data || [], isLoading, error, mutate } as const;
}
