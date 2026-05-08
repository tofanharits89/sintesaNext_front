"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { toast } from "sonner";
import { http } from "@/lib/api/httpClient";
import { DataTable } from "@/components/ui/data-table";
import FilterCard, { FilterResult } from "./filter-card";
import { columns, PengendalianBelanjaRow } from "./columns";

/**
 * Helper function to download JSON data as Excel
 */
function downloadExcel(data: any[], fileName: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  
  // Auto-size columns (rough estimation)
  const maxWidths = data.reduce((acc, row) => {
    Object.keys(row).forEach((key, i) => {
      const val = row[key] ? String(row[key]) : "";
      acc[i] = Math.max(acc[i] || 0, val.length, key.length);
    });
    return acc;
  }, [] as number[]);
  
  worksheet["!cols"] = maxWidths.map((w: number) => ({ wch: w + 2 }));

  XLSX.writeFile(workbook, fileName);
}

export default function PengendalianBelanja() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<PengendalianBelanjaRow[]>([]);
  const [filter, setFilter] = useState<FilterResult>({
    tahun: String(new Date().getFullYear()),
    kddept: "00",
    exclude999: false,
  });

  const fetchData = async (f: FilterResult, bustCache = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.tahun) params.set("tahun", f.tahun);
      if (f.kddept && f.kddept !== "00") params.set("kddept", f.kddept);
      if (f.exclude999) params.set("exclude999", "true");
      if (bustCache) params.set("_t", String(Date.now()));

      const res = await http.get(
        `/api/v1/pengendalian-belanja${params.toString() ? `?${params}` : ""}`,
      );
      setData(res.data?.result ?? []);
    } catch (err: any) {
      toast.error(
        err?.message || "Terjadi Permasalahan Koneksi atau Server Backend",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(filter, true);
  };

  const handleDownloadExcel = () => {
    if (!data || data.length === 0) {
      toast.error("Tidak ada data untuk diunduh");
      return;
    }

    // Format data for Excel with friendly headers
    const excelData = data.map((row, index) => ({
      "No.": index + 1,
      "Kode BA": row.kode_ba,
      "Nama BA": row.nama_ba,
      "Pagu DIPA": row.pagu_dipa,
      "Blokir": row.blokir,
      "Pagu DIPA Efektif": row.pagu_dipa_efektif,
      "Realisasi Basis Kas": row.realisasi_basis_kas,
      "Outstanding Kontrak": row.outs_kontrak,
      "Outstanding UP/TUP": row.outs_uptup,
      "Total Kas & Outstanding": row.total_kas_dan_outstanding,
      "Belum SP2D": row.belum_sp2d,
      "Nilai SPP/SPM": row.nilai_spp_spm,
      "Sisa Pagu Efektif": row.sisa_pagu_efektif,
    }));

    const fileName = `Pengendalian_Belanja_${filter.tahun}_${new Date().getTime()}.xlsx`;
    downloadExcel(excelData, fileName);
    toast.success("Data berhasil diunduh");
  };

  useEffect(() => {
    fetchData(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (f: FilterResult) => {
    setFilter(f);
    fetchData(f);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard Pengendalian Belanja
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitoring pagu, realisasi, kontrak, dan outstanding per
            Kementerian/Lembaga.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 bg-green-700 dark:bg-card hover:bg-green-600 text-white dark:text-green-500 hover:text-white flex items-center"
            onClick={handleDownloadExcel}
            disabled={loading || data.length === 0}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Unduh Data Excel
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 self-start sm:self-auto"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            title="Refresh"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Filter Card */}
      <FilterCard onFilter={handleFilter} />

      {/* Data Table */}
      <section>
        <Card className="border shadow-sm">
          <CardContent className="px-8 py-4">
            {loading ? (
              <div className="p-2">
                <TableSkeleton rows={10} />
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={data}
                initialPageSize={10}
                showFooter={true}
              />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
