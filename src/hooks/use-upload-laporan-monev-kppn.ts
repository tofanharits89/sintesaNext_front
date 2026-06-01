"use client";

import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/config/base-path";
import { useAuth } from "@/hooks/useAuth";

interface RawUploadLaporanMonevKppnRow {
  id: number | string;
  tahun: string | null;
  kdkppn: string | null;
  nmkppn: string | null;
  jenis: string | null;
  nmjenis: string | null;
  periode: string | null;
  nmsubperiode: string | null;
  uraian: string | null;
  waktu_upload: string | null;
  file: string | null;
  fileasli: string | null;
  filename: string | null;
}

export interface UploadLaporanMonevKppnRow {
  id: string;
  tahun: string;
  kppn: string;
  jenis: string;
  periodeCode: string;
  periode: string;
  uraian: string;
  tanggalUpload: string;
  fileUrl: string;
  fileName: string;
}

interface UseUploadLaporanMonevKppnParams {
  page: number;
  limit: number;
  periode?: string;
}

interface FetchResult {
  data: RawUploadLaporanMonevKppnRow[];
  total: number;
}

const fetcher = async (url: string): Promise<FetchResult> => {
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
      // Keep fallback.
    }
    throw new Error(message);
  }

  if (!text.trim()) return { data: [], total: 0 };

  const parsed = JSON.parse(text);
  return {
    data: parsed?.data ?? [],
    total: typeof parsed?.total === "number" ? parsed.total : 0,
  };
};

export function useUploadLaporanMonevKppn({
  page,
  limit,
  periode,
}: UseUploadLaporanMonevKppnParams) {
  const { user } = useAuth();

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (periode && periode !== "all") {
    params.set("periode", periode);
  }

  const url = apiPath(
    `/transfer-daerah/upload-laporan/kppn/monev?${params.toString()}`
  );

  const { data, isLoading, error, refetch } = useQuery<FetchResult>({
    queryKey: [
      "upload-laporan-monev-kppn",
      user?.role,
      user?.kdkppn,
      page,
      limit,
      periode,
    ],
    queryFn: () => fetcher(url),
    refetchOnWindowFocus: "always",
    refetchOnMount: "always",
    staleTime: 0,
    gcTime: 0,
    enabled: !!user,
  });

  const rawRows = data?.data || [];
  const total = data?.total ?? 0;

  const uniqueRawRows = rawRows.filter((row, index, arr) => {
    const id = String(row.id ?? "");
    return arr.findIndex((x) => String(x.id ?? "") === id) === index;
  });

  const rows: UploadLaporanMonevKppnRow[] = uniqueRawRows.map((row) => {
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
      jenis: (row.nmjenis || "Laporan Monev").toString().trim(),
      periodeCode: (row.periode || "").toString().trim(),
      periode: (row.nmsubperiode || row.periode || "").toString().trim(),
      uraian: (row.uraian || "").toString(),
      tanggalUpload: (row.waktu_upload || "").toString(),
      fileUrl: apiPath(
        `/transfer-daerah/upload-laporan/kppn/monev/file/${encodeURIComponent(
          rawId
        )}`
      ),
      fileName,
    };
  });

  return { rows, total, isLoading, error, refetch } as const;
}
