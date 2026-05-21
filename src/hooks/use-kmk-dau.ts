"use client";

import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/config/base-path";
import { useMemo } from "react";
import tkdData from "@/data/kdkppn_tkd.json";

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
  kdkppn?: string | null;
  kdkanwil?: string | null;
}

export interface KmkRow {
  id: string;
  no: number;
  tahun: string;
  tanggalKmk: string;
  nomorKmk: string;
  uraian: string;
  jenis: string; // code as string (e.g., "1", "2")
  nmjenis: string; // name from backend
  kriteria: string; // human readable
  fileUrl: string;
  fileName: string;
}

const fetcher = async (url: string) => {
  const resp = await fetch(url, {
    credentials: "include",
    headers: { 
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      Pragma: "no-cache"
    },
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

export function useKmkDau(year?: string | number, kdkanwil?: string, kdkppn?: string) {
  const { data: rawData, error, isLoading, refetch } = useQuery<RawKmkDauItem[]>({
    queryKey: ["kmk-dau", year, kdkanwil, kdkppn],
    queryFn: () => {
      // Add timestamp to bust cache
      const timestamp = Date.now();
      const q: string[] = [];
      if (year) q.push(`year=${encodeURIComponent(String(year))}`);
      if (kdkanwil) q.push(`kdkanwil=${encodeURIComponent(kdkanwil)}`);
      if (kdkppn) q.push(`kdkppn=${encodeURIComponent(kdkppn)}`);
      q.push(`_t=${timestamp}`);
      
      const url = apiPath(`/transfer-daerah/dau/kmk${q.length ? `?${q.join("&")}` : ""}`);
      return fetcher(url);
    },
    refetchOnWindowFocus: false,
    staleTime: 0, // Always consider data stale for immediate refetch after mutations
    gcTime: 0, // No cache
  });

  const rows: KmkRow[] = useMemo(() => {
    if (!rawData) return [];

    // Client-side filter fallback: Some KMK Decision Letters are unit-specific (e.g. jenis 3)
    const filteredData = rawData.filter((r) => {
      // If a row has specific unit info, it MUST match the user's unit
      if (kdkppn) {
        const targetKppn = String(kdkppn).trim().padStart(3, '0');
        const rowKppn = String(r.kdkppn || "").trim().padStart(3, '0');
        if (r.kdkppn && rowKppn !== targetKppn) return false;
      }

      if (kdkanwil) {
        const targetKanwil = String(kdkanwil).trim().padStart(2, '0');
        const rowKanwil = String(r.kdkanwil || "").trim().padStart(2, '0');
        
        // If row has kanwil, it must match
        if (r.kdkanwil && rowKanwil !== targetKanwil) return false;
        
        // If row has kppn but no kanwil, check if that kppn belongs to the kanwil
        if (r.kdkppn && !r.kdkanwil) {
          const rowKppn = String(r.kdkppn).trim().padStart(3, '0');
          const kppnsInKanwil = new Set(
            (tkdData as any[])
              .filter((d) => String(d.kdkanwil || "").trim().padStart(2, '0') === targetKanwil)
              .map((d) => String(d.kdkppn || "").trim().padStart(3, '0'))
          );
          if (!kppnsInKanwil.has(rowKppn)) return false;
        }
      }

      return true;
    });

    return filteredData.map((r, idx) => ({
      id: String((r as any).id ?? `${String(r.thang ?? "").trim()}-${String(r.no_kmk ?? "").trim()}`),
      no: idx + 1,
      tahun: String(r.thang ?? ""),
      tanggalKmk: r.tgl_kmk ?? "",
      nomorKmk: r.no_kmk ?? "",
      uraian: r.uraian ?? "",
      jenis: String(r.jenis ?? "").trim(),
      nmjenis: (r.nmjenis ?? "").toString().trim(),
      kriteria: (r.nm_kriteria ?? r.kriteria ?? "").toString(),
      fileUrl: (() => {
        const f = (r.filekmk ?? "").toString().trim(); // Trim whitespace
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
        // If it's just a bare filename, use the file serving route
        if (!f.includes("/")) {
          return apiPath(`/transfer-daerah/dau/kmk/file/${encodeURIComponent(f)}`);
        }
        // Otherwise, treat as relative path
        return apiPath(f.startsWith("/") ? f : `/${f}`);
      })(),
      fileName: (() => {
        const f = (r.filekmk ?? "").toString().trim(); // Trim whitespace
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
  }, [rawData, kdkanwil, kdkppn]);

  const mutate = refetch; // For backward compatibility

  return { rows, isLoading, error, mutate } as const;
}
