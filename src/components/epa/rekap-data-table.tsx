"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { RekapEpaRow, RekapEpaGrandTotal } from "@/types/epa-rekap";

interface RekapDataTableProps {
  data: RekapEpaRow[];
  grandTotal: RekapEpaGrandTotal | null;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalRows?: number;
  isLoading?: boolean;
}

const formatNumber = (num: any) => {
  if (num === null || num === undefined || num === "") return "-";
  const parsed = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(parsed)) return "-";
  return new Intl.NumberFormat("id-ID").format(Math.round(parsed));
};

const formatPercentage = (num: any) => {
  if (num === null || num === undefined || num === "") return "-";
  const parsed = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(parsed)) return "-";
  return `${(parsed || 0).toFixed(2)}%`;
};

export function RekapDataTable({
  data,
  grandTotal,
  page,
  totalPages,
  onPageChange,
  totalRows = 0,
  isLoading = false,
}: RekapDataTableProps) {
  const displayGrandTotal = useMemo(() => {
    if (!grandTotal) return null;
    return {
      pagu: formatNumber(grandTotal.pagu),
      realisasi: formatNumber(grandTotal.realisasi),
      sisa_pagu: formatNumber(grandTotal.sisa_pagu),
      blokir: formatNumber(grandTotal.blokir),
      sisa_pagu_efektif: formatNumber(grandTotal.sisa_pagu_efektif),
      pagu_kontrak: formatNumber(grandTotal.pagu_kontrak),
      realisasi_kontrak: formatNumber(grandTotal.realisasi_kontrak),
      outstanding_kontrak: formatNumber(grandTotal.outstanding_kontrak),
      sisa_kontrak_pagu_bersih: formatNumber(grandTotal.sisa_kontrak_pagu_bersih),
      rencana_sisa_realisasi: formatNumber(grandTotal.rencana_sisa_realisasi),
    };
  }, [grandTotal]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Data Rekap EPA</CardTitle>
            <div className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
              Total Data: {totalRows} Baris Data
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
              ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Data Rekap EPA</CardTitle>
          <div className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
            Total Data: {totalRows} Baris Data
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 flex flex-col">
          {/* Scrollable Table Container with sticky header and footer */}
          <div className="border rounded-lg h-[600px] flex flex-col overflow-hidden">
            <div className="flex-1 w-full overflow-auto">
              <div className="min-w-full">
                <table className="w-full min-w-max text-xs">
                  <thead className="bg-muted sticky top-0 z-30">
                    <tr>
                      <th className="p-2 text-center font-medium w-12 min-w-[50px] whitespace-nowrap">No</th>
                      <th className="p-2 text-center font-medium w-16 min-w-[60px] whitespace-nowrap">Tahun</th>
                      <th className="p-2 text-center font-medium w-16 min-w-[60px] whitespace-nowrap">Triwulan</th>
                      <th className="p-2 text-center font-medium w-20 min-w-[80px] whitespace-nowrap">Kode BA</th>
                      <th className="p-2 text-left font-medium w-48 min-w-[200px] whitespace-nowrap">Nama BA</th>
                      <th className="p-2 text-center font-medium w-20 min-w-[80px] whitespace-nowrap">Kode Jenbel</th>
                      <th className="p-2 text-left font-medium w-48 min-w-[200px] whitespace-nowrap">Jenis Belanja</th>
                      <th className="p-2 text-right font-medium w-32 min-w-[130px] whitespace-nowrap">Pagu DIPA</th>
                      <th className="p-2 text-right font-medium w-32 min-w-[130px] whitespace-nowrap">Realisasi</th>
                      <th className="p-2 text-right font-medium w-24 min-w-[100px] whitespace-nowrap">% Real</th>
                      <th className="p-2 text-right font-medium w-32 min-w-[130px] whitespace-nowrap">Sisa Pagu</th>
                      <th className="p-2 text-right font-medium w-24 min-w-[100px] whitespace-nowrap">Blokir</th>
                      <th className="p-2 text-right font-medium w-32 min-w-[130px] whitespace-nowrap">Sisa Pagu Efektif</th>
                      <th className="p-2 text-right font-medium w-32 min-w-[130px] whitespace-nowrap">Pagu Kontrak</th>
                      <th className="p-2 text-right font-medium w-32 min-w-[130px] whitespace-nowrap">Realisasi Kontrak</th>
                      <th className="p-2 text-right font-medium w-32 min-w-[130px] whitespace-nowrap">Outs. Kontrak</th>
                      <th className="p-2 text-right font-medium w-48 min-w-[200px] whitespace-nowrap">Sis Pagu Efektif Diluar Outs. Kontrak</th>
                      <th className="p-2 text-right font-medium w-32 min-w-[130px] whitespace-nowrap">Rencana Sisa Realisasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan={18} className="text-center py-8 text-muted-foreground">
                          Tidak ada data tersedia
                        </td>
                      </tr>
                    ) : (
                      <>
                        {data.map((row, idx) => (
                          <tr key={idx} className="border-t hover:bg-muted/50">
                            <td className="p-2 text-center w-12 min-w-[50px] whitespace-nowrap">{row.no}</td>
                            <td className="p-2 text-center w-16 min-w-[60px] whitespace-nowrap">{row.thang}</td>
                            <td className="p-2 text-center w-16 min-w-[60px] whitespace-nowrap">{row.triwulan}</td>
                            <td className="p-2 text-center w-20 min-w-[80px] whitespace-nowrap">{row.kddept}</td>
                            <td className="p-2 text-left text-xs w-48 min-w-[200px] whitespace-nowrap">{row.nmdept}</td>
                            <td className="p-2 text-center w-20 min-w-[80px] whitespace-nowrap">{row.kdgbkpk}</td>
                            <td className="p-2 text-left text-xs w-48 min-w-[200px] whitespace-nowrap">{row.nmgbkpk}</td>
                            <td className="p-2 text-right font-mono w-32 min-w-[130px] whitespace-nowrap">{formatNumber(row.pagu)}</td>
                            <td className="p-2 text-right font-mono w-32 min-w-[130px] whitespace-nowrap">{formatNumber(row.realisasi)}</td>
                            <td className="p-2 text-right font-mono w-24 min-w-[100px] whitespace-nowrap">{formatPercentage(row.persen_realisasi)}</td>
                            <td className="p-2 text-right font-mono w-32 min-w-[130px] whitespace-nowrap">{formatNumber(row.sisa_pagu)}</td>
                            <td className="p-2 text-right font-mono w-24 min-w-[100px] whitespace-nowrap">{formatNumber(row.blokir)}</td>
                            <td className="p-2 text-right font-mono w-32 min-w-[130px] whitespace-nowrap">{formatNumber(row.sisa_pagu_efektif)}</td>
                            <td className="p-2 text-right font-mono w-32 min-w-[130px] whitespace-nowrap">{formatNumber(row.pagu_kontrak)}</td>
                            <td className="p-2 text-right font-mono w-32 min-w-[130px] whitespace-nowrap">{formatNumber(row.realisasi_kontrak)}</td>
                            <td className="p-2 text-right font-mono w-32 min-w-[130px] whitespace-nowrap">{formatNumber(row.outstanding_kontrak)}</td>
                            <td className="p-2 text-right font-mono w-48 min-w-[200px] whitespace-nowrap">{formatNumber(row.sisa_kontrak_pagu_bersih)}</td>
                            <td className="p-2 text-right font-mono w-32 min-w-[130px] whitespace-nowrap">{formatNumber(row.rencana_sisa_realisasi)}</td>
                          </tr>
                        ))}
                        
                        {/* Sticky Grand Total Row */}
                        {displayGrandTotal && (
                          <tr className="border-t-2 border-t-primary bg-muted font-bold sticky bottom-0 z-20">
                            <td className="p-2 text-center w-12 min-w-[50px] whitespace-nowrap">-</td>
                            <td colSpan={6} className="p-2 text-left font-medium whitespace-nowrap">Grand Total</td>
                            <td className="p-2 text-right font-mono w-32 min-w-[130px] whitespace-nowrap">{displayGrandTotal.pagu}</td>
                            <td className="p-2 text-right font-mono w-32 min-w-[130px] whitespace-nowrap">{displayGrandTotal.realisasi}</td>
                            <td className="p-2 text-right font-mono w-24 min-w-[100px] whitespace-nowrap">-</td>
                            <td className="p-2 text-right font-mono w-32 min-w-[130px] whitespace-nowrap">{displayGrandTotal.sisa_pagu}</td>
                            <td className="p-2 text-right font-mono w-24 min-w-[100px] whitespace-nowrap">{displayGrandTotal.blokir}</td>
                            <td className="p-2 text-right font-mono w-32 min-w-[130px] whitespace-nowrap">{displayGrandTotal.sisa_pagu_efektif}</td>
                            <td className="p-2 text-right font-mono w-32 min-w-[130px] whitespace-nowrap">{displayGrandTotal.pagu_kontrak}</td>
                            <td className="p-2 text-right font-mono w-32 min-w-[130px] whitespace-nowrap">{displayGrandTotal.realisasi_kontrak}</td>
                            <td className="p-2 text-right font-mono w-32 min-w-[130px] whitespace-nowrap">{displayGrandTotal.outstanding_kontrak}</td>
                            <td className="p-2 text-right font-mono w-48 min-w-[200px] whitespace-nowrap">{displayGrandTotal.sisa_kontrak_pagu_bersih}</td>
                            <td className="p-2 text-right font-mono w-32 min-w-[130px] whitespace-nowrap">{displayGrandTotal.rencana_sisa_realisasi}</td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground font-medium">
              Halaman {page} dari {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
