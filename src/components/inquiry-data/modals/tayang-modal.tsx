"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { X, 
  RefreshCw,
  Search,
  Clock,
  BarChart3,
  Table,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/utils";
import { useInquiryDataApi, FilterValue } from "@/hooks/use-inquiry-data-api";
import { normalizeActiveFilters } from "../filterRegistry";
import { getCategoryLabel } from "../categoryRegistry";

interface TayangModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilters: string[];
  reportParams: {
    tahun: string;
    tipeLaporan: string;
    pembulatan: string;
    tematikKategori?: string;
  };
  filterValues?: Record<string, FilterValue>;
  scope?: "belanja" | "tematik" | "general" | "rkakl_detail" | "kontrak" | "up_tup" | "penerimaan_pnbp" | "sp2d" | "revisi_dipa" | "deviasi";
}

export function TayangModal({
  open,
  onOpenChange,
  activeFilters,
  reportParams,
  filterValues = {},
  scope = "general",
}: TayangModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Use the query builder API
  const { executeQuery, isLoading, lastResult } = useInquiryDataApi();

  // Normalize active filters to the default order so SELECT and thus table columns are stable
  const normalizedActiveFilters = useMemo(
    () => normalizeActiveFilters(activeFilters),
    [activeFilters]
  );

  const fetchData = async () => {
    try {
      await executeQuery(normalizedActiveFilters, filterValues, reportParams, {
        page: currentPage,
        pageSize,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Reset page to 1 when modal opens or filters/report params change
  useEffect(() => {
    if (open && activeFilters.length > 0) {
      setCurrentPage(1);
    }
  }, [open, activeFilters, filterValues, reportParams]);

  // Fetch data whenever page/pageSize changes or when inputs change
  useEffect(() => {
    if (open && activeFilters.length > 0) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, JSON.stringify(activeFilters), JSON.stringify(filterValues), JSON.stringify(reportParams), currentPage, pageSize]);

  // Case-insensitive safe getter for a row's column value
  const getRowValue = (row: any, column: string) => {
    if (!row) return undefined;
    if (column in row) return row[column];
    const target = column.toUpperCase();
    for (const k of Object.keys(row)) {
      if (k.toUpperCase() === target) return row[k];
    }
    return undefined;
  };

  // Process data for search and sort (pagination is server-side)
  const processedData = useMemo(() => {
    if (!lastResult?.data) return [];

    let filtered = lastResult.data;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = getRowValue(a, sortColumn);
        const bVal = getRowValue(b, sortColumn);

        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return sortDirection === "asc" ? -1 : 1;
        if (bVal == null) return sortDirection === "asc" ? 1 : -1;

        const aNum = Number(aVal);
        const bNum = Number(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
        }

        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        if (aStr < bStr) return sortDirection === "asc" ? -1 : 1;
        if (aStr > bStr) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [lastResult?.data, searchTerm, sortColumn, sortDirection]);

  // Helper function to check if column should be summed in totals
  const isSummableColumn = (column: string): boolean => {
    const summableColumns = [
      "PAGU_APBN", "PAGU_DIPA", "PAGU", "REALISASI",
      "PAGU_KONTRAK", "REALISASI_KONTRAK", "BLOKIR", "NILAI_SP2D",
      "JAN", "FEB", "MAR", "APR", "MEI", "JUN",
      "JUL", "AGS", "SEP", "OKT", "NOV", "DES", "JMLPNRK",
      "RUPIAH",
    ];
    const upper = column.toUpperCase();
    return (
      summableColumns.includes(upper) ||
      upper.startsWith("RENCANA_") ||
      upper.startsWith("REALISASI_") ||
      upper.startsWith("RENC") ||
      upper.startsWith("REAL") ||
      upper === "TOTAL_RENCANA" ||
      upper === "TOTAL_REALISASI"
    );
  };

  // Grand totals — prefer server-provided, fallback to client sum
  const grandTotals = useMemo(() => {
    if (!lastResult?.columns) return {};

    const serverTotals = lastResult?.grandTotals;
    if (serverTotals && Object.keys(serverTotals).length > 0) {
      const hasMeaningfulServerTotal = Object.entries(serverTotals).some(
        ([key, val]) => isSummableColumn(key) && typeof val === "number" && val > 0
      );
      if (hasMeaningfulServerTotal) return serverTotals;
    }

    const clientTotals: Record<string, number> = {};
    lastResult.columns.forEach((column) => {
      if (!isSummableColumn(column)) return;
      const sum = (lastResult?.data || []).reduce((acc, row) => {
        const raw = getRowValue(row, column);
        const cleaned =
          typeof raw === "string"
            ? raw.replace(/[\,\s]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "")
            : raw;
        const num = Number(cleaned);
        return acc + (!isNaN(num) && raw != null ? num : 0);
      }, 0);
      clientTotals[column] = sum;
    });

    return clientTotals;
  }, [lastResult?.grandTotals, lastResult?.data, lastResult?.columns]);

  // Pagination (server-aware)
  const isServerPaginated = typeof lastResult?.totalCount === "number";
  const totalAvailable = isServerPaginated
    ? lastResult?.totalCount || 0
    : processedData.length;
  const totalPages = Math.max(1, Math.ceil(totalAvailable / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = isServerPaginated
    ? processedData
    : processedData.slice(startIndex, endIndex);
  const displayStart = totalAvailable === 0 ? 0 : startIndex + 1;
  const displayEnd = isServerPaginated
    ? startIndex + processedData.length
    : Math.min(endIndex, processedData.length);

  // Handle column header click for sorting
  const handleColumnClick = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Monthly alias lists
  const rMonthly = ["rjan","rfeb","rmar","rapr","rmei","rjun","rjul","rags","rsep","rokt","rnov","rdes"];
  const pMonthly = ["pjan","pfeb","pmar","papr","pmei","pjun","pjul","pags","psep","pokt","pnov","pdes"];

  const isMonetaryColumn = (column: string): boolean => {
    const baseMonthly = ["jan","feb","mar","apr","mei","jun","jul","ags","sep","okt","nov","des"];
    const lower = column.toLowerCase();
    return (
      lower.includes("pagu") ||
      lower.includes("realisasi") ||
      lower.includes("rencana") ||
      lower.includes("renc") ||
      lower.includes("real") ||
      lower.includes("blokir") ||
      lower.includes("anggaran") ||
      lower === "jmlpnrk" ||
      lower === "nilai_sp2d" ||
      lower === "rupiah" ||
      rMonthly.includes(lower) ||
      baseMonthly.includes(lower)
    );
  };

  const formatCellValue = (value: unknown, column: string): string => {
    if (value == null) return "-";
    const numValue = Number(value);
    const isNumeric = !isNaN(numValue) && value !== "" && value !== null;

    if (isNumeric) {
      const lower = column.toLowerCase();
      const rpMonthly = ["rpjan","rpfeb","rpmar","rpapr","rpmei","rpjun","rpjul","rpags","rpsep","rpokt","rpnov","rpdes"];

      if (lower === "sum_vol") {
        return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Math.round(numValue));
      }
      if (rMonthly.includes(lower)) {
        return new Intl.NumberFormat("id-ID").format(numValue);
      }
      if (rpMonthly.includes(lower) || lower.startsWith("rp")) {
        return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Math.round(numValue));
      }
      if (pMonthly.includes(lower)) {
        return `${numValue.toFixed(2)}%`;
      }
      if (isMonetaryColumn(column)) {
        return new Intl.NumberFormat("id-ID").format(numValue);
      }
      return String(value);
    }

    return String(value);
  };

  const getCellAlignmentClass = (column: string): string => {
    const lower = column.toLowerCase();
    if (reportParams.tipeLaporan === "pergerakan_blokir_bulanan_per_jenis") {
      if (column === "kdblokir_kode") return "text-center";
      if (column === "nmblokir_uraian") return "text-left";
    }
    if (lower === "statussumber_uraian") return "text-center";
    if (
      lower === "sum_vol" ||
      lower.startsWith("rp") ||
      pMonthly.includes(lower) ||
      rMonthly.includes(lower) ||
      isMonetaryColumn(column)
    ) {
      return "text-right";
    }
    if (lower.includes("uraian")) return "text-left";
    return "text-center";
  };

  const getPageName = (scope: string): string => {
    const scopeNames: Record<string, string> = {
      belanja: "Belanja",
      tematik: "Kategori Tematik",
      rkakl_detail: "RKAKL Detail",
      kontrak: "Kontrak",
      general: "General",
    };
    return scopeNames[scope] || "General";
  };

  const pageName = getPageName(scope);

  const handleRefresh = () => {
    fetchData();
    setCurrentPage(1);
    setSearchTerm("");
  };

  const getReportTypeLabel = (tipeLaporan: string): string => {
    const labels: Record<string, string> = {
      pagu_apbn: "Pagu APBN",
      pagu_realisasi: "Pagu Realisasi",
      pagu_realisasi_bulanan: "Pagu Realisasi Bulanan",
      pergerakan_pagu_bulanan: "Pergerakan Pagu Bulanan",
      pergerakan_blokir_bulanan: "Pergerakan Blokir Bulanan",
      pergerakan_blokir_bulanan_per_jenis: "Pergerakan Blokir Bulanan Per Jenis",
      volume_output_kegiatan: "Volume Output Kegiatan (Data Caput)",
    };
    return labels[tipeLaporan] || tipeLaporan;
  };

  const getTematikKategoriLabel = (kategori?: string): string => {
    if (!kategori) return "";
    return getCategoryLabel(kategori);
  };

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const handleCloseModal = () => {
    setIsFullscreen(false);
    onOpenChange(false);
  };

  // Build pagination page items (same pattern as data-table.tsx)
  const renderPaginationItems = () => {
    const items = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={currentPage === i}
              onClick={(e) => { e.preventDefault(); setCurrentPage(i); }}
              className="cursor-pointer select-none"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // First page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            isActive={currentPage === 1}
            onClick={(e) => { e.preventDefault(); setCurrentPage(1); }}
            className="cursor-pointer select-none"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        items.push(<PaginationEllipsis key="left-ellipsis" />);
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={currentPage === i}
              onClick={(e) => { e.preventDefault(); setCurrentPage(i); }}
              className="cursor-pointer select-none"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(<PaginationEllipsis key="right-ellipsis" />);
      }

      // Last page
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            isActive={currentPage === totalPages}
            onClick={(e) => { e.preventDefault(); setCurrentPage(totalPages); }}
            className="cursor-pointer select-none"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent
        className={cn(
          "!flex flex-col gap-3",
          isFullscreen
            ? "!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !m-0 !rounded-none !border-0 !translate-x-0 !translate-y-0 !top-0 !left-0 !transform-none"
            : "max-w-7xl w-full sm:max-w-7xl max-h-[90vh]"
        )}
        showCloseButton={false}
        style={
          isFullscreen
            ? {
                position: "fixed",
                inset: "0",
                width: "100vw",
                height: "100vh",
                maxWidth: "none",
                maxHeight: "none",
                margin: "0",
                borderRadius: "0",
                border: "none",
                transform: "none",
                top: "0",
                left: "0",
              }
            : {}
        }
      >
        {/* Header */}
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Table className="w-5 h-5 text-blue-600" />
              <span>
                Hasil Query {pageName} -{" "}
                {scope === "tematik"
                  ? getTematikKategoriLabel(reportParams.tematikKategori)
                  : getReportTypeLabel(reportParams.tipeLaporan)}
              </span>
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Badges + Search row */}
        <div className="shrink-0 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="secondary">Tahun: {reportParams.tahun}</Badge>
            <Badge variant="secondary">Pembulatan: {reportParams.pembulatan}</Badge>
            <Badge variant="outline">Filter Aktif: {activeFilters.length}</Badge>
            {lastResult && (
              <>
                <Badge variant="outline" className="flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  {totalAvailable} baris
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {lastResult.executionTime}ms
                </Badge>
              </>
            )}
          </div>

          {lastResult && lastResult.success && lastResult.data && (
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari data..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-8 w-56"
              />
            </div>
          )}
        </div>

        {/* Table area */}
        <div className={cn("min-h-0 flex-1 flex flex-col")}>
          {isLoading ? (
            <div className="border rounded-lg overflow-hidden flex-1">
              <table className="w-full min-w-max text-xs border-separate border-spacing-0">
                {/* Skeleton header */}
                <thead className="bg-muted">
                  <tr>
                    {/* No column */}
                    <th className="p-2 w-12 min-w-[48px]">
                      <Skeleton className="h-4 w-6 mx-auto" />
                    </th>
                    {/* Simulate 4 columns while loading */}
                    {Array.from({ length: 4 }).map((_, i) => (
                      <th key={i} className="p-2 min-w-[140px]">
                        <Skeleton className="h-4 w-24 mx-auto" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: pageSize }).map((_, rowIdx) => (
                    <tr key={rowIdx}>
                      <td className="p-2 border-t border-border">
                        <Skeleton className="h-3 w-6 mx-auto" />
                      </td>
                      {Array.from({ length: 4 }).map((_, colIdx) => {
                        // Vary widths to look natural
                        const widths = ["w-20", "w-28", "w-24", "w-16"];
                        return (
                          <td key={colIdx} className="p-2 border-t border-border">
                            <Skeleton className={cn("h-3 mx-auto", widths[(rowIdx + colIdx) % widths.length])} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : lastResult && !lastResult.success ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-sm text-red-600 mb-2">Error: {lastResult.error}</p>
                <Button variant="outline" size="sm" onClick={handleRefresh}>Coba Lagi</Button>
              </div>
            </div>
          ) : lastResult && lastResult.success && lastResult.data ? (
            <div className="border rounded-lg overflow-auto flex-1">
              <table className="w-full min-w-max text-xs border-separate border-spacing-0">
                <thead className="bg-muted sticky top-0 z-10">
                  <tr>
                    <th className="p-2 text-center font-medium w-12 min-w-[48px] uppercase whitespace-nowrap">No</th>
                    {lastResult.columns?.map((column) => (
                      <th
                        key={column}
                        className="p-2 text-center font-medium cursor-pointer hover:bg-muted/70 select-none min-w-[140px] whitespace-nowrap uppercase"
                        onClick={() => handleColumnClick(column)}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {column}
                          {sortColumn === column && (
                            <span className="text-xs">{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((row, index) => (
                      <tr key={index} className="hover:bg-muted/50">
                        <td className="p-2 text-center w-12 min-w-[48px] border-t border-border">
                          {startIndex + index + 1}
                        </td>
                        {lastResult.columns?.map((column) => (
                          <td
                            key={column}
                            className={cn(
                              "p-2 font-mono min-w-[140px] whitespace-nowrap border-t border-border",
                              getCellAlignmentClass(column)
                            )}
                          >
                            {formatCellValue(getRowValue(row, column), column)}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={(lastResult.columns?.length || 0) + 1}
                        className="text-center py-8 text-muted-foreground"
                      >
                        {searchTerm ? "Tidak ada data yang sesuai dengan pencarian" : "Tidak ada data"}
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* Grand Total — sticky tfoot */}
                {lastResult.columns?.some((c) => isSummableColumn(c)) && paginatedData.length > 0 && (
                  <tfoot className="sticky bottom-0 z-10">
                    {(() => {
                      const firstSummableIndex = lastResult.columns?.findIndex((col) => isSummableColumn(col)) ?? -1;
                      const columnsBeforeSummable = firstSummableIndex > 0 ? firstSummableIndex : 0;
                      return (
                        <tr className="bg-muted font-medium">
                          <td
                            colSpan={1 + columnsBeforeSummable}
                            className="p-2 text-sm font-medium text-center border-t-2 border-primary"
                          >
                            Grand Total
                          </td>
                          {lastResult.columns?.slice(firstSummableIndex).map((column) => (
                            <td
                              key={column}
                              className={cn(
                                "p-2 text-sm font-mono font-medium min-w-[140px] whitespace-nowrap border-t-2 border-primary",
                                getCellAlignmentClass(column)
                              )}
                            >
                              {isSummableColumn(column)
                                ? formatCellValue(grandTotals[column] ?? 0, column)
                                : "-"}
                            </td>
                          ))}
                        </tr>
                      );
                    })()}
                  </tfoot>
                )}
              </table>
            </div>
          ) : activeFilters.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-center text-muted-foreground">
              <p>Pilih filter terlebih dahulu untuk menampilkan data</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-center text-muted-foreground">
              <p>Klik &quot;Tayang&quot; untuk menampilkan data</p>
            </div>
          )}
        </div>

        {/* Pagination + footer */}
        {lastResult && lastResult.success && lastResult.data && (
          <>
            {/* Desktop / Tablet view (md and up) */}
            <div className="hidden md:grid md:grid-cols-3 items-center gap-3 shrink-0">
              {/* Left: Rows per page */}
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium whitespace-nowrap">Baris per halaman</p>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 25, 50, 100].map((size) => (
                      <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Center: Pagination */}
              <div className="flex items-center justify-center w-full">
                <Pagination className="mx-auto justify-center">
                  <div className="flex items-center justify-between w-full sm:min-w-[400px] gap-2">
                    <PaginationPrevious
                      onClick={(e) => { e.preventDefault(); setCurrentPage(Math.max(1, currentPage - 1)); }}
                      className={cn(
                        "cursor-pointer select-none",
                        currentPage === 1 && "pointer-events-none opacity-50"
                      )}
                    />
                    <PaginationContent className="flex-1 justify-center gap-1 overflow-x-auto">
                      {renderPaginationItems()}
                    </PaginationContent>
                    <PaginationNext
                      onClick={(e) => { e.preventDefault(); setCurrentPage(Math.min(totalPages, currentPage + 1)); }}
                      className={cn(
                        "cursor-pointer select-none",
                        currentPage === totalPages && "pointer-events-none opacity-50"
                      )}
                    />
                  </div>
                </Pagination>
              </div>

              {/* Right: Entry count + close */}
              <div className="flex items-center justify-end gap-3 w-full md:w-auto">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {displayStart}-{displayEnd} dari {totalAvailable} baris
                </span>
                <Button onClick={handleCloseModal} className="w-24">
                  <X className="h-4 w-4 mr-2" /> Tutup
                </Button>
              </div>
            </div>

            {/* Mobile view (sm and below) */}
            <div className="flex md:hidden flex-col items-center gap-3 shrink-0 w-full">
              {/* Pagination */}
              <div className="flex items-center justify-center w-full">
                <Pagination className="mx-auto justify-center">
                  <div className="flex items-center justify-between w-full gap-2">
                    <PaginationPrevious
                      onClick={(e) => { e.preventDefault(); setCurrentPage(Math.max(1, currentPage - 1)); }}
                      className={cn(
                        "cursor-pointer select-none",
                        currentPage === 1 && "pointer-events-none opacity-50"
                      )}
                    />
                    <PaginationContent className="flex-1 justify-center gap-1 overflow-x-auto">
                      {renderPaginationItems()}
                    </PaginationContent>
                    <PaginationNext
                      onClick={(e) => { e.preventDefault(); setCurrentPage(Math.min(totalPages, currentPage + 1)); }}
                      className={cn(
                        "cursor-pointer select-none",
                        currentPage === totalPages && "pointer-events-none opacity-50"
                      )}
                    />
                  </div>
                </Pagination>
              </div>

              {/* Selector and Entry count on the same row */}
              <div className="flex flex-row items-center justify-between w-full gap-2 px-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium whitespace-nowrap text-muted-foreground">Baris:</p>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-7 w-[60px] text-xs px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 25, 50, 100].map((size) => (
                        <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {displayStart}-{displayEnd} dari {totalAvailable} baris
                </span>
              </div>

              {/* Close button full width */}
              <Button onClick={handleCloseModal} className="w-full h-9">
                <X className="h-4 w-4 mr-2" /> Tutup
              </Button>
            </div>
          </>
        )}

        {/* Close button when no data yet */}
        {!(lastResult && lastResult.success && lastResult.data) && (
          <DialogFooter className="shrink-0 flex-shrink-0 pt-4 border-t border-border/50">
            <Button onClick={handleCloseModal} className="w-full sm:w-24">
              <X className="h-4 w-4 mr-2" /> Tutup
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
