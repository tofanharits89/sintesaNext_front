"use client";

import useSWR from "swr";
import { backendPath } from "@/lib/backend";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";

export interface RawPemotonganItem {
  id: number | string;
  thang: number | string | null;
  nmbulan: string | null;
  no_kmk: string;
  kdkppn: string | null;
  bulan: number | null;
  kdakun: string | null;
  kdsatker: string | null;
  kdlokasi: string | null;
  kriteria: string | number | null;
  kdkabkota: string | null;
  nilai: number | null;
  nmpemda: string | null;
  nmkppn: string | null;
}

export interface PemotonganRow extends RawPemotonganItem {
  no: number;
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

export function useKmkPemotongan(no_kmk?: string, enabled: boolean = true) {
  const key = no_kmk && enabled
    ? backendPath(`/transfer-daerah/dau/kmk/pemotongan?no_kmk=${encodeURIComponent(no_kmk)}`)
    : null;

  const { data, error, isLoading, mutate } = useSWR<RawPemotonganItem[]>(key, fetcher, {
    revalidateOnFocus: false,
  });

  const rows: PemotonganRow[] = (data || []).map((r, idx) => ({
    ...r,
    no: idx + 1,
  }));

  return { rows, isLoading, error, mutate } as const;
}

