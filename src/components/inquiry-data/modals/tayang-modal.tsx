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
  FileSpreadsheet,
  FileText,
  Clock,
  BarChart3,
} from "lucide-react";
import { useInquiryDataApi } from "@/hooks/use-inquiry-data-api";

interface TayangModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilters: string[];
  reportParams: {
    tahun: string;
    tipeLaporan: string;
    pembulatan: string;
  };
  filterValues?: Record<string, any>;
}

export function TayangModal({
  open,
  onOpenChange,
  activeFilters,
  reportParams,
  filterValues = {},
}: TayangModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Use the query builder API
  const { executeQuery, downloadCSV, downloadExcel, isLoading, lastResult } =
    useInquiryDataApi();

  const fetchData = async () => {
    try {
      await executeQuery(activeFilters, filterValues, reportParams, {
        page: currentPage,
        pageSize,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (open && activeFilters.length > 0) {
      // Reset to page 1 when opening modal with new filters
      if (currentPage !== 1) {
        setCurrentPage(1);
        return; // useEffect will run again with currentPage = 1
      }

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

  // Calculate grand totals for all original data (before search/filter)
  // Only include summable columns (pagu, realisasi, blokir, monthly columns)
  const grandTotals = useMemo(() => {
    if (!lastResult?.data?.length || !lastResult?.columns) return {};

    const totals: Record<string, number> = {};

    lastResult.columns.forEach((column) => {
      // Only calculate totals for summable columns
      if (!isSummableColumn(column)) return;

      const numericValues = (lastResult.data || [])
        .map((row) => {
          const value = row[column];
          const numValue = Number(value);
          return !isNaN(numValue) && value != null ? numValue : 0;
        })
        .filter((value) => value !== 0);

      if (numericValues.length > 0) {
        totals[column] = numericValues.reduce((sum, value) => sum + value, 0);
      }
    });

    return totals;
  }, [lastResult?.data, lastResult?.columns]);

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
    const monthlyColumns = [
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
    return (
      column.toLowerCase().includes("pagu") ||
      column.toLowerCase().includes("realisasi") ||
      column.toLowerCase().includes("blokir") ||
      column.toLowerCase().includes("anggaran") ||
      monthlyColumns.includes(column.toUpperCase())
    );
  };

  // Format cell value for display
  const formatCellValue = (value: any, column: string): string => {
    if (value == null) return "-";

    // Convert to number if it's a numeric string
    const numValue = Number(value);
    const isNumeric = !isNaN(numValue) && value !== "" && value !== null;

    // Format numeric values (both numbers and numeric strings)
    if (isNumeric) {
      // Check if it's a percentage
      if (column.toLowerCase().includes("persentase")) {
        return `${numValue.toFixed(2)}%`;
      }
      // Check if it's a monetary value (including blokir and monthly columns)
      if (isMonetaryColumn(column)) {
        return new Intl.NumberFormat("id-ID").format(numValue);
      }
      // For non-monetary numeric columns, preserve original string format to keep leading zeros
      return String(value);
    }

    return String(value);
  };

  // Helper function to get cell alignment class
  const getCellAlignmentClass = (column: string): string => {
    if (
      column.toLowerCase().includes("pagu") ||
      column.toLowerCase().includes("realisasi") ||
      column.toLowerCase().includes("blokir")
    ) {
      return "text-right";
    }
    return "text-center";
  };

  const handleRefresh = () => {
    fetchData();
    setCurrentPage(1);
    setSearchTerm("");
  };

  const handleDownloadCSV = async () => {
    try {
      await downloadCSV(activeFilters, filterValues, reportParams);
    } catch (error) {
      console.error("CSV download error:", error);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      await downloadExcel(activeFilters, filterValues, reportParams);
    } catch (error) {
      console.error("Excel download error:", error);
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] sm:max-w-7xl flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              Hasil Query - {getReportTypeLabel(reportParams.tipeLaporan)}
            </span>
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
          </DialogTitle>
          <DialogDescription>
            {lastResult && lastResult.success && totalAvailable > 0
              ? `Menampilkan ${displayStart}-${displayEnd} dari ${totalAvailable} baris`
              : `Laporan ${getReportTypeLabel(
                  reportParams.tipeLaporan
                )} tahun ${reportParams.tahun} dengan ${
                  activeFilters.length
                } filter aktif`}
          </DialogDescription>
        </DialogHeader>

        {/* Query Summary */}
        <div className="space-y-4">
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
                  {lastResult.rowCount} baris
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {lastResult.executionTime}ms
                </Badge>
              </>
            )}
          </div>

          {/* Controls */}
          {lastResult && lastResult.success && lastResult.data && (
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
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
                    setPageSize(parseInt(value));
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
                    <SelectItem value="200">200 baris</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadCSV}
                  className="flex items-center gap-1"
                  disabled={isLoading}
                >
                  <FileText className="w-4 h-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadExcel}
                  className="flex items-center gap-1"
                  disabled={isLoading}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Dialog Body - Content Area */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Mengeksekusi query...
                </p>
              </div>
            </div>
          ) : lastResult && !lastResult.success ? (
            <div className="flex items-center justify-center h-40">
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
                        <th className="p-2 text-center text-sm font-medium w-16 min-w-[80px]">
                          No
                        </th>
                        {lastResult.columns?.map((column) => (
                          <th
                            key={column}
                            className="p-2 text-center text-sm font-medium cursor-pointer hover:bg-muted/50 select-none w-40 min-w-[180px] whitespace-nowrap"
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
                <p>Klik "Tayang" untuk menampilkan data</p>
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
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-red-200 hover:bg-red-300 text-red-800 hover:text-red-800 border-red-200 w-24"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
