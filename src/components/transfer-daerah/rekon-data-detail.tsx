"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiPath } from "@/lib/config/base-path";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RekonDetailRow {
  THANG?: string;
  thang?: string;
  NMBULAN?: string;
  nmbulan?: string;
  KDKPPN?: string;
  kdkppn?: string;
  NMKPPN?: string;
  nmkppn?: string;
  KDPEMDA?: string;
  kdpemda?: string;
  NMPEMDA?: string;
  nmpemda?: string;
  PAGU?: number;
  pagu?: number;
  ALOKASI_BULAN?: number;
  alokasi_bulan?: number;
  TUNDASINTESA?: number;
  tunda?: number;
  POTONGANSINTESA?: number;
  potongan?: number;
  SALURSINTESA?: number;
  salur?: number;
  PENUNDAANOMSPAN?: number;
  penundaanomspan?: number;
  POTONGANOMSPAN?: number;
  potonganomspan?: number;
  CABUT?: number;
  cabut?: number;
}

interface RekonPotonganRow {
  thang?: string;
  bulan?: string;
  kdkppn?: string;
  kdpemda?: string;
  akun_pusat?: string;
  AKUN_PUSAT?: string;
  akun_omspan?: string;
  AKUN_OMSPAN?: string;
  nilai_pusat?: number;
  NILAI_PUSAT?: number;
  nilai_omspan?: number;
  NILAI_OMSPAN?: number;
}

interface RekonDataDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kdkppn: string;
  kdpemda: string;
  thang: string;
  bulan: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(value: number | undefined | null): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function normalizeRow(item: RekonDetailRow): Required<{
  NMKPPN: string;
  KDKPPN: string;
  NMPEMDA: string;
  KDPEMDA: string;
  NMBULAN: string;
  ALOKASI_BULAN: number;
  TUNDASINTESA: number;
  POTONGANSINTESA: number;
  SALURSINTESA: number;
  PENUNDAANOMSPAN: number;
  POTONGANOMSPAN: number;
}> {
  return {
    NMKPPN: String(item.NMKPPN ?? item.nmkppn ?? ""),
    KDKPPN: String(item.KDKPPN ?? item.kdkppn ?? ""),
    NMPEMDA: String(item.NMPEMDA ?? item.nmpemda ?? ""),
    KDPEMDA: String(item.KDPEMDA ?? item.kdpemda ?? ""),
    NMBULAN: String(item.NMBULAN ?? item.nmbulan ?? ""),
    ALOKASI_BULAN: Number(item.ALOKASI_BULAN ?? item.alokasi_bulan ?? 0),
    TUNDASINTESA: Number(item.TUNDASINTESA ?? item.tunda ?? 0),
    POTONGANSINTESA: Number(item.POTONGANSINTESA ?? item.potongan ?? 0),
    SALURSINTESA: Number(item.SALURSINTESA ?? item.salur ?? 0),
    PENUNDAANOMSPAN: Number(item.PENUNDAANOMSPAN ?? item.penundaanomspan ?? 0),
    POTONGANOMSPAN: Number(item.POTONGANOMSPAN ?? item.potonganomspan ?? 0),
  };
}

function normalizePotonganRow(item: RekonPotonganRow) {
  return {
    akun_pusat: item.akun_pusat ?? item.AKUN_PUSAT ?? "",
    akun_omspan: item.akun_omspan ?? item.AKUN_OMSPAN ?? "",
    nilai_pusat: Number(item.nilai_pusat ?? item.NILAI_PUSAT ?? 0),
    nilai_omspan: Number(item.nilai_omspan ?? item.NILAI_OMSPAN ?? 0),
  };
}

