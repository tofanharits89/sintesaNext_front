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
  fileName: string;
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
    fileUrl: (() => {
      const f = (r.filekmk ?? "").toString();
      if (!f) return "";
      // Absolute URL -> if it's not our backend, route through proxy to avoid CORS
      if (/^https?:\/\//i.test(f)) {
        // Heuristic: treat any non-localhost:88 (default backend) as external
        if (!/^https?:\/\/localhost:88\b/i.test(f)) {
          const needsInsecure = /sintesa\.kemenkeu\.go\.id:7000/i.test(f) ? "&insecure=1" : "";
          // derive a readable filename for the proxy path segment
          let derivedName = "file.pdf";
          try {
            const u = new URL(f);
            derivedName = (u.pathname.split("/").filter(Boolean).pop() || "file.pdf").replace(/[^a-zA-Z0-9_.-]/g, "_");
          } catch {}
          return backendPath(`/transfer-daerah/dau/kmk/file/proxy/${encodeURIComponent(derivedName)}?url=${encodeURIComponent(f)}${needsInsecure}`);
        }
        return f;
      }
      // If the path already contains our file-serving route, just prefix with backend
      if (/\/transfer-daerah\/dau\/kmk\/file\//.test(f)) {
        return backendPath(f.startsWith("/") ? f : `/${f}`);
      }
      // If it's just a bare filename, point to the stream route (no .pdf in URL)
      if (!f.includes("/")) {
        const base = f.replace(/\.pdf$/i, "");
        return backendPath(`/transfer-daerah/dau/kmk/file/stream/${encodeURIComponent(base)}`);
      }
      // Otherwise, treat as relative path
      return backendPath(f.startsWith("/") ? f : `/${f}`);
    })(),
    fileName: (() => {
      const f = (r.filekmk ?? "").toString();
      if (!f) return "";
      try {
        if (/^https?:\/\//i.test(f)) {
          const u = new URL(f);
          const last = u.pathname.split("/").filter(Boolean).pop() || "file.pdf";
          return last;
        }
      } catch {}
      const just = f.split("/").pop() || f;
      return just;
    })(),
  }));

  return { rows, isLoading, error, mutate } as const;
}
