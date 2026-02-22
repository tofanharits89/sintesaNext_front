"use client";

import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/config/base-path";

interface RawUploadLaporanKeuanganKppnRow {
  id: number | string;
  tahun: string | null;
  kdkppn: string | null;
  nmkppn: string | null;
  jenis: string | null;
  nmjenis: string | null;
  periode: string | null;
  nmperiode: string | null;
  subperiode: string | null;
  nmsubperiode: string | null;
  periode_label: string | null;
  uraian: string | null;
  waktu_upload: string | null;
  file: string | null;
  fileasli: string | null;
  filename: string | null;
}

export interface UploadLaporanKeuanganKppnRow {
  id: string;
  tahun: string;
  kppn: string;
  jenis: string;
  periode: string;
  uraian: string;
  tanggalUpload: string;
  fileUrl: string;
  fileName: string;
}

const fetcher = async (url: string) => {
  const resp = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });

  const text = await resp.text();
  if (!resp.ok) {
    let message = `HTTP ${resp.status}`;
    try {
      const parsed = JSON.parse(text);
      message = parsed?.message || parsed?.error || message;
    } catch {
      // Keep fallback message.
    }
    throw new Error(message);
  }

  if (!text.trim()) return [];

  const parsed = JSON.parse(text);
  return parsed?.data ?? [];
};

export function useUploadLaporanKeuanganKppn() {
  const { data, isLoading, error, refetch } = useQuery<
    RawUploadLaporanKeuanganKppnRow[]
  >({
    queryKey: ["upload-laporan-keuangan-kppn"],
    queryFn: () =>
      fetcher(apiPath("/transfer-daerah/upload-laporan/kppn/keuangan")),
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const uniqueRawRows = (data || []).filter((row, index, arr) => {
    const id = String(row.id ?? "");
    return arr.findIndex((x) => String(x.id ?? "") === id) === index;
  });

  const rows: UploadLaporanKeuanganKppnRow[] = uniqueRawRows.map((row) => {
    const rawId = String(row.id ?? "");
    const fileName =
      (row.fileasli || "").toString().trim() ||
      (row.filename || "").toString().trim() ||
      ((row.file || "")
        .toString()
        .split(/[\\/]/)
        .filter(Boolean)
        .pop() ?? "");

    return {
      id: rawId,
      tahun: (row.tahun || "").toString().trim(),
      kppn: (row.nmkppn || row.kdkppn || "").toString().trim(),
      jenis: (row.nmjenis || "Laporan Keuangan").toString().trim(),
      periode: (
        row.periode_label ||
        row.nmperiode ||
        row.periode ||
        ""
      )
        .toString()
        .trim(),
      uraian: (row.uraian || "").toString(),
      tanggalUpload: (row.waktu_upload || "").toString(),
      fileUrl: apiPath(
        `/transfer-daerah/upload-laporan/kppn/keuangan/file/${encodeURIComponent(
          rawId
        )}`
      ),
      fileName,
    };
  });

  return { rows, isLoading, error, refetch } as const;
}
