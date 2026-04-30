"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiPath } from "@/lib/config/base-path";
import { useQuery } from "@tanstack/react-query";
import { Loader2, GitCompareArrows } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RekonDetailRow {
  THANG?: string;   thang?: string;
  NMBULAN?: string; nmbulan?: string;
  KDKPPN?: string;  kdkppn?: string;
  NMKPPN?: string;  nmkppn?: string;
  KDPEMDA?: string; kdpemda?: string;
  NMPEMDA?: string; nmpemda?: string;
  PAGU?: number;             pagu?: number;
  ALOKASI_BULAN?: number;    alokasi_bulan?: number;
  TUNDASINTESA?: number;     tunda?: number;
  POTONGANSINTESA?: number;  potongan?: number;
  SALURSINTESA?: number;     salur?: number;
  PENUNDAANOMSPAN?: number;  penundaanomspan?: number;
  POTONGANOMSPAN?: number;   potonganomspan?: number;
  CABUT?: number;            cabut?: number;
}

interface RekonPotonganRow {
  thang?: string; bulan?: string; kdkppn?: string; kdpemda?: string;
  akun_pusat?: string;  AKUN_PUSAT?: string;
  akun_omspan?: string; AKUN_OMSPAN?: string;
  nilai_pusat?: number; NILAI_PUSAT?: number;
  nilai_omspan?: number; NILAI_OMSPAN?: number;
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

function normalizeRow(item: RekonDetailRow) {
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

  const { data: detailData, isLoading: loadingDetail, error: errorDetail } =
    useQuery<RekonDetailRow[]>({
      queryKey: ["rekon-detail", thang, kdpemda, kdkppn, bulan],
      queryFn: () => fetcher<RekonDetailRow[]>(apiPath(`/transfer-daerah/omspan/rekon-live?${queryParams}`)),
      enabled,
      staleTime: 2 * 60 * 1000,
      refetchOnWindowFocus: false,
    });

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
      <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-auto p-0">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <GitCompareArrows className="h-4 w-4 text-emerald-600 shrink-0" />
            Rekonsilisasi DAU &mdash; Sintesa vs OMSPAN TKD
          </DialogTitle>
          {/* Context badges */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge variant="outline" className="text-[10px] font-normal px-2 py-0.5">
              TA {thang}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-normal px-2 py-0.5">
              KPPN {kdkppn}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-normal px-2 py-0.5">
              Pemda {kdpemda}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-normal px-2 py-0.5">
              Bulan {bulan}
            </Badge>
          </div>
        </DialogHeader>

        <Separator />

        <div className="px-5 py-4">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Memuat data rekon...</p>
            </div>
          ) : errorDetail ? (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-xs text-destructive">
              {String((errorDetail as Error).message || errorDetail)}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Main comparison table */}
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    {/* Row 1: group headers */}
                    <tr className="bg-muted/60 text-foreground">
                      <th rowSpan={3} className="border border-border px-2 py-1.5 text-center align-middle font-semibold whitespace-nowrap">KPPN</th>
                      <th rowSpan={3} className="border border-border px-2 py-1.5 text-center align-middle font-semibold whitespace-nowrap">Pemda</th>
                      <th rowSpan={3} className="border border-border px-2 py-1.5 text-center align-middle font-semibold whitespace-nowrap">Bulan</th>
                      <th rowSpan={3} className="border border-border px-2 py-1.5 text-center align-middle font-semibold whitespace-nowrap">Alokasi</th>
                      <th colSpan={2} className="border border-border px-2 py-1.5 text-center font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
                        Sintesa
                      </th>
                      <th colSpan={2} className="border border-border px-2 py-1.5 text-center font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300">
                        OMSPAN
                      </th>
                    </tr>
                    {/* Row 2: sub-headers */}
                    <tr className="bg-muted/40">
                      <th className="border border-border px-2 py-1 text-center font-medium text-blue-600 dark:text-blue-400">Penundaan</th>
                      <th className="border border-border px-2 py-1 text-center font-medium text-blue-600 dark:text-blue-400">Potongan</th>
                      <th className="border border-border px-2 py-1 text-center font-medium text-amber-600 dark:text-amber-400">Penundaan</th>
                      <th className="border border-border px-2 py-1 text-center font-medium text-amber-600 dark:text-amber-400">Potongan</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {displayData.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="border border-border px-2 py-6 text-center text-muted-foreground text-xs">
                          Tidak ada data untuk parameter yang dipilih
                        </td>
                      </tr>
                    ) : (
                      displayData.map((row, idx) => {
                        const tundaBeda = row.PENUNDAANOMSPAN !== row.TUNDASINTESA;
                        const potongBeda = row.POTONGANOMSPAN !== row.POTONGANSINTESA;
                        return (
                          <tr key={idx} className="hover:bg-muted/30 transition-colors">
                            <td className="border border-border px-2 py-1.5 text-center align-middle font-sans">
                              <span className="font-medium">{row.KDKPPN}</span>
                              <span className="text-muted-foreground text-[10px] block">{row.NMKPPN}</span>
                            </td>
                            <td className="border border-border px-2 py-1.5 text-center align-middle font-sans">
                              <span className="font-medium">{row.KDPEMDA}</span>
                              <span className="text-muted-foreground text-[10px] block">{row.NMPEMDA}</span>
                            </td>
                            <td className="border border-border px-2 py-1.5 text-center align-middle font-sans whitespace-nowrap">
                              {row.NMBULAN}
                            </td>
                            <td className="border border-border px-2 py-1.5 text-right align-middle">
                              {formatNumber(row.ALOKASI_BULAN)}
                            </td>
                            {/* Sintesa Penundaan */}
                            <td className={cn(
                              "border border-border px-2 py-1.5 text-right align-middle transition-colors",
                              tundaBeda
                                ? "bg-destructive text-destructive-foreground font-semibold"
                                : "bg-blue-50/50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-200"
                            )}>
                              {formatNumber(row.TUNDASINTESA)}
                            </td>
                            {/* Sintesa Potongan */}
                            <td className={cn(
                              "border border-border px-2 py-1.5 text-right align-middle transition-colors",
                              potongBeda
                                ? "bg-destructive text-destructive-foreground font-semibold"
                                : "bg-blue-50/50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-200"
                            )}>
                              {formatNumber(row.POTONGANSINTESA)}
                            </td>
                            {/* OMSPAN Penundaan */}
                            <td className={cn(
                              "border border-border px-2 py-1.5 text-right align-middle transition-colors",
                              tundaBeda
                                ? "bg-destructive text-destructive-foreground font-semibold"
                                : "bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200"
                            )}>
                              {formatNumber(row.PENUNDAANOMSPAN)}
                            </td>
                            {/* OMSPAN Potongan */}
                            <td className={cn(
                              "border border-border px-2 py-1.5 text-right align-middle transition-colors",
                              potongBeda
                                ? "bg-destructive text-destructive-foreground font-semibold"
                                : "bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200"
                            )}>
                              {formatNumber(row.POTONGANOMSPAN)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Per-akun potongan breakdown */}
              {potonganRows.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Detail Per Akun Potongan
                  </p>
                  <div className="overflow-x-auto rounded-md border border-border">
                    <Table className="text-xs">
                      <TableHeader>
                        <TableRow className="bg-muted/60">
                          <TableHead className="text-center text-xs font-semibold h-8">No</TableHead>
                          <TableHead className="text-center text-xs font-semibold h-8 text-blue-600 dark:text-blue-400">Akun (Sintesa)</TableHead>
                          <TableHead className="text-right text-xs font-semibold h-8 text-blue-600 dark:text-blue-400">Nilai (Sintesa)</TableHead>
                          <TableHead className="text-center text-xs font-semibold h-8 text-amber-600 dark:text-amber-400">Akun (OMSPAN)</TableHead>
                          <TableHead className="text-right text-xs font-semibold h-8 text-amber-600 dark:text-amber-400">Nilai (OMSPAN)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {potonganRows.map((row, idx) => (
                          <TableRow key={`potongan-${idx}`} className="hover:bg-muted/30">
                            <TableCell className="text-center text-muted-foreground tabular-nums">{idx + 1}</TableCell>
                            <TableCell className="text-center font-mono">{row.akun_pusat || "-"}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatNumber(row.nilai_pusat)}</TableCell>
                            <TableCell className="text-center font-mono">
                              {!row.akun_omspan || row.akun_omspan === "0" ? (
                                <span className="text-muted-foreground">-</span>
                              ) : row.akun_omspan}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{formatNumber(row.nilai_omspan)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default RekonDataDetailModal;
