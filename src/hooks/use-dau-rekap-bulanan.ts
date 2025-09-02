"use client";

import useSWR from "swr";
import { backendPath } from "@/lib/backend";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";

export interface DauRekapBulananRow {
  // shape depends on backend query; include common fields
  BULAN?: number;
  THANG?: number;
  KDPEMDA?: string;
  NMPEMDA?: string;
  KDKPPN?: string;
  NMKPPN?: string;
  ALOKASI?: number;
  NILAI?: number;
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

export function useDauRekapBulanan(params: { kdpemda?: string; bulan?: number | string }) {
  const q: string[] = [];
  if (params?.kdpemda) q.push(`kdpemda=${encodeURIComponent(params.kdpemda)}`);
  if (params?.bulan !== undefined && params?.bulan !== "") q.push(`bulan=${encodeURIComponent(String(params.bulan))}`);
  const key = params?.kdpemda && params?.bulan !== undefined
    ? backendPath(`/transfer-daerah/dau/rekap/bulanan?${q.join("&")}`)
    : null; // only fetch when both provided

  const { data, error, isLoading, mutate } = useSWR<DauRekapBulananRow[] | DauRekapBulananRow>(key, fetcher, { revalidateOnFocus: false });
  const rows: DauRekapBulananRow[] = Array.isArray(data) ? data : (data ? [data] : []);
  return { rows, isLoading, error, mutate } as const;
}
