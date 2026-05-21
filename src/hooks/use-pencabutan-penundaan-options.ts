"use client";

import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/config/base-path";

export interface PencabutanPenundaanItem {
  id: number;
  no_kmk: string;
  tgl_kmk: string | null;
  tglcabut: string | null;
  no_kmkcabut: string | null;
  bulancabut: number | null; // EXTRACT(MONTH FROM tglcabut)
  jenis: string;
  kriteria: string;
  uraian: string | null;
  kdkppn: string;
  kdpemda: string;
  jan: number; peb: number; mar: number; apr: number;
  mei: number; jun: number; jul: number; ags: number;
  sep: number; okt: number; nov: number; des: number;
}

const fetcher = async (url: string): Promise<PencabutanPenundaanItem[]> => {
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
  if (!text.trim()) return [];
  const result = JSON.parse(text);
  return result?.data ?? [];
};

export function usePencabutanPenundaanOptions(params: {
  kdkppn?: string;
  kdpemda?: string;
  kriteria?: string;
  thang?: string | number;
  enabled?: boolean;
}) {
  const isValid =
    !!params.kdkppn && !!params.kdpemda &&
    params.kdkppn !== "undefined" && params.kdpemda !== "undefined";
  const enabled = isValid && (params.enabled !== false);

  const q = new URLSearchParams();
  if (params.kdkppn) q.set("kdkppn", params.kdkppn);
  if (params.kdpemda) q.set("kdpemda", params.kdpemda);
  if (params.kriteria) q.set("kriteria", params.kriteria);
  if (params.thang) q.set("thang", String(params.thang));

  const url = enabled
    ? apiPath(`/transfer-daerah/dau/pencabutan-penundaan/options?${q.toString()}`)
    : null;

  const { data, error, isLoading } = useQuery<PencabutanPenundaanItem[]>({
    queryKey: ["pencabutan-penundaan-options", params.kdkppn, params.kdpemda, params.kriteria, params.thang],
    queryFn: () => fetcher(url!),
    enabled: !!url,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const items = data ?? [];

  // Format: "Penundaan: {no_kmk} Tgl {tgl_kmk}, Pencabutan: {no_kmkcabut} Tgl {tglcabut}"
  const options = items.map((d) => {
    const fmtDate = (s: string | null) => {
      if (!s) return "-";
      try { return new Date(s).toLocaleDateString("id-ID"); } catch { return s; }
    };
    const label = `Penundaan: ${d.no_kmk} Tgl ${fmtDate(d.tgl_kmk)}, Pencabutan: ${d.no_kmkcabut || "-"} Tgl ${fmtDate(d.tglcabut)}`;
    return { value: d.no_kmk, label };
  });

  return { items, options, isLoading, error } as const;
}
