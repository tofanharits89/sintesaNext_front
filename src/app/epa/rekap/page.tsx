"use client";

import { useState, useCallback, useMemo } from "react";
import { RekapFilterCard } from "@/components/epa/rekap-filter-card";
import { RekapDataTable } from "@/components/epa/rekap-data-table";
import { useRekapEpaData } from "@/hooks/use-rekap-epa-data";
import { useRekapEpaFilterState } from "@/hooks/use-rekap-epa-filters";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { RekapEpaFilters } from "@/types/epa-rekap";

const ROWS_PER_PAGE = 50;

export default function RekapEpaPage() {
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<RekapEpaFilters>({
    tahun: null,
    triwulan: null,
    kddept: null,
    kdgbkpk: null,
  });

  const { filters, updateFilter, resetFilters, setAllFilters } = useRekapEpaFilterState();

  // Fetch data with applied filters
  const { data, isFetching, error, refetch } = useRekapEpaData(appliedFilters, page, ROWS_PER_PAGE);

  const handleRefreshData = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const handleResetFilters = useCallback(() => {
    resetFilters();
    setPage(1);
    setAppliedFilters({
      tahun: null,
      triwulan: null,
      kddept: null,
      kdgbkpk: null,
    });
  }, [resetFilters]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const filteredData = useMemo(() => {
    let result = data?.data || [];
    console.log("[RekapEpaPage] Raw data:", result.length, "rows");

    // Apply client-side filtering
    result = result.filter((row) => {
      if (appliedFilters.tahun && row.thang?.toString() !== appliedFilters.tahun) return false;
      if (appliedFilters.triwulan && row.triwulan?.toString() !== appliedFilters.triwulan) return false;
      if (appliedFilters.kddept && row.kddept !== appliedFilters.kddept) return false;
      if (appliedFilters.kdgbkpk && row.kdgbkpk !== appliedFilters.kdgbkpk) return false;
      return true;
    });
    
    console.log("[RekapEpaPage] Filtered data:", result.length, "rows");
    return result;
  }, [data?.data, appliedFilters]);

  const tableData = useMemo(() => {
    // Apply pagination to filtered data
    const startIdx = (page - 1) * ROWS_PER_PAGE;
    const endIdx = startIdx + ROWS_PER_PAGE;
    return filteredData.slice(startIdx, endIdx);
  }, [filteredData, page]);

  const grandTotal = useMemo(() => {
    if (filteredData.length === 0) return null;

    // Calculate grand total from ALL filtered data (not just current page)
    const totals = {
      pagu: 0,
      realisasi: 0,
      sisa_pagu: 0,
      blokir: 0,
      sisa_pagu_efektif: 0,
      pagu_kontrak: 0,
      realisasi_kontrak: 0,
      outstanding_kontrak: 0,
      sisa_kontrak_pagu_bersih: 0,
      rencana_sisa_realisasi: 0,
    };

    filteredData.forEach((row) => {
      totals.pagu += parseFloat(row.pagu?.toString() || "0") || 0;
      totals.realisasi += parseFloat(row.realisasi?.toString() || "0") || 0;
      totals.sisa_pagu += parseFloat(row.sisa_pagu?.toString() || "0") || 0;
      totals.blokir += parseFloat(row.blokir?.toString() || "0") || 0;
      totals.sisa_pagu_efektif += parseFloat(row.sisa_pagu_efektif?.toString() || "0") || 0;
      totals.pagu_kontrak += parseFloat(row.pagu_kontrak?.toString() || "0") || 0;
      totals.realisasi_kontrak += parseFloat(row.realisasi_kontrak?.toString() || "0") || 0;
      totals.outstanding_kontrak += parseFloat(row.outstanding_kontrak?.toString() || "0") || 0;
      totals.sisa_kontrak_pagu_bersih += parseFloat(row.sisa_kontrak_pagu_bersih?.toString() || "0") || 0;
      totals.rencana_sisa_realisasi += parseFloat(row.rencana_sisa_realisasi?.toString() || "0") || 0;
    });

    console.log("[RekapEpaPage] Calculated grandTotal:", totals);
    return totals;
  }, [filteredData]);

  const totalPages = useMemo(() => {
    const totalRows = filteredData.length;
    const pages = Math.ceil(totalRows / ROWS_PER_PAGE) || 1;
    console.log("[RekapEpaPage] totalPages:", pages, "from", totalRows, "rows");
    return pages;
  }, [filteredData.length]);

  console.log("[RekapEpaPage] Full data object:", data);

  // Extract filter options from fetched data (client-side)
  const filterOptions = useMemo(() => {
    const rawData = data?.data || [];
    
    const tahunSet = new Set<string>();
    const triwulanSet = new Set<string>();
    const kementerianMap = new Map<string, string>();
    const jenisBelanjMap = new Map<string, string>();

    rawData.forEach((row) => {
      if (row.thang) tahunSet.add(row.thang.toString());
      if (row.triwulan) triwulanSet.add(row.triwulan.toString());
      if (row.kddept && row.nmdept) kementerianMap.set(row.kddept, row.nmdept);
      if (row.kdgbkpk && row.nmgbkpk) jenisBelanjMap.set(row.kdgbkpk, row.nmgbkpk);
    });

    return {
      data: {
        tahunList: Array.from(tahunSet).sort(),
        triwulanList: Array.from(triwulanSet).sort(),
        kementerianList: Array.from(kementerianMap).map(([kddept, nmdept]) => ({ kddept, nmdept })),
        jenisBelanjList: Array.from(jenisBelanjMap).map(([kdgbkpk, nmgbkpk]) => ({ kdgbkpk, nmgbkpk })),
      }
    };
  }, [data?.data]);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rekap EPA</h1>
          <p className="text-sm text-muted-foreground">
            Data rekapitulasi EPA (Evaluasi Pelaksanaan Anggaran)
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && !isFetching && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Gagal memuat data: {error instanceof Error ? error.message : 'Silakan coba lagi.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Filter Card */}
      <RekapFilterCard
        filters={filters}
        onFiltersChange={(newFilters) => {
          setIsApplying(true);
          setAllFilters(newFilters);
          setPage(1);
          setAppliedFilters(newFilters);
          setTimeout(() => {
            setIsApplying(false);
          }, 300);
        }}
        onReset={handleResetFilters}
        onRefresh={handleRefreshData}
        filterOptions={filterOptions.data}
        isRefreshing={isRefreshing}
        isApplying={isApplying}
      />

      {/* Data Table */}
      <RekapDataTable
        data={tableData}
        grandTotal={grandTotal}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        isLoading={isFetching}
      />
    </div>
  );
}

export const dynamic = "force-dynamic";
