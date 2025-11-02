"use client";

import { useMemo, useState } from "react";
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
import { ChevronLeft, ChevronRight, Download, Edit, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import type { RekapEpaRow, RekapEpaGrandTotal } from "@/types/epa-rekap";
import { UpdateRencanaRealisasiModal } from "@/components/epa/update-rencana-realisasi-modal";

interface RekapDataTableProps {
  data: RekapEpaRow[];
  fullData: RekapEpaRow[];
  grandTotal: RekapEpaGrandTotal | null;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalRows?: number;
  isLoading?: boolean;
  filterOptions?: {
    tahunList: string[];
    triwulanList: string[];
    kementerianList: Array<{ kddept: string; nmdept: string }>;
    jenisBelanjList: Array<{ kdgbkpk: string; nmgbkpk: string }>;
  };
  onUpdateRencanaRealisasi?: (data: {
    thang: string;
    triwulan: string;
    kddept: string;
    kdgbkpk: string;
    rencanaSisaRealisasi: number;
  }) => Promise<void>;
  isUpdateSubmitting?: boolean;
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

const handleExportToExcel = (fullData: RekapEpaRow[], grandTotal: RekapEpaGrandTotal | null) => {
  // Prepare data for Excel export
  const excelData = fullData.map((row, index) => ({
    "No": row.no || index + 1,
    "Tahun": row.thang,
    "Triwulan": row.triwulan,
    "Kode BA": row.kddept,
    "Nama BA": row.nmdept,
    "Kode Jenbel": row.kdgbkpk,
    "Jenis Belanja": row.nmgbkpk,
    "Pagu DIPA": row.pagu,
    "Realisasi": row.realisasi,
    "% Realisasi": formatPercentage(row.persen_realisasi),
    "Sisa Pagu": row.sisa_pagu,
    "Blokir": row.blokir,
    "Sisa Pagu Efektif": row.sisa_pagu_efektif,
    "Pagu Kontrak": row.pagu_kontrak,
    "Realisasi Kontrak": row.realisasi_kontrak,
    "Outstanding Kontrak": row.outstanding_kontrak,
    "Sisa Pagu Efektif Diluar Outs. Kontrak": row.sisa_kontrak_pagu_bersih,
    "Rencana Sisa Realisasi": row.rencana_sisa_realisasi,
  }));

  // Add grand total row if available
  if (grandTotal) {
    const grandTotalPercentage =
      grandTotal.pagu && grandTotal.pagu !== 0
        ? (grandTotal.realisasi / grandTotal.pagu) * 100
        : 0;

    excelData.push({
      "No": 0,
      "Tahun": 0,
      "Triwulan": 0,
      "Kode BA": "",
      "Nama BA": "",
      "Kode Jenbel": "",
      "Jenis Belanja": "Grand Total",
      "Pagu DIPA": grandTotal.pagu,
      "Realisasi": grandTotal.realisasi,
      "% Realisasi": formatPercentage(grandTotalPercentage),
      "Sisa Pagu": grandTotal.sisa_pagu,
      "Blokir": grandTotal.blokir,
      "Sisa Pagu Efektif": grandTotal.sisa_pagu_efektif,
      "Pagu Kontrak": grandTotal.pagu_kontrak,
      "Realisasi Kontrak": grandTotal.realisasi_kontrak,
      "Outstanding Kontrak": grandTotal.outstanding_kontrak,
      "Sisa Pagu Efektif Diluar Outs. Kontrak": grandTotal.sisa_kontrak_pagu_bersih,
      "Rencana Sisa Realisasi": grandTotal.rencana_sisa_realisasi,
    });
  }

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Rekap EPA");

  // Generate filename with timestamp
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[-:T]/g, "");
  const filename = `rekap-epa-${timestamp}.xlsx`;

  // Save file
  XLSX.writeFile(workbook, filename);
};

export function RekapDataTable({
  data,
  fullData,
  grandTotal,
  page,
  totalPages,
  onPageChange,
  totalRows = 0,
  isLoading = false,
  filterOptions,
  onUpdateRencanaRealisasi,
  isUpdateSubmitting = false,
}: RekapDataTableProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isUpdatingRencana, setIsUpdatingRencana] = useState(false);

  const displayGrandTotal = useMemo(() => {
    if (!grandTotal) return null;

    // Calculate percentage for grand total
    const grandTotalPercentage =
      grandTotal.pagu && grandTotal.pagu !== 0
        ? (grandTotal.realisasi / grandTotal.pagu) * 100
        : 0;

    return {
      pagu: formatNumber(grandTotal.pagu),
      realisasi: formatNumber(grandTotal.realisasi),
      persentase_realisasi: formatPercentage(grandTotalPercentage),
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
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                Total Data: - Baris Data
              </div>
              {onUpdateRencanaRealisasi && (
                <div className="h-9 w-[180px] bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              )}
              <Button
                disabled
                variant="default"
                size="sm"
                className="flex items-center gap-2 opacity-50"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 flex flex-col">
            {/* Table Header Skeleton */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 dark:bg-gray-900 p-4 grid grid-cols-18 gap-2">
                {Array(18)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="h-4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"
                    ></div>
                  ))}
              </div>

              {/* Table Rows Skeleton */}
              <div className="space-y-1">
                {Array(5)
                  .fill(0)
                  .map((_, rowIdx) => (
                    <div key={rowIdx} className="border-t p-4 grid grid-cols-18 gap-2 hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      {Array(18)
                        .fill(0)
                        .map((_, colIdx) => (
                          <div
                            key={colIdx}
                            className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"
                          ></div>
                        ))}
                    </div>
                  ))}
              </div>
            </div>

            {/* Pagination Skeleton */}
            <div className="flex items-center justify-between mt-4">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleExportClick = () => {
    if (!fullData || fullData.length === 0) return;

    setIsExporting(true);
    try {
      handleExportToExcel(fullData, grandTotal);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    } finally {
      // Small delay to show the spinner, then reset
      setTimeout(() => {
        setIsExporting(false);
      }, 100);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Data Rekap EPA</CardTitle>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
              Total Data: {totalRows} Baris Data
            </div>
            {onUpdateRencanaRealisasi && (
              <Button
                onClick={() => setIsUpdatingRencana(true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Update Rencana Realisasi
              </Button>
            )}
            <Button
              onClick={handleExportClick}
              disabled={isExporting || !fullData || fullData.length === 0}
              variant="default"
              size="sm"
              className="flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download Excel
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 flex flex-col">
          {/* Scrollable Table Container with sticky header and footer */}
          <div className="border rounded-lg h-[600px] flex flex-col overflow-hidden">
            <div className="flex-1 w-full overflow-auto">
              <div className="min-w-full">
                <table className="w-full min-w-max text-sm">
                  <thead className="bg-muted sticky top-0 z-30">
                    <tr>
                      <th className="p-2 text-center font-medium uppercase w-12 min-w-[50px] whitespace-nowrap">No</th>
                      <th className="p-2 text-center font-medium uppercase w-16 min-w-[60px] whitespace-nowrap">Tahun</th>
                      <th className="p-2 text-center font-medium uppercase w-16 min-w-[60px] whitespace-nowrap">Triwulan</th>
                      <th className="p-2 text-center font-medium uppercase w-20 min-w-[80px] whitespace-nowrap">Kode BA</th>
                      <th className="p-2 text-center font-medium uppercase w-48 min-w-[200px] whitespace-nowrap">Nama BA</th>
                      <th className="p-2 text-center font-medium uppercase w-20 min-w-[80px] whitespace-nowrap">Kode Jenbel</th>
                      <th className="p-2 text-center font-medium uppercase w-48 min-w-[200px] whitespace-nowrap">Jenis Belanja</th>
                      <th className="p-2 text-center font-medium uppercase w-32 min-w-[130px] whitespace-nowrap">Pagu DIPA</th>
                      <th className="p-2 text-center font-medium uppercase w-32 min-w-[130px] whitespace-nowrap">Realisasi</th>
                      <th className="p-2 text-center font-medium uppercase w-24 min-w-[100px] whitespace-nowrap">% Real</th>
                      <th className="p-2 text-center font-medium uppercase w-32 min-w-[130px] whitespace-nowrap">Sisa Pagu</th>
                      <th className="p-2 text-center font-medium uppercase w-24 min-w-[100px] whitespace-nowrap">Blokir</th>
                      <th className="p-2 text-center font-medium uppercase w-32 min-w-[130px] whitespace-nowrap">Sisa Pagu Efektif</th>
                      <th className="p-2 text-center font-medium uppercase w-32 min-w-[130px] whitespace-nowrap">Pagu Kontrak</th>
                      <th className="p-2 text-center font-medium uppercase w-32 min-w-[130px] whitespace-nowrap">Realisasi Kontrak</th>
                      <th className="p-2 text-center font-medium uppercase w-32 min-w-[130px] whitespace-nowrap">Outs. Kontrak</th>
                      <th className="p-2 text-center font-medium uppercase w-48 min-w-[200px] whitespace-nowrap">Sis Pagu Efektif Diluar Outs. Kontrak</th>
                      <th className="p-2 text-center font-medium uppercase w-32 min-w-[130px] whitespace-nowrap">Rencana Sisa Realisasi</th>
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
                            <td className="p-2 text-left w-48 min-w-[200px] whitespace-nowrap">{row.nmdept}</td>
                            <td className="p-2 text-center w-20 min-w-[80px] whitespace-nowrap">{row.kdgbkpk}</td>
                            <td className="p-2 text-left w-48 min-w-[200px] whitespace-nowrap">{row.nmgbkpk}</td>
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
                            <td className="p-2 text-right font-mono w-24 min-w-[100px] whitespace-nowrap">{displayGrandTotal.persentase_realisasi}</td>
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

      {/* Update Rencana Realisasi Modal */}
      {onUpdateRencanaRealisasi && (
        <UpdateRencanaRealisasiModal
          open={isUpdatingRencana}
          onOpenChange={setIsUpdatingRencana}
          filterOptions={filterOptions}
          onSubmit={onUpdateRencanaRealisasi}
          isSubmitting={isUpdateSubmitting}
        />
      )}
    </Card>
  );
}
