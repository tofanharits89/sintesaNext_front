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
  const [isResetting, setIsResetting] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<RekapEpaFilters>({
    tahun: "all",
    triwulan: "all",
    kddept: "all",
    kdgbkpk: "all",
  });

  const { filters, updateFilter, resetFilters, setAllFilters } = useRekapEpaFilterState();

  // Fetch data with applied filters
  const { data, isFetching, error, refetch } = useRekapEpaData(appliedFilters, page, ROWS_PER_PAGE);

  const handleRefreshData = useCallback(async () => {
    setIsRefreshing(true);
    resetFilters();
    setPage(1);
    setCurrentLocalFilters({
      tahun: "all",
      triwulan: "all",
      kddept: "all",
      kdgbkpk: "all",
    });
    setAppliedFilters({
      tahun: "all",
      triwulan: "all",
      kddept: "all",
      kdgbkpk: "all",
    });
    await refetch();
    setIsRefreshing(false);
  }, [refetch, resetFilters]);

  const handleResetFilters = useCallback(() => {
    setIsResetting(true);
    resetFilters();
    setPage(1);
    setCurrentLocalFilters({
      tahun: "all",
      triwulan: "all",
      kddept: "all",
      kdgbkpk: "all",
    });
    setAppliedFilters({
      tahun: "all",
      triwulan: "all",
      kddept: "all",
      kdgbkpk: "all",
    });
    setTimeout(() => {
      setIsResetting(false);
    }, 300);
  }, [resetFilters]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const filteredData = useMemo(() => {
    let result = data?.data || [];
    console.log("[RekapEpaPage] Raw data:", result.length, "rows");

    // Apply client-side filtering ("all" means no filter - show all)
    result = result.filter((row) => {
      if (appliedFilters.tahun && appliedFilters.tahun !== "all" && row.thang?.toString() !== appliedFilters.tahun) return false;
      if (appliedFilters.triwulan && appliedFilters.triwulan !== "all" && row.triwulan?.toString() !== appliedFilters.triwulan) return false;
      if (appliedFilters.kddept && appliedFilters.kddept !== "all" && row.kddept !== appliedFilters.kddept) return false;
      if (appliedFilters.kdgbkpk && appliedFilters.kdgbkpk !== "all" && row.kdgbkpk !== appliedFilters.kdgbkpk) return false;
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

  const [currentLocalFilters, setCurrentLocalFilters] = useState<RekapEpaFilters>({
    tahun: "all",
    triwulan: "all",
    kddept: "all",
    kdgbkpk: "all",
  });

  // Extract filter options from fetched data with hierarchical filtering (client-side)
  const filterOptions = useMemo(() => {
    let rawData = data?.data || [];
    
    // Filter data based on current local filter selections for hierarchical options
    rawData = rawData.filter((row) => {
      if (currentLocalFilters.tahun && currentLocalFilters.tahun !== "all" && row.thang?.toString() !== currentLocalFilters.tahun) return false;
      if (currentLocalFilters.triwulan && currentLocalFilters.triwulan !== "all" && row.triwulan?.toString() !== currentLocalFilters.triwulan) return false;
      if (currentLocalFilters.kddept && currentLocalFilters.kddept !== "all" && row.kddept !== currentLocalFilters.kddept) return false;
      if (currentLocalFilters.kdgbkpk && currentLocalFilters.kdgbkpk !== "all" && row.kdgbkpk !== currentLocalFilters.kdgbkpk) return false;
      return true;
    });
    
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
  }, [data?.data, currentLocalFilters]);

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
        <button
          onClick={handleRefreshData}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 h-10 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRefreshing ? (
            <>
              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"></path>
              </svg>
              Refresh
            </>
          )}
        </button>
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
        filterOptions={filterOptions.data}
        isApplying={isApplying}
        isResetting={isResetting}
        onFilterChange={setCurrentLocalFilters}
      />

      {/* Data Table */}
      <RekapDataTable
        data={tableData}
        grandTotal={grandTotal}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalRows={filteredData.length}
        isLoading={isFetching}
      />
    </div>
  );
}

export const dynamic = "force-dynamic";
