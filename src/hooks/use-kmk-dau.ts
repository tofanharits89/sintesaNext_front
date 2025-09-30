"use client";

import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/base-path";

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
  fileName: string;
}

const fetcher = async (url: string) => {
  const resp = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
  });
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
const url = apiPath(
    `/transfer-daerah/dau/kmk${year ? `?year=${encodeURIComponent(String(year))}` : ""}`
  );
  const { data, error, isLoading, refetch } = useQuery<RawKmkDauItem[]>({
    queryKey: ["kmk-dau", year],
    queryFn: () => fetcher(url),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - financial data
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const rows: KmkRow[] = (data || []).map((r, idx) => ({
    id: String((r as any).id ?? `${String(r.thang ?? "").trim()}-${String(r.no_kmk ?? "").trim()}`),
    no: idx + 1,
    tahun: String(r.thang ?? ""),
    tanggalKmk: r.tgl_kmk ?? "",
    nomorKmk: r.no_kmk ?? "",
    uraian: r.uraian ?? "",
    jenis: String(r.jenis ?? ""),
    kriteria: (r.nm_kriteria ?? r.kriteria ?? "").toString(),
    fileUrl: (() => {
      const f = (r.filekmk ?? "").toString();
      if (!f) return "";
      // Absolute URL -> load directly in iframe to avoid backend proxy failures (502)
      // Browsers can usually render cross-origin PDFs in an iframe; if a site blocks framing,
      // the modal provides a "Buka di tab baru" link as a fallback.
      if (/^https?:\/\//i.test(f)) {
        return f;
      }
      // If the path already contains our file-serving route, just prefix with backend
      if (/\/transfer-daerah\/dau\/kmk\/file\//.test(f)) {
return apiPath(f.startsWith("/") ? f : `/${f}`);
      }
      // If it's just a bare filename, point to the stream route (no .pdf in URL)
      if (!f.includes("/")) {
        const base = f.replace(/\.pdf$/i, "");
return apiPath(
          `/transfer-daerah/dau/kmk/file/stream/${encodeURIComponent(base)}`
        );
      }
      // Otherwise, treat as relative path
return apiPath(f.startsWith("/") ? f : `/${f}`);
    })(),
    fileName: (() => {
      const f = (r.filekmk ?? "").toString();
      if (!f) return "";
      try {
        if (/^https?:\/\//i.test(f)) {
          const u = new URL(f);
          const last =
            u.pathname.split("/").filter(Boolean).pop() || "file.pdf";
          return last;
        }
      } catch {}
      const just = f.split("/").pop() || f;
      return just;
    })(),
  }));

  const mutate = refetch; // For backward compatibility

  return { rows, isLoading, error, mutate } as const;
}
