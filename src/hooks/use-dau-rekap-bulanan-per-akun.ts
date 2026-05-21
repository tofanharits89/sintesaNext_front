"use client";

import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/config/base-path";

export interface DauRekapBulananPerAkunRow {
  kdakun: string;
  kdpemda: string;
  bulan: string;
  thang: string;
  nilai: number;
}

const fetcher = async (url: string): Promise<DauRekapBulananPerAkunRow[]> => {
  const resp = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(20000),
  });
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

export function useDauRekapBulananPerAkun(params: {
  kdpemda?: string;
  bulan?: number | string;
  thang?: number | string;
}) {
  const isValid =
    params?.kdpemda &&
    params.kdpemda !== "undefined" &&
    params.kdpemda !== "null" &&
    params.kdpemda.trim() !== "" &&
    params?.bulan !== undefined &&
    params.bulan !== "" &&
    params.bulan !== "undefined" &&
    params.bulan !== "null";

  const q: string[] = [];
  if (params?.kdpemda) q.push(`kdpemda=${encodeURIComponent(params.kdpemda)}`);
  if (params?.bulan !== undefined) q.push(`bulan=${encodeURIComponent(String(params.bulan))}`);
  if (params?.thang) q.push(`thang=${encodeURIComponent(String(params.thang))}`);

  const url = isValid ? apiPath(`/transfer-daerah/dau/rekap/bulanan/per-akun?${q.join("&")}`) : null;

  const { data, error, isLoading } = useQuery<DauRekapBulananPerAkunRow[]>({
    queryKey: ["dau-rekap-bulanan-per-akun", params.kdpemda, params.bulan, params.thang],
    queryFn: () => fetcher(url!),
    enabled: !!url,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  return { rows: data ?? [], isLoading, error } as const;
}
