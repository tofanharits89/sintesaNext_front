"use client";

import useSWR from "swr";
import { backendPath } from "@/lib/backend";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";

export interface RawPotonganItem {
  id: number | string;
  thang: number | string;
  no_kmk: string;
  uraian: string | null;
  kdkppn: string | null;
  kdpemda: string | null;
  kriteria: string | number | null;
  jenis: string | number | null;
  jan: number | null;
  peb: number | null;
  mar: number | null;
  apr: number | null;
  mei: number | null;
  jun: number | null;
  jul: number | null;
  ags: number | null;
  sep: number | null;
  okt: number | null;
  nov: number | null;
  des: number | null;
  nmpemda: string | null;
  nmkppn: string | null;
}

export interface PotonganRow extends RawPotonganItem {
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

export function useKmkPotongan(no_kmk?: string, thang?: string | number, enabled: boolean = true) {
  const key = no_kmk && thang && enabled
    ? backendPath(`/transfer-daerah/dau/kmk/potongan?no_kmk=${encodeURIComponent(no_kmk)}&thang=${encodeURIComponent(String(thang))}`)
    : null;

  const { data, error, isLoading, mutate } = useSWR<RawPotonganItem[]>(key, fetcher, {
    revalidateOnFocus: false,
  });

  const rows: PotonganRow[] = (data || []).map((r, idx) => ({
    ...r,
    no: idx + 1,
  }));

  // total across all months per row
  const totals = rows.map(r => (
    (r.jan || 0) + (r.peb || 0) + (r.mar || 0) + (r.apr || 0) + (r.mei || 0) + (r.jun || 0) +
    (r.jul || 0) + (r.ags || 0) + (r.sep || 0) + (r.okt || 0) + (r.nov || 0) + (r.des || 0)
  ));
  const grandTotal = totals.reduce((a, b) => a + b, 0);

  return { rows, isLoading, error, mutate, grandTotal } as const;
}
