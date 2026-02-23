"use client";

import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/config/base-path";

export type LaporanPeriode = "mingguan" | "bulanan";

interface RawWeeklyReportRow {
  id: number | string;
  tahun: string | null;
  periode: string | null;
  bulan: string | null;
  tglawal: string | null;
  tglakhir: string | null;
  keterangan: string | null;
  fileupload: string | null;
  nmbulan: string | null;
}

export interface WeeklyReportRow {
  id: string;
  tahun: string;
  periode: string;
  bulan: string;
  namaBulan: string;
  tanggalAwal: string;
  tanggalAkhir: string;
  keterangan: string;
  fileName: string;
  fileUrl: string;
}

const fetchLaporanReport = async (
  periode?: LaporanPeriode,
): Promise<RawWeeklyReportRow[]> => {
  const query = periode ? `?periode=${encodeURIComponent(periode)}` : "";
  const response = await fetch(apiPath(`/laporan/weekly-report${query}`), {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });

  const text = await response.text();
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
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

export function useLaporanReport(periode?: LaporanPeriode) {
  const { data, isLoading, error, refetch } = useQuery<RawWeeklyReportRow[]>({
    queryKey: ["laporan-report-data", periode || "all"],
    queryFn: () => fetchLaporanReport(periode),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const rows: WeeklyReportRow[] = (data || []).map((item) => {
    const id = String(item.id ?? "");
    const fileName = (item.fileupload || "").toString().trim();

    return {
      id,
      tahun: (item.tahun || "").toString().trim(),
      periode: (item.periode || "").toString().trim(),
      bulan: (item.bulan || "").toString().trim(),
      namaBulan: (item.nmbulan || "").toString().trim(),
      tanggalAwal: (item.tglawal || "").toString().trim(),
      tanggalAkhir: (item.tglakhir || "").toString().trim(),
      keterangan: (item.keterangan || "").toString(),
      fileName,
      fileUrl: apiPath(`/laporan/weekly-report/file/${encodeURIComponent(id)}`),
    };
  });

  return { rows, isLoading, error, refetch } as const;
}

export function useWeeklyReport() {
  return useLaporanReport("mingguan");
}

export function useMonthlyReport() {
  return useLaporanReport("bulanan");
}
