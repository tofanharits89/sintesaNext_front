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
import { X, 
  Loader2,
  RefreshCw,
  Search,
  Clock,
  BarChart3,
  Table,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useAPBDDataApi } from "@/hooks/apbd/use-apbd-data-api";
import type { FilterValue } from "@/hooks/use-inquiry-data-api";
import { normalizeActiveFilters } from "@/components/inquiry-data/filterRegistry";

interface APBDTayangModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilters: string[];
  reportParams: {
    tahun: string;
    tipeLaporan: string;
    pembulatan: string;
    jenisDataLokasi?: string;
  };
  filterValues?: Record<string, FilterValue>;
}

export function APBDTayangModal({
  open,
  onOpenChange,
  activeFilters,
  reportParams,
  filterValues = {},
}: APBDTayangModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { executeQuery, isLoading, lastResult } = useAPBDDataApi();

  const normalizedActiveFilters = useMemo(
    () => normalizeActiveFilters(activeFilters),
    [activeFilters],
  );

  const fetchData = async () => {
    try {
      await executeQuery(normalizedActiveFilters, filterValues, reportParams, {
        page: currentPage,
        pageSize,
      });
    } catch (error) {
      console.error("Error fetching belwil data:", error);
    }
  };

  useEffect(() => {
    if (open && activeFilters.length > 0) {
      setCurrentPage(1);
    }
  }, [open, activeFilters, filterValues, reportParams]);

  useEffect(() => {
    if (open && activeFilters.length > 0) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    JSON.stringify(activeFilters),
    JSON.stringify(filterValues),
    JSON.stringify(reportParams),
    currentPage,
    pageSize,
  ]);

  const getRowValue = (row: any, column: string) => {
    if (!row) return undefined;
    if (column in row) return row[column];
    const target = column.toUpperCase();
    for (const k of Object.keys(row)) {
      if (k.toUpperCase() === target) return row[k];
    }
    return undefined;
  };

  const processedData = useMemo(() => {
    if (!lastResult?.data) return [];

    let filtered = lastResult.data;

    if (searchTerm) {
      filtered = filtered.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      );
    }

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

  const APBD_MONTH_COLS = new Set([
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
  ]);

  const isSummableColumn = (column: string): boolean => {
    const lower = column.toLowerCase();
    return lower === "pagu" || APBD_MONTH_COLS.has(lower);
  };

  const grandTotals = useMemo(() => {
    if (!lastResult?.columns) return {};

    const serverTotals = lastResult?.grandTotals;
    if (serverTotals && Object.keys(serverTotals).length > 0) {
      const hasMeaningful = Object.entries(serverTotals).some(
        ([key, val]) =>
          isSummableColumn(key) && typeof val === "number" && val > 0,
      );
      if (hasMeaningful) return serverTotals;
    }

    const clientTotals: Record<string, number> = {};
    lastResult.columns.forEach((column) => {
      if (!isSummableColumn(column)) return;
      const sum = (lastResult?.data || []).reduce((acc, row) => {
        const raw = getRowValue(row, column);
        const num = Number(raw);
        return acc + (!isNaN(num) && raw != null ? num : 0);
      }, 0);
      clientTotals[column] = sum;
    });

    return clientTotals;
  }, [lastResult?.grandTotals, lastResult?.data, lastResult?.columns]);

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

  const handleColumnClick = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const isMonetaryColumn = (column: string): boolean => {
    const lower = column.toLowerCase();
    return lower === "pagu" || APBD_MONTH_COLS.has(lower);
  };

  const getCellAlignmentClass = (column: string): string => {
    if (isMonetaryColumn(column)) return "text-right";
    if (
      column.toLowerCase().includes("uraian") ||
      column.toLowerCase().includes("desc_")
    )
      return "text-left";
    return "text-center";
  };

  const formatCellValue = (value: unknown, column: string): string => {
    if (value == null) return "-";
    const numValue = Number(value);
    const isNumeric = !isNaN(numValue) && value !== "" && value !== null;

    if (isNumeric && isMonetaryColumn(column)) {
      return new Intl.NumberFormat("id-ID").format(numValue);
    }
    if (isNumeric && column.toLowerCase() !== "tahun") {
      return String(value);
    }
    return String(value);
  };

  const getReportTypeLabel = (tipeLaporan: string): string => {
    const labels: Record<string, string> = {
      apbd_pagu_real: "Pagu Realisasi",
      apbd_pagu_realisasi: "Pagu Realisasi",
      apbd_real_inflasi: "Realisasi Tag Inflasi",
      apbd_real_stunting: "Realisasi Tag Stunting",
      apbd_real_kemiskinan: "Realisasi Tag Kemiskinan",
    };
    return labels[tipeLaporan] || tipeLaporan;
  };

  const handleRefresh = () => {
    fetchData();
    setCurrentPage(1);
    setSearchTerm("");
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleCloseModal = () => {
    setIsFullscreen(false);
    onOpenChange(false);
  };

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
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
                Hasil Query APBD -{" "}
                {getReportTypeLabel(reportParams.tipeLaporan)}
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
              : `APBD tahun ${reportParams.tahun} dengan ${activeFilters.length} filter aktif`}
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
                    const capped = Math.min(requested, 100);
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

        {/* Dialog Body */}
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
                                  className={`p-2 ${getCellAlignmentClass(column)} text-xs font-mono w-40 min-w-[180px] whitespace-nowrap`}
                                >
                                  {formatCellValue(
                                    getRowValue(row, column),
                                    column,
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}

                          {lastResult.columns?.some((c) =>
                            isSummableColumn(c),
                          ) && (
                            <tr className="border-t-2 border-primary bg-muted font-medium sticky bottom-0 z-20">
                              {(() => {
                                const firstSummableIndex =
                                  lastResult.columns?.findIndex((col) =>
                                    isSummableColumn(col),
                                  ) ?? -1;
                                const columnsBeforeSummable =
                                  firstSummableIndex > 0
                                    ? firstSummableIndex
                                    : 0;
                                return (
                                  <>
                                    <td
                                      colSpan={1 + columnsBeforeSummable}
                                      className="p-2 text-sm font-medium text-center min-w-[80px]"
                                    >
                                      Grand Total
                                    </td>
                                    {lastResult.columns
                                      ?.slice(firstSummableIndex)
                                      .map((column) => (
                                        <td
                                          key={column}
                                          className={`p-2 ${getCellAlignmentClass(column)} text-sm font-mono font-medium w-40 min-w-[180px] whitespace-nowrap`}
                                        >
                                          {isSummableColumn(column)
                                            ? formatCellValue(
                                                grandTotals[column] ?? 0,
                                                column,
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
            onClick={handleCloseModal}
            className="w-full sm:w-24"
          >
            <X className="h-4 w-4 mr-2" /> Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
