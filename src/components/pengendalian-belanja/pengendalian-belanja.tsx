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
import { DonutChartComponent } from "@/components/ui/donut-chart";
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

      {/* Realisasi Donut Charts */}
      {!loading && data.length > 0 && (() => {
        // Explicit Number() conversion: backend ROUND() may return strings
        const n = (v: unknown) => (isNaN(Number(v)) ? 0 : Number(v));

        const totalPagu       = data.reduce((s, r) => s + n(r.pagu_dipa), 0);
        const totalRealisasi  = data.reduce((s, r) => s + n(r.realisasi_basis_kas), 0);
        const totalOutsKontrak = data.reduce((s, r) => s + n(r.outs_kontrak), 0);
        const totalOutsUptup  = data.reduce((s, r) => s + n(r.outs_uptup), 0);

        const kasPct = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;
        const akrualNumerator = totalRealisasi + totalOutsKontrak + totalOutsUptup;
        const akrualPct = totalPagu > 0 ? (akrualNumerator / totalPagu) * 100 : 0;

        const sisaKas    = Math.max(1, Math.round(totalPagu - totalRealisasi));
        const sisaAkrual = Math.max(1, Math.round(totalPagu - akrualNumerator));

        const kasChartData = [
          { name: "Realisasi Kas", value: Math.max(1, Math.round(totalRealisasi)) },
          { name: "Sisa", value: sisaKas },
        ];

        const akrualChartData = [
          { name: "Realisasi Kas", value: Math.max(1, Math.round(totalRealisasi)) },
          { name: "Outstanding Kontrak", value: Math.max(1, Math.round(totalOutsKontrak)) },
          { name: "Outstanding UP/TUP", value: Math.max(1, Math.round(totalOutsUptup)) },
          { name: "Sisa", value: sisaAkrual },
        ];

        // Format nominal: miliar dengan 2 desimal
        const fmtT = (v: number) => {
          if (Math.abs(v) >= 1_000_000_000_000)
            return `Rp ${(v / 1_000_000_000_000).toFixed(2)} T`;
          if (Math.abs(v) >= 1_000_000_000)
            return `Rp ${(v / 1_000_000_000).toFixed(2)} M`;
          if (Math.abs(v) >= 1_000_000)
            return `Rp ${(v / 1_000_000).toFixed(2)} Jt`;
          return `Rp ${v.toLocaleString("id-ID")}`;
        };

        const sisaKasNominal    = totalPagu - totalRealisasi;
        const sisaAkrualNominal = totalPagu - akrualNumerator;

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kas Basis */}
            <Card className="border shadow-sm">
              <CardContent className="py-4 px-4">
                <p className="text-sm font-semibold text-muted-foreground text-center mb-3 uppercase tracking-wide">
                  Realisasi Kas Basis
                </p>
                <div className="flex items-stretch gap-4 min-h-[200px]">
                  {/* Chart — takes half the card width */}
                  <div className="relative w-1/2 flex-shrink-0">
                    <DonutChartComponent
                      data={kasChartData}
                      height={200}
                      colors={["#10b981", "#e5e7eb"]}
                      showLegend={false}
                      showLabel={false}
                      innerRadius="58%"
                      outerRadius="82%"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-extrabold text-foreground leading-none">
                        {kasPct.toFixed(1)}%
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">dari Pagu</span>
                    </div>
                  </div>
                  {/* Nominal breakdown — takes other half */}
                  <div className="w-1/2 flex flex-col justify-center space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="mt-1 inline-block w-3 h-3 flex-shrink-0 rounded-full bg-blue-500" />
                      <div>
                        <p className="text-xs text-muted-foreground leading-tight">Pagu DIPA</p>
                        <p className="text-sm font-bold font-mono text-blue-600">{fmtT(totalPagu)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-1 inline-block w-3 h-3 flex-shrink-0 rounded-full bg-emerald-500" />
                      <div>
                        <p className="text-xs text-muted-foreground leading-tight">Realisasi Kas</p>
                        <p className="text-sm font-bold font-mono text-emerald-600">{fmtT(totalRealisasi)}</p>
                      </div>
                    </div>
                    <div className="border-t border-border/40 pt-2">
                      <div className="flex items-start gap-2">
                        <span className="mt-1 inline-block w-3 h-3 flex-shrink-0 rounded-full bg-gray-400 dark:bg-gray-500" />
                        <div>
                          <p className="text-xs text-muted-foreground leading-tight">Sisa Pagu</p>
                          <p className={`text-sm font-bold font-mono ${sisaKasNominal < 0 ? "text-red-500" : "text-gray-500"}`}>
                            {fmtT(sisaKasNominal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Akrual Basis */}
            <Card className="border shadow-sm">
              <CardContent className="py-4 px-4">
                <p className="text-sm font-semibold text-muted-foreground text-center mb-3 uppercase tracking-wide">
                  Realisasi Akrual Basis
                </p>
                <div className="flex items-stretch gap-4 min-h-[200px]">
                  {/* Chart — takes half the card width */}
                  <div className="relative w-1/2 flex-shrink-0">
                    <DonutChartComponent
                      data={akrualChartData}
                      height={200}
                      colors={["#10b981", "#6366f1", "#f59e0b", "#e5e7eb"]}
                      showLegend={false}
                      showLabel={false}
                      innerRadius="58%"
                      outerRadius="82%"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-extrabold text-foreground leading-none">
                        {akrualPct.toFixed(1)}%
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">dari Pagu</span>
                    </div>
                  </div>
                  {/* Nominal breakdown — takes other half */}
                  <div className="w-1/2 flex flex-col justify-center space-y-2.5">
                    <div className="flex items-start gap-2">
                      <span className="mt-1 inline-block w-3 h-3 flex-shrink-0 rounded-full bg-blue-500" />
                      <div>
                        <p className="text-xs text-muted-foreground leading-tight">Pagu DIPA</p>
                        <p className="text-sm font-bold font-mono text-blue-600">{fmtT(totalPagu)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-1 inline-block w-3 h-3 flex-shrink-0 rounded-full bg-emerald-500" />
                      <div>
                        <p className="text-xs text-muted-foreground leading-tight">Realisasi Kas</p>
                        <p className="text-sm font-bold font-mono text-emerald-600">{fmtT(totalRealisasi)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-1 inline-block w-3 h-3 flex-shrink-0 rounded-full bg-indigo-500" />
                      <div>
                        <p className="text-xs text-muted-foreground leading-tight">Outs. Kontrak</p>
                        <p className="text-sm font-bold font-mono text-indigo-600">{fmtT(totalOutsKontrak)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-1 inline-block w-3 h-3 flex-shrink-0 rounded-full bg-amber-500" />
                      <div>
                        <p className="text-xs text-muted-foreground leading-tight">Outs. UP/TUP</p>
                        <p className="text-sm font-bold font-mono text-amber-600">{fmtT(totalOutsUptup)}</p>
                      </div>
                    </div>
                    <div className="border-t border-border/40 pt-2">
                      <div className="flex items-start gap-2">
                        <span className="mt-1 inline-block w-3 h-3 flex-shrink-0 rounded-full bg-gray-400 dark:bg-gray-500" />
                        <div>
                          <p className="text-xs text-muted-foreground leading-tight">Sisa Pagu</p>
                          <p className={`text-sm font-bold font-mono ${sisaAkrualNominal < 0 ? "text-red-500" : "text-gray-500"}`}>
                            {fmtT(sisaAkrualNominal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

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
