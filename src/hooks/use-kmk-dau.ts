"use client";

import useSWR from "swr";
import { backendPath } from "@/lib/backend";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";

export interface RawKmkDauItem {
  id: string | number;
  thang: number | string;
  no_kmk: string;
  tgl_kmk: string;
  bulan?: number;
  uraian?: string;
  filekmk?: string;
  no_kmkcabut?: string | null;
  tglcabut?: string | null;
  jenis?: string | number;
  kriteria?: string | number | null;
  nm_kriteria?: string | null;
  nmjenis?: string | null;
  status_cabut?: string | number | null;
}

export interface KmkRow {
  id: string;
  no: number;
  tahun: string;
  tanggalKmk: string;
  nomorKmk: string;
  uraian: string;
  jenis: string; // code as string (e.g., "1", "2")
  kriteria: string; // human readable
  fileUrl: string;
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

export function useKmkDau(year?: string | number) {
  const key = backendPath(`/transfer-daerah/dau/kmk${year ? `?year=${encodeURIComponent(String(year))}` : ""}`);
  const { data, error, isLoading, mutate } = useSWR<RawKmkDauItem[]>(key, fetcher, {
    revalidateOnFocus: false,
  });

  const rows: KmkRow[] = (data || []).map((r, idx) => ({
    id: String(r.id),
    no: idx + 1,
    tahun: String(r.thang ?? ""),
    tanggalKmk: r.tgl_kmk ?? "",
    nomorKmk: r.no_kmk ?? "",
    uraian: r.uraian ?? "",
    jenis: String(r.jenis ?? ""),
    kriteria: (r.nm_kriteria ?? r.kriteria ?? "").toString(),
    fileUrl: r.filekmk ?? "",
  }));

  return { rows, isLoading, error, mutate } as const;
}