async function fetcher<T>(url: string): Promise<T> {
  const resp = await fetch(url, { credentials: "include" });
  if (!resp.ok) {
    const text = await resp.text();
    let msg = `HTTP ${resp.status}`;
    try { const j = JSON.parse(text); msg = j?.msg || j?.message || msg; } catch {}
    throw new Error(msg);
  }
  const json = await resp.json();
  return (json?.data ?? json?.result ?? json) as T;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RekonDataDetailModal({
  open,
  onOpenChange,
  kdkppn,
  kdpemda,
  thang,
  bulan,
}: RekonDataDetailModalProps) {
  const enabled = open && !!kdkppn && !!kdpemda && !!thang && !!bulan;

  const queryParams = `thang=${thang}&kdpemda=${kdpemda}&kdkppn=${kdkppn}&bulan=${bulan}`;

  // Fetch rekon detail (sintesa vs OMSPAN)
  const { data: detailData, isLoading: loadingDetail, error: errorDetail } =
    useQuery<RekonDetailRow[]>({
      queryKey: ["rekon-detail", thang, kdpemda, kdkppn, bulan],
      queryFn: () => fetcher<RekonDetailRow[]>(apiPath(`/transfer-daerah/omspan/rekon-live?${queryParams}`)),
      enabled,
      staleTime: 2 * 60 * 1000,
      refetchOnWindowFocus: false,
    });

  // Fetch detail per akun potongan
  const { data: potonganData, isLoading: loadingPotongan } =
    useQuery<RekonPotonganRow[]>({
      queryKey: ["rekon-potongan", thang, kdpemda, kdkppn, bulan],
      queryFn: () => fetcher<RekonPotonganRow[]>(apiPath(`/transfer-daerah/omspan/rekon-potongan?${queryParams}`)),
      enabled,
      staleTime: 2 * 60 * 1000,
      refetchOnWindowFocus: false,
    });

  const isLoading = loadingDetail || loadingPotongan;
  const displayData = (detailData ?? []).map(normalizeRow);
  const potonganRows = (potonganData ?? []).map(normalizePotonganRow);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="text-emerald-600">◈</span>
            Rekon Data DAU | Sintesa vs OMSPAN TKD
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center gap-2 py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Memuat data rekon...</p>
          </div>
        ) : errorDetail ? (
          <div className="text-sm text-red-600 py-4">
            {String((errorDetail as Error).message || errorDetail)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/70">
                  <th rowSpan={3} className="border px-2 py-1 text-center align-middle">KPPN</th>
                  <th rowSpan={3} className="border px-2 py-1 text-center align-middle">Pemda</th>
                  <th rowSpan={3} className="border px-2 py-1 text-center align-middle">Bulan</th>
                  <th colSpan={3} className="border px-2 py-1 text-center">Sintesa</th>
                  <th colSpan={2} className="border px-2 py-1 text-center">OMSPAN</th>
                </tr>
                <tr className="bg-muted/50">
                  <th rowSpan={2} className="border px-2 py-1 text-center align-middle">Alokasi</th>
                  <th rowSpan={2} className="border px-2 py-1 text-center align-middle">Penundaan</th>
                  <th colSpan={1} className="border px-2 py-1 text-center">Potongan</th>
                  <th rowSpan={1} className="border px-2 py-1 text-center">Penundaan</th>
                  <th colSpan={1} className="border px-2 py-1 text-center">Potongan</th>
                </tr>
              </thead>
              <tbody className="font-semibold">
                {displayData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="border px-2 py-4 text-center text-muted-foreground">
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  displayData.map((row, idx) => {
                    const tundaBeda = row.PENUNDAANOMSPAN !== row.TUNDASINTESA;
                    const potongBeda = row.POTONGANOMSPAN !== row.POTONGANSINTESA;
                    return (
                      <tr key={idx}>
                        <td className="border px-2 py-1 text-center align-middle">
                          {row.NMKPPN} - {row.KDKPPN}
                        </td>
                        <td className="border px-2 py-1 text-center align-middle">
                          {row.NMPEMDA} - {row.KDPEMDA}
                        </td>
                        <td className="border px-2 py-1 text-center align-middle">
                          {row.NMBULAN}
                        </td>
                        <td className="border px-2 py-1 text-right align-middle">
                          {formatNumber(row.ALOKASI_BULAN)}
                        </td>
                        {/* Sintesa Penundaan */}
                        <td
                          className="border px-2 py-1 text-right align-middle"
                          style={{ color: tundaBeda ? "white" : undefined, background: tundaBeda ? "#dc2626" : undefined }}
                        >
                          <span>{formatNumber(row.TUNDASINTESA)}</span>
                        </td>
                        {/* Sintesa Potongan */}
                        <td
                          className="border px-2 py-1 text-right align-middle"
                          style={{ color: potongBeda ? "white" : undefined, background: potongBeda ? "#dc2626" : undefined }}
                        >
                          <span>{formatNumber(row.POTONGANSINTESA)}</span>
                        </td>
                        {/* OMSPAN Penundaan */}
                        <td
                          className="border px-2 py-1 text-right align-middle"
                          style={{ color: tundaBeda ? "white" : undefined, background: tundaBeda ? "#dc2626" : undefined }}
                        >
                          <span>{formatNumber(row.PENUNDAANOMSPAN)}</span>
                        </td>
                        {/* OMSPAN Potongan */}
                        <td
                          className="border px-2 py-1 text-right align-middle"
                          style={{ color: potongBeda ? "white" : undefined, background: potongBeda ? "#dc2626" : undefined }}
                        >
                          <span>{formatNumber(row.POTONGANOMSPAN)}</span>
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Sub-header for per-akun potongan breakdown */}
                {potonganRows.length > 0 && (
                  <tr className="bg-muted/30">
                    <th colSpan={4} className="border px-2 py-1" />
                    <th className="border px-2 py-1 text-center text-xs">Akun (Sintesa)</th>
                    <th className="border px-2 py-1 text-center text-xs">Nilai (Sintesa)</th>
                    <th className="border px-2 py-1 text-center text-xs">Akun (OMSPAN)</th>
                    <th className="border px-2 py-1 text-center text-xs">Nilai (OMSPAN)</th>
                  </tr>
                )}

                {potonganRows.map((row, idx) => (
                  <tr key={`potongan-${idx}`}>
                    <td colSpan={4} className="border" />
                    <td className="border px-2 py-1 text-center align-middle">{row.akun_pusat}</td>
                    <td className="border px-2 py-1 text-right align-middle">
                      {formatNumber(row.nilai_pusat)}
                    </td>
                    <td className="border px-2 py-1 text-center align-middle">
                      {row.akun_omspan === "0" || row.akun_omspan === "" ? "-" : row.akun_omspan}
                    </td>
                    <td className="border px-2 py-1 text-right align-middle">
                      {formatNumber(row.nilai_omspan)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default RekonDataDetailModal;
