"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/animate-ui/components/radix/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      <DialogContent
        showCloseButton={false}
        className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden"
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <GitCompareArrows className="h-4 w-4 text-emerald-600 shrink-0" />
            Rekonsilisasi DAU &mdash; Sintesa vs OMSPAN TKD
          </DialogTitle>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="outline">
              TA {thang}
            </Badge>
            <Badge variant="outline">
              KPPN {kdkppn}
            </Badge>
            <Badge variant="outline">
              Pemda {kdpemda}
            </Badge>
            <Badge variant="outline">
              Bulan {bulan}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Memuat data rekon...</p>
            </div>
          ) : errorDetail ? (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {String((errorDetail as Error).message || errorDetail)}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="overflow-x-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/60 hover:bg-muted/60">
                      <TableHead rowSpan={2} className="h-12 border-b text-center align-middle font-medium whitespace-nowrap">KPPN</TableHead>
                      <TableHead rowSpan={2} className="h-12 border-b text-center align-middle font-medium whitespace-nowrap">Pemda</TableHead>
                      <TableHead rowSpan={2} className="h-12 border-b text-center align-middle font-medium whitespace-nowrap">Bulan</TableHead>
                      <TableHead rowSpan={2} className="h-12 border-b text-center align-middle font-medium whitespace-nowrap">Alokasi</TableHead>
                      <TableHead colSpan={2} className="h-12 border-b bg-blue-50 text-center font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                        Sintesa
                      </TableHead>
                      <TableHead colSpan={2} className="h-12 border-b bg-amber-50 text-center font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                        OMSPAN
                      </TableHead>
                    </TableRow>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="h-10 text-center font-medium text-blue-600 dark:text-blue-400">Penundaan</TableHead>
                      <TableHead className="h-10 text-center font-medium text-blue-600 dark:text-blue-400">Potongan</TableHead>
                      <TableHead className="h-10 text-center font-medium text-amber-600 dark:text-amber-400">Penundaan</TableHead>
                      <TableHead className="h-10 text-center font-medium text-amber-600 dark:text-amber-400">Potongan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                          Tidak ada data untuk parameter yang dipilih
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayData.map((row, idx) => {
                        const tundaBeda = row.PENUNDAANOMSPAN !== row.TUNDASINTESA;
                        const potongBeda = row.POTONGANOMSPAN !== row.POTONGANSINTESA;
                        return (
                          <TableRow key={idx} className="hover:bg-muted/30">
                            <TableCell className="text-center align-middle">
                              <div className="space-y-0.5">
                                <div className="font-medium">{row.KDKPPN}</div>
                                <div className="text-xs text-muted-foreground">{row.NMKPPN}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center align-middle">
                              <div className="space-y-0.5">
                                <div className="font-medium">{row.KDPEMDA}</div>
                                <div className="text-xs text-muted-foreground">{row.NMPEMDA}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center align-middle whitespace-nowrap">
                              {row.NMBULAN}
                            </TableCell>
                            <TableCell className="text-right align-middle font-mono tabular-nums">
                              {formatNumber(row.ALOKASI_BULAN)}
                            </TableCell>
                            <TableCell className={cn(
                              "text-right align-middle font-mono tabular-nums transition-colors",
                              tundaBeda
                                ? "bg-destructive text-destructive-foreground font-semibold"
                                : "bg-blue-50/50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-200"
                            )}>
                              {formatNumber(row.TUNDASINTESA)}
                            </TableCell>
                            <TableCell className={cn(
                              "text-right align-middle font-mono tabular-nums transition-colors",
                              potongBeda
                                ? "bg-destructive text-destructive-foreground font-semibold"
                                : "bg-blue-50/50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-200"
                            )}>
                              {formatNumber(row.POTONGANSINTESA)}
                            </TableCell>
                            <TableCell className={cn(
                              "text-right align-middle font-mono tabular-nums transition-colors",
                              tundaBeda
                                ? "bg-destructive text-destructive-foreground font-semibold"
                                : "bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200"
                            )}>
                              {formatNumber(row.PENUNDAANOMSPAN)}
                            </TableCell>
                            <TableCell className={cn(
                              "text-right align-middle font-mono tabular-nums transition-colors",
                              potongBeda
                                ? "bg-destructive text-destructive-foreground font-semibold"
                                : "bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200"
                            )}>
                              {formatNumber(row.POTONGANOMSPAN)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {potonganRows.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Detail Per Akun Potongan
                  </p>
                  <div className="overflow-x-auto rounded-md border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/60 hover:bg-muted/60">
                          <TableHead className="h-10 text-center font-medium">No</TableHead>
                          <TableHead className="h-10 text-center font-medium text-blue-600 dark:text-blue-400">Akun (Sintesa)</TableHead>
                          <TableHead className="h-10 text-right font-medium text-blue-600 dark:text-blue-400">Nilai (Sintesa)</TableHead>
                          <TableHead className="h-10 text-center font-medium text-amber-600 dark:text-amber-400">Akun (OMSPAN)</TableHead>
                          <TableHead className="h-10 text-right font-medium text-amber-600 dark:text-amber-400">Nilai (OMSPAN)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {potonganRows.map((row, idx) => (
                          <TableRow key={`potongan-${idx}`} className="hover:bg-muted/30">
                            <TableCell className="text-center">{idx + 1}</TableCell>
                            <TableCell className="text-center font-mono">{row.akun_pusat || "-"}</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{formatNumber(row.nilai_pusat)}</TableCell>
                            <TableCell className="text-center font-mono">
                              {!row.akun_omspan || row.akun_omspan === "0" ? (
                                <span className="text-muted-foreground">-</span>
                              ) : row.akun_omspan}
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{formatNumber(row.nilai_omspan)}</TableCell>
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
        <DialogFooter className="p-6 pt-4 gap-2 sm:justify-end">
          <Button onClick={() => onOpenChange(false)} className="min-w-24">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RekonDataDetailModal;
