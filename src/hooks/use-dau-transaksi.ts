"use client";

import useSWR from "swr";
import { backendPath } from "@/lib/backend";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";

export interface RawDauTransaksiRow {
  ID: number | string;
  BULAN: number;
  THANG: number;
  NMBULAN?: string;
  KDKPPN: string;
  NMKPPN?: string;
  KDPEMDA: string;
  NMPEMDA?: string;
  ALOKASI?: number;
  NILAI?: number;
}

export interface DauTransaksiRowUi {
  id: string;
  no: number;
  tahun: string;
  bulan: string;
  bulanNum: number;
  kppn: string;
  kabkota: string;
  kdpemdaCode: string;
  alokasi: number;
  nilaiPotongan: number;
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

export function useDauTransaksi(params: { thang?: number | string; bulan?: number | string; kppn?: string; kabkota?: string }) {
  const q: string[] = [];
  if (params?.thang !== undefined && params?.thang !== "") q.push(`thang=${encodeURIComponent(String(params.thang))}`);
  if (params?.bulan !== undefined && params?.bulan !== "") q.push(`bulan=${encodeURIComponent(String(params.bulan))}`);
  if (params?.kppn) q.push(`kppn=${encodeURIComponent(params.kppn)}`);
  if (params?.kabkota) q.push(`kabkota=${encodeURIComponent(params.kabkota)}`);
  const key = backendPath(`/transfer-daerah/dau/transaksi${q.length ? `?${q.join("&")}` : ""}`);

  const { data, error, isLoading, mutate } = useSWR<RawDauTransaksiRow[]>(key, fetcher, { revalidateOnFocus: false });

  const rows: DauTransaksiRowUi[] = (data || []).map((r, idx) => ({
    id: String(r.ID ?? `${r.KDKPPN}-${r.KDPEMDA}-${r.BULAN}-${r.THANG}`),
    no: idx + 1,
    tahun: String(r.THANG ?? ""),
    bulan: String(r.NMBULAN ?? r.BULAN ?? ""),
    bulanNum: Number(r.BULAN ?? 0),
    kppn: `${r.KDKPPN}${r.NMKPPN ? ` - ${r.NMKPPN}` : ""}`,
    kabkota: `${r.KDPEMDA}${r.NMPEMDA ? ` - ${r.NMPEMDA}` : ""}`,
    kdpemdaCode: String(r.KDPEMDA ?? ""),
    alokasi: Number(r.ALOKASI ?? 0),
    nilaiPotongan: Number(r.NILAI ?? 0),
  }));

  return { rows, isLoading, error, mutate } as const;
}
