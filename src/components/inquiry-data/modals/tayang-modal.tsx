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
  Loader2,
  RefreshCw,
  Search,
  Clock,
  BarChart3,
  Table,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useInquiryDataApi, FilterValue } from "@/hooks/use-inquiry-data-api";
import { normalizeActiveFilters } from "../filterRegistry";

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
  scope?: "belanja" | "tematik" | "general";
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
  const [pageSize, setPageSize] = useState(50);
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
  }, [open, activeFilters, filterValues, reportParams, currentPage, pageSize]);

  // Process data for search, sort, and pagination
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
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        // Handle null/undefined values
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return sortDirection === "asc" ? -1 : 1;
        if (bVal == null) return sortDirection === "asc" ? 1 : -1;

        // Handle numeric values
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
        }

        // Handle string values
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
      "PAGU_APBN",
      "PAGU_DIPA",
      "REALISASI",
      "BLOKIR",
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MEI",
      "JUN",
      "JUL",
      "AGS",
      "SEP",
      "OKT",
      "NOV",
      "DES",
    ];
    return summableColumns.includes(column.toUpperCase());
  };

  // Grand totals across all data (prefer server-provided totals; fallback to client sum)
  const grandTotals = useMemo(() => {
    if (lastResult?.grandTotals) return lastResult.grandTotals;
    if (!lastResult?.data?.length || !lastResult?.columns) return {};

    const totals: Record<string, number> = {};

    lastResult.columns.forEach((column) => {
      if (!isSummableColumn(column)) return;
      const sum = (lastResult.data || []).reduce((acc, row) => {
        const val = row[column];
        const num = Number(val);
        return acc + (!isNaN(num) && val != null ? num : 0);
      }, 0);
      if (sum !== 0) totals[column] = sum;
    });

    return totals;
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

  // Helper function to check if column should be treated as monetary
  const isMonetaryColumn = (column: string): boolean => {
    // Treat r- monthly alias (rjan..rdes), base monthly (jan..des), and monetary aggregates as currency
    const rMonthly = [
      "rjan",
      "rfeb",
      "rmar",
      "rapr",
      "rmei",
      "rjun",
      "rjul",
      "rags",
      "rsep",
      "rokt",
      "rnov",
      "rdes",
    ];
    const baseMonthly = [
      "jan",
      "feb",
      "mar",
      "apr",
      "mei",
      "jun",
      "jul",
      "ags",
      "sep",
      "okt",
      "nov",
      "des",
    ];
    const lower = column.toLowerCase();
    return (
      lower.includes("pagu") ||
      lower.includes("realisasi") ||
      lower.includes("blokir") ||
      lower.includes("anggaran") ||
      rMonthly.includes(lower) ||
      baseMonthly.includes(lower)
    );
  };
  // Monthly alias lists for rendering and alignment
  const rMonthly = [
    "rjan",
    "rfeb",
    "rmar",
    "rapr",
    "rmei",
    "rjun",
    "rjul",
    "rags",
    "rsep",
    "rokt",
    "rnov",
    "rdes",
  ];
  const pMonthly = [
    "pjan",
    "pfeb",
    "pmar",
    "papr",
    "pmei",
    "pjun",
    "pjul",
    "pags",
    "psep",
    "pokt",
    "pnov",
    "pdes",
  ];
  const rpMonthly = [
    "rpjan",
    "rpfeb",
    "rpmar",
    "rpapr",
    "rpmei",
    "rpjun",
    "rpjul",
    "rpags",
    "rpsep",
    "rpokt",
    "rpnov",
    "rpdes",
  ];

  // Format cell value for display
  const formatCellValue = (value: unknown, column: string): string => {
    if (value == null) return "-";

    // Convert to number if it's a numeric string
    const numValue = Number(value);
    const isNumeric = !isNaN(numValue) && value !== "" && value !== null;

    // Format numeric values (both numbers and numeric strings)
    if (isNumeric) {
      const lower = column.toLowerCase();

      const pMonthly = [
        "pjan",
        "pfeb",
        "pmar",
        "papr",
        "pmei",
        "pjun",
        "pjul",
        "pags",
        "psep",
        "pokt",
        "pnov",
        "pdes",
      ];
      const rpMonthly = [
        "rpjan",
        "rpfeb",
        "rpmar",
        "rpapr",
        "rpmei",
        "rpjun",
        "rpjul",
        "rpags",
        "rpsep",
        "rpokt",
        "rpnov",
        "rpdes",
      ];

      // sum_vol: no decimals, thousand separator, right aligned (handled in class)
      if (lower === "sum_vol") {
        return new Intl.NumberFormat("id-ID", {
          maximumFractionDigits: 0,
        }).format(Math.round(numValue));
      }

      // r* monthly: currency with pembulatan already in SQL; just format with grouping
      if (rMonthly.includes(lower)) {
        return new Intl.NumberFormat("id-ID").format(numValue);
      }

      // rp* monthly: thousand separator, no decimals
      if (lower.startsWith("rp")) {
        return new Intl.NumberFormat("id-ID", {
          maximumFractionDigits: 0,
        }).format(Math.round(numValue));
      }

      // p* monthly: percentage, 2 decimals with % suffix
      if (pMonthly.includes(lower)) {
        return `${numValue.toFixed(2)}%`;
      }

      // Monetary aggregates (e.g., PAGU_*, REALISASI, BLOKIR)
      if (isMonetaryColumn(column)) {
        return new Intl.NumberFormat("id-ID").format(numValue);
      }

      // Non-monetary numeric columns: keep raw string to preserve leading zeros
      return String(value);
    }

    return String(value);
  };

  // Helper function to get cell alignment class
  const getCellAlignmentClass = (column: string): string => {
    // Special exceptions for tipe laporan 6 (pergerakan_blokir_bulanan_per_jenis)
    if (reportParams.tipeLaporan === "pergerakan_blokir_bulanan_per_jenis") {
      if (column === "kdblokir_kode") return "text-center";
      if (column === "nmblokir_uraian") return "text-left";
    }
    const lower = column.toLowerCase();
    // Right-align monetary, r* monthly, rp* metrics, p* percentages, and sum_vol
    if (
      lower === "sum_vol" ||
      lower.startsWith("rp") ||
      pMonthly.includes(lower) ||
      rMonthly.includes(lower) ||
      isMonetaryColumn(column)
    ) {
      return "text-right";
    }
    // Left-align descriptive columns like 'uraian'
    if (lower.includes("uraian")) {
      return "text-left";
    }
    // Default alignment
    return "text-center";
  };
  // Page name for tematik vs belanja
  const pageName = scope === "tematik" ? "Tematik" : "Belanja";

  const handleRefresh = () => {
    fetchData();
    // Resolve page name for header/description
    const getPageName = () => (scope === "tematik" ? "Tematik" : "Belanja");

    setCurrentPage(1);
    setSearchTerm("");
  };

  // Get report type label
  const getReportTypeLabel = (tipeLaporan: string): string => {
    const labels: Record<string, string> = {
      pagu_apbn: "Pagu APBN",
      pagu_realisasi: "Pagu Realisasi",
      pagu_realisasi_bulanan: "Pagu Realisasi Bulanan",
      pergerakan_pagu_bulanan: "Pergerakan Pagu Bulanan",
      pergerakan_blokir_bulanan: "Pergerakan Blokir Bulanan",
      pergerakan_blokir_bulanan_per_jenis:
        "Pergerakan Blokir Bulanan Per Jenis",
      volume_output_kegiatan: "Volume Output Kegiatan (Data Caput)",
    };
    return labels[tipeLaporan] || tipeLaporan;
  };

  const getTematikKategoriLabel = (kategori?: string): string => {
    const map: Record<string, string> = {
      prioritas_nasional: "Prioritas Nasional",
      // add other tematik categories here when available
    };
    return (
      (kategori && map[kategori]) ||
      kategori ||
      getReportTypeLabel(reportParams.tipeLaporan)
    );
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleCloseModal = () => {
    setIsFullscreen(false);
    onOpenChange(false);
  };

  // Add effect to handle fullscreen body overflow
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount or when fullscreen changes
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isFullscreen]);

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent
        className={`${
          isFullscreen
            ? "!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !m-0 !rounded-none !border-0 !translate-x-0 !translate-y-0 !top-0 !left-0 !transform-none"
            : "max-w-7xl h-[90vh] sm:max-w-7xl"
        } flex flex-col overflow-hidden`}
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
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Table className="w-5 h-5 text-blue-600" />
              <span>
                Hasil Query {pageName} -{" "}
                {getTematikKategoriLabel(reportParams.tematikKategori)}
              </span>
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            {lastResult && lastResult.success && totalAvailable > 0
              ? `Menampilkan ${displayStart}-${displayEnd} dari ${totalAvailable} baris`
              : `${pageName} - ${getTematikKategoriLabel(
                  reportParams.tematikKategori
                )} tahun ${reportParams.tahun} dengan ${
                  activeFilters.length
                } filter aktif`}
          </DialogDescription>
        </DialogHeader>

        {/* Query Summary */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="secondary">Tahun: {reportParams.tahun}</Badge>
              <Badge variant="secondary">
                Pembulatan: {reportParams.pembulatan}
              </Badge>
              <Badge variant="outline">
                Filter Aktif: {activeFilters.length}
              </Badge>
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

            {/* Search and Pagination Controls */}
            {lastResult && lastResult.success && lastResult.data && (
              <div className="flex gap-2 items-center">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari data..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-8 w-64"
                  />
                </div>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    const requested = parseInt(value);
                    const capped = Math.min(requested, 100); // backend cap
                    setPageSize(capped);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 baris</SelectItem>
                    <SelectItem value="50">50 baris</SelectItem>
                    <SelectItem value="100">100 baris</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Dialog Body - Content Area */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-80">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-2" />
                <p className="text-md text-muted-foreground">Loading data..</p>
              </div>
            </div>
          ) : lastResult && !lastResult.success ? (
            <div className="flex items-center justify-center h-80">
              <div className="text-center">
                <p className="text-sm text-red-600 mb-2">
                  Error: {lastResult.error}
                </p>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  Coba Lagi
                </Button>
              </div>
            </div>
          ) : lastResult && lastResult.success && lastResult.data ? (
            <div className="border rounded-lg h-full flex flex-col overflow-hidden">
              <div className="flex-1 w-full overflow-auto">
                <div className="min-w-full">
                  <table className="w-full min-w-max">
                    <thead className="bg-muted sticky top-0 z-30">
                      <tr>
                        <th className="p-2 text-center text-sm font-medium w-16 min-w-[80px] uppercase">
                          No
                        </th>
                        {lastResult.columns?.map((column) => (
                          <th
                            key={column}
                            className="p-2 text-center text-sm font-medium cursor-pointer hover:bg-muted/50 select-none w-40 min-w-[180px] whitespace-nowrap uppercase"
                            onClick={() => handleColumnClick(column)}
                          >
                            <div className="flex items-center justify-center gap-1">
                              {column}
                              {sortColumn === column && (
                                <span className="text-xs">
                                  {sortDirection === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.length > 0 ? (
                        <>
                          {paginatedData.map((row, index) => (
                            <tr
                              key={index}
                              className="border-t hover:bg-muted/50"
                            >
                              <td className="p-2 text-center text-xs w-16 min-w-[80px]">
                                {startIndex + index + 1}
                              </td>
                              {lastResult.columns?.map((column) => (
                                <td
                                  key={column}
                                  className={`p-2 ${getCellAlignmentClass(
                                    column
                                  )} text-xs font-mono w-40 min-w-[180px] whitespace-nowrap`}
                                >
                                  {formatCellValue(row[column], column)}
                                </td>
                              ))}
                            </tr>
                          ))}

                          {/* Grand Total Row (All Data) */}
                          {Object.keys(grandTotals).length > 0 && (
                            <tr className="border-t-2 border-primary bg-muted font-medium sticky bottom-0 z-20">
                              {(() => {
                                // Find the first summable column index
                                const firstSummableIndex =
                                  lastResult.columns?.findIndex((col) =>
                                    isSummableColumn(col)
                                  ) ?? -1;
                                const columnsBeforeSummable =
                                  firstSummableIndex > 0
                                    ? firstSummableIndex
                                    : 0;

                                return (
                                  <>
                                    {/* Span "Grand Total" text across No column + columns before summable columns */}
                                    <td
                                      colSpan={1 + columnsBeforeSummable}
                                      className="p-2 text-sm font-medium text-center min-w-[80px]"
                                    >
                                      Grand Total
                                    </td>
                                    {/* Show grand totals only for summable columns */}
                                    {lastResult.columns
                                      ?.slice(firstSummableIndex)
                                      .map((column) => (
                                        <td
                                          key={column}
                                          className={`p-2 ${getCellAlignmentClass(
                                            column
                                          )} text-sm font-mono font-medium w-40 min-w-[180px] whitespace-nowrap`}
                                        >
                                          {grandTotals[column] !== undefined
                                            ? formatCellValue(
                                                grandTotals[column],
                                                column
                                              )
                                            : "-"}
                                        </td>
                                      ))}
                                  </>
                                );
                              })()}
                            </tr>
                          )}
                        </>
                      ) : (
                        <tr>
                          <td
                            colSpan={(lastResult.columns?.length || 0) + 1}
                            className="text-center py-8 text-muted-foreground"
                          >
                            {searchTerm
                              ? "Tidak ada data yang sesuai dengan pencarian"
                              : "Tidak ada data"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeFilters.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-center text-muted-foreground">
                <p>Pilih filter terlebih dahulu untuk menampilkan data</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40">
              <div className="text-center text-muted-foreground">
                <p>Klik &quot;Tayang&quot; untuk menampilkan data</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-4 items-center sm:flex-row sm:justify-between">
          <div className="flex justify-center sm:flex-1">
            {lastResult && lastResult.success && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="w-24"
                >
                  Sebelumnya
                </Button>
                <span className="text-sm">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="w-24"
                >
                  Selanjutnya
                </Button>
              </div>
            )}
          </div>
          <Button
            variant="destructive"
            onClick={handleCloseModal}
            className="w-24"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
