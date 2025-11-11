"use client";

import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/config/base-path";

export interface RawDauTransaksiRow {
  id: number | string;
  bulan: string;
  thang: string;
  nmbulan?: string;
  kdkppn: string;
  nmkppn?: string;
  kdpemda: string;
  nmpemda?: string;
  alokasi?: number;
  nilai?: number;
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
  const data = result?.data ?? result;

  
  return data;
};

export function useDauTransaksi(params: { thang?: number | string; bulan?: number | string; kppn?: string; kabkota?: string }) {
  const q: string[] = [];
  if (params?.thang !== undefined && params?.thang !== "") q.push(`thang=${encodeURIComponent(String(params.thang))}`);
  if (params?.bulan !== undefined && params?.bulan !== "") q.push(`bulan=${encodeURIComponent(String(params.bulan))}`);
  if (params?.kppn) q.push(`kppn=${encodeURIComponent(params.kppn)}`);
  if (params?.kabkota) q.push(`kabkota=${encodeURIComponent(params.kabkota)}`);
  const key = apiPath(`/transfer-daerah/dau/transaksi${q.length ? `?${q.join("&")}` : ""}`);

  const { data, error, isLoading, refetch } = useQuery<RawDauTransaksiRow[]>({
    queryKey: ["dau-transaksi", params],
    queryFn: () => fetcher(key),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - financial data
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const rows: DauTransaksiRowUi[] = (data || []).map((r, idx) => {
    const kdpeemda = String(r.kdpemda ?? "").trim();

    // Better fallback for KPPN and PEMDA names
    const kppnName = r.nmkppn && r.nmkppn.trim() !== "" ? r.nmkppn.trim() : null;
    const pemdaName = r.nmpemda && r.nmpemda.trim() !== "" ? r.nmpemda.trim() : null;

    return {
      id: String(r.id ?? `${r.kdkppn}-${r.kdpemda}-${r.bulan}-${r.thang}`),
      no: idx + 1,
      tahun: String(r.thang ?? "").trim(),
      bulan: String(r.nmbulan ?? r.bulan ?? "").trim(),
      bulanNum: Number(r.bulan ?? 0),
      kppn: kppnName ? `${r.kdkppn} - ${kppnName}` : r.kdkppn,
      kabkota: pemdaName ? `${r.kdpemda} - ${pemdaName}` : r.kdpemda,
      kdpemdaCode: kdpeemda,
      alokasi: Number(r.alokasi ?? 0),
      nilaiPotongan: Number(r.nilai ?? 0),
    };
  });

  const mutate = refetch; // For backward compatibility

  return { rows, isLoading, error, mutate } as const;
}
