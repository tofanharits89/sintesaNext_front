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
  RefreshCw,
  Search,
  Clock,
  BarChart3,
  Table,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useBelwilDataApi,
  useBelwilTematikDataApi,
  useBelwilSubsidiDataApi,
  useBelwilBansosDataApi,
} from "@/hooks/belwil/use-belwil-data-api";
import type { BelwilTematikReportParams } from "@/hooks/belwil/use-belwil-data-api";
import type { BelwilSubsidiReportParams } from "@/hooks/belwil/use-belwil-data-api";
import type { BelwilBansosReportParams } from "@/hooks/belwil/use-belwil-data-api";
import type { FilterValue } from "@/hooks/use-inquiry-data-api";
import { normalizeActiveFilters } from "@/components/inquiry-data/filterRegistry";

interface BelwilTayangModalProps {
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

export function BelwilTayangModal({
  open,
  onOpenChange,
  activeFilters,
  reportParams,
  filterValues = {},
}: BelwilTayangModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { executeQuery, isLoading, lastResult } = useBelwilDataApi();

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

  const isSummableColumn = (column: string): boolean => {
    const lower = column.toLowerCase();
    return (
      lower === "pagu" ||
      lower === "total_realisasi" ||
      /^real\d{1,2}$/.test(lower)
    );
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
    return (
      lower === "pagu" ||
      lower === "total_realisasi" ||
      /^real\d{1,2}$/.test(lower)
    );
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
      pagu_realisasi: "Pagu Realisasi",
      pagu_saja: "Pagu Saja",
      pagu_realisasi_bulanan: "Pagu Realisasi Bulanan (12 Bulan)",
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
      if (currentPage > 3) items.push(<PaginationEllipsis key="left-ellipsis" />);
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
      if (currentPage < totalPages - 2) items.push(<PaginationEllipsis key="right-ellipsis" />);
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
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Table className="w-5 h-5 text-blue-600" />
              <span>
                Hasil Query Belanja Kewilayahan -{" "}
                {getReportTypeLabel(reportParams.tipeLaporan)}
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
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 w-12 min-w-[48px]">
                      <Skeleton className="h-4 w-6 mx-auto" />
                    </th>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <th key={i} className="p-2 min-w-[140px]">
                        <Skeleton className="h-4 w-24 mx-auto" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }).map((_, rowIdx) => (
                    <tr key={rowIdx}>
                      <td className="p-2 border-t border-border">
                        <Skeleton className="h-3 w-6 mx-auto" />
                      </td>
                      {Array.from({ length: 4 }).map((_, colIdx) => (
                        <td key={colIdx} className="p-2 border-t border-border">
                          <Skeleton className="h-3 w-24 mx-auto" />
                        </td>
                      ))}
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
          <div className="shrink-0 flex flex-col md:grid md:grid-cols-3 items-center gap-3">
            <div className="flex items-center gap-2 order-2 md:order-1">
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

            <div className="flex items-center justify-center order-1 md:order-2 w-full">
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

            <div className="flex items-center justify-end gap-3 order-3 w-full md:w-auto">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {displayStart}-{displayEnd} dari {totalAvailable} baris
              </span>
              <Button variant="destructive" onClick={handleCloseModal} className="w-20">
                Tutup
              </Button>
            </div>
          </div>
        )}

        {!(lastResult && lastResult.success && lastResult.data) && (
          <DialogFooter className="shrink-0">
            <Button variant="destructive" onClick={handleCloseModal} className="w-24">
              Tutup
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Tematik variant ──────────────────────────────────────────────────────────────────

const TEMATIK_TIPE_LAPORAN_LABELS: Record<string, string> = {
  prioritasPresiden: "Prioritas Presiden",
  inflasi: "Inflasi",
};

interface BelwilTematikTayangModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilters: string[];
  reportParams: BelwilTematikReportParams;
  filterValues?: Record<string, FilterValue>;
}

export function BelwilTematikTayangModal({
  open,
  onOpenChange,
  activeFilters,
  reportParams,
  filterValues = {},
}: BelwilTematikTayangModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { executeQuery, isLoading, lastResult } = useBelwilTematikDataApi();

  const normalizedActiveFilters = useMemo(
    () => normalizeActiveFilters(activeFilters),
    [activeFilters],
  );

  const tipeLaporanLabel =
    TEMATIK_TIPE_LAPORAN_LABELS[reportParams.tipeLaporan] ||
    reportParams.tipeLaporan;

  const fetchData = async () => {
    try {
      await executeQuery(normalizedActiveFilters, filterValues, reportParams, {
        page: currentPage,
        pageSize,
      });
    } catch (error) {
      console.error("Error fetching tematik data:", error);
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

  const isSummableColumn = (column: string): boolean => {
    const lower = column.toLowerCase();
    return (
      lower === "pagu" ||
      lower === "total_realisasi" ||
      /^real\d{1,2}$/.test(lower)
    );
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
    return (
      lower === "pagu" ||
      lower === "total_realisasi" ||
      /^real\d{1,2}$/.test(lower)
    );
  };

  const getCellAlignmentClass = (column: string): string => {
    if (isMonetaryColumn(column)) return "text-right";
    const lower = column.toLowerCase();
    if (
      lower.includes("uraian") ||
      lower.includes("desc_") ||
      lower.includes("nm")
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
    return String(value);
  };

  const handleRefresh = () => {
    fetchData();
    setCurrentPage(1);
    setSearchTerm("");
  };

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const handleCloseModal = () => {
    setIsFullscreen(false);
    onOpenChange(false);
  };

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
      if (currentPage > 3) items.push(<PaginationEllipsis key="left-ellipsis" />);
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
      if (currentPage < totalPages - 2) items.push(<PaginationEllipsis key="right-ellipsis" />);
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

  useEffect(() => {
    document.body.style.overflow = isFullscreen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isFullscreen]);

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
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Table className="w-5 h-5 text-teal-600" />
              <span>Hasil Query Kewilayahan Tematik – {tipeLaporanLabel}</span>
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
            <Badge variant="secondary">Tipe: {tipeLaporanLabel}</Badge>
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
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 w-12 min-w-[48px]">
                      <Skeleton className="h-4 w-6 mx-auto" />
                    </th>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <th key={i} className="p-2 min-w-[140px]">
                        <Skeleton className="h-4 w-24 mx-auto" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }).map((_, rowIdx) => (
                    <tr key={rowIdx}>
                      <td className="p-2 border-t border-border">
                        <Skeleton className="h-3 w-6 mx-auto" />
                      </td>
                      {Array.from({ length: 4 }).map((_, colIdx) => (
                        <td key={colIdx} className="p-2 border-t border-border">
                          <Skeleton className="h-3 w-24 mx-auto" />
                        </td>
                      ))}
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
          <div className="shrink-0 flex flex-col md:grid md:grid-cols-3 items-center gap-3">
            <div className="flex items-center gap-2 order-2 md:order-1">
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

            <div className="flex items-center justify-center order-1 md:order-2 w-full">
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

            <div className="flex items-center justify-end gap-3 order-3 w-full md:w-auto">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {displayStart}-{displayEnd} dari {totalAvailable} baris
              </span>
              <Button variant="destructive" onClick={handleCloseModal} className="w-20">
                Tutup
              </Button>
            </div>
          </div>
        )}

        {!(lastResult && lastResult.success && lastResult.data) && (
          <DialogFooter className="shrink-0">
            <Button variant="destructive" onClick={handleCloseModal} className="w-24">
              Tutup
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Subsidi variant ─────────────────────────────────────────────────────────────────

const SUBSIDI_TIPE_LAPORAN_LABELS: Record<string, string> = {
  realisasi: "Realisasi",
  jumlah_penerima: "Jumlah Penerima",
  jumlah_va: "Jumlah VA",
};

interface BelwilSubsidiTayangModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilters: string[];
  reportParams: BelwilSubsidiReportParams;
  filterValues?: Record<string, FilterValue>;
}

export function BelwilSubsidiTayangModal({
  open,
  onOpenChange,
  activeFilters,
  reportParams,
  filterValues = {},
}: BelwilSubsidiTayangModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { executeQuery, isLoading, lastResult } = useBelwilSubsidiDataApi();
  const normalizedActiveFilters = useMemo(
    () => normalizeActiveFilters(activeFilters),
    [activeFilters],
  );
  const tipeLaporanLabel =
    SUBSIDI_TIPE_LAPORAN_LABELS[reportParams.tipeLaporan] ||
    reportParams.tipeLaporan;

  const fetchData = async () => {
    try {
      await executeQuery(normalizedActiveFilters, filterValues, reportParams, {
        page: currentPage,
        pageSize,
      });
    } catch (e) {
      console.error("Error fetching subsidi data:", e);
    }
  };

  useEffect(() => {
    if (open && activeFilters.length > 0) setCurrentPage(1);
  }, [open, activeFilters, filterValues, reportParams]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (open && activeFilters.length > 0) fetchData();
  }, [
    open,
    JSON.stringify(activeFilters),
    JSON.stringify(filterValues),
    JSON.stringify(reportParams),
    currentPage,
    pageSize,
  ]);

  useEffect(() => {
    document.body.style.overflow = isFullscreen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isFullscreen]);

  const getRowVal = (row: Record<string, unknown>, col: string): unknown => {
    if (!row) return undefined;
    if (col in row) return row[col];
    const t = col.toUpperCase();
    for (const k of Object.keys(row)) {
      if (k.toUpperCase() === t) return row[k];
    }
    return undefined;
  };

  const isSubsidiNumCol = (col: string): boolean => {
    const c = col.toLowerCase();
    return (
      /^real\d{1,2}$/.test(c) ||
      /^jml_penerima\d{1,2}$/.test(c) ||
      /^jml_va\d{1,2}$/.test(c) ||
      c === "total_realisasi" ||
      c === "total_penerima" ||
      c === "total_va"
    );
  };

  const processedData = useMemo(() => {
    if (!lastResult?.data) return [];
    let filtered = lastResult.data as Record<string, unknown>[];
    if (searchTerm) {
      filtered = filtered.filter((row) =>
        Object.values(row).some((v) =>
          String(v).toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      );
    }
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const av = getRowVal(a, sortColumn);
        const bv = getRowVal(b, sortColumn);
        if (av == null && bv == null) return 0;
        if (av == null) return sortDirection === "asc" ? -1 : 1;
        if (bv == null) return sortDirection === "asc" ? 1 : -1;
        const an = Number(av),
          bn = Number(bv);
        if (!isNaN(an) && !isNaN(bn))
          return sortDirection === "asc" ? an - bn : bn - an;
        return sortDirection === "asc"
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
    }
    return filtered;
  }, [lastResult?.data, searchTerm, sortColumn, sortDirection]);

  const grandTotals = useMemo(() => {
    if (!lastResult?.columns) return {} as Record<string, number>;
    const st = lastResult?.grandTotals as Record<string, number> | undefined;
    if (
      st &&
      Object.entries(st).some(
        ([k, v]) => isSubsidiNumCol(k) && typeof v === "number" && v > 0,
      )
    )
      return st;
    const ct: Record<string, number> = {};
    lastResult.columns.forEach((col: string) => {
      if (!isSubsidiNumCol(col)) return;
      ct[col] = ((lastResult?.data as Record<string, unknown>[]) || []).reduce(
        (acc, row) => {
          const raw = getRowVal(row, col);
          const n = Number(raw);
          return acc + (!isNaN(n) && raw != null ? n : 0);
        },
        0,
      );
    });
    return ct;
  }, [lastResult?.grandTotals, lastResult?.data, lastResult?.columns]);

  const isServerPaginated = typeof lastResult?.totalCount === "number";
  const totalAvailable = isServerPaginated
    ? lastResult?.totalCount || 0
    : processedData.length;
  const totalPages = Math.max(1, Math.ceil(totalAvailable / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = isServerPaginated
    ? processedData
    : processedData.slice(startIndex, startIndex + pageSize);
  const displayStart = totalAvailable === 0 ? 0 : startIndex + 1;
  const displayEnd = isServerPaginated
    ? startIndex + processedData.length
    : Math.min(startIndex + pageSize, processedData.length);

  const getAlignClass = (col: string) => {
    if (isSubsidiNumCol(col)) return "text-right";
    const c = col.toLowerCase();
    return c.includes("nm") || c === "jns_bansos" || c.includes("uraian")
      ? "text-left"
      : "text-center";
  };

  const fmtCell = (v: unknown, col: string) => {
    if (v == null) return "-";
    const n = Number(v);
    if (!isNaN(n) && v !== "" && isSubsidiNumCol(col))
      return new Intl.NumberFormat("id-ID").format(n);
    return String(v);
  };

  const handleCloseModal = () => {
    setIsFullscreen(false);
    onOpenChange(false);
  };

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
      if (currentPage > 3) items.push(<PaginationEllipsis key="left-ellipsis" />);
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
      if (currentPage < totalPages - 2) items.push(<PaginationEllipsis key="right-ellipsis" />);
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

  useEffect(() => {
    document.body.style.overflow = isFullscreen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isFullscreen]);

  const cols: string[] =
    lastResult?.columns ||
    (lastResult?.data?.[0] ? Object.keys(lastResult.data[0] as object) : []);

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
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Table className="w-5 h-5 text-teal-600" />
              <span>Hasil Query Subsidi Kewilayahan – {tipeLaporanLabel}</span>
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchData();
                  setCurrentPage(1);
                  setSearchTerm("");
                }}
                disabled={isLoading}
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
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
            <Badge variant="secondary">Tipe: {tipeLaporanLabel}</Badge>
            {reportParams.jnsBansos && reportParams.jnsBansos !== "all" && (
              <Badge variant="secondary">Subsidi: {reportParams.jnsBansos}</Badge>
            )}
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
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 w-12 min-w-[48px]">
                      <Skeleton className="h-4 w-6 mx-auto" />
                    </th>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <th key={i} className="p-2 min-w-[140px]">
                        <Skeleton className="h-4 w-24 mx-auto" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }).map((_, rowIdx) => (
                    <tr key={rowIdx}>
                      <td className="p-2 border-t border-border">
                        <Skeleton className="h-3 w-6 mx-auto" />
                      </td>
                      {Array.from({ length: 4 }).map((_, colIdx) => (
                        <td key={colIdx} className="p-2 border-t border-border">
                          <Skeleton className="h-3 w-24 mx-auto" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : lastResult && !lastResult.success ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-sm text-red-600 mb-2">Error: {lastResult.error}</p>
                <Button variant="outline" size="sm" onClick={fetchData}>Coba Lagi</Button>
              </div>
            </div>
          ) : lastResult && lastResult.success && lastResult.data ? (
            <div className="border rounded-lg overflow-auto flex-1">
              <table className="w-full min-w-max text-xs border-separate border-spacing-0">
                <thead className="bg-muted sticky top-0 z-10">
                  <tr>
                    <th className="p-2 text-center font-medium w-12 min-w-[48px] uppercase whitespace-nowrap">No</th>
                    {cols.map((col) => (
                      <th
                        key={col}
                        className="p-2 text-center font-medium cursor-pointer hover:bg-muted/70 select-none min-w-[140px] whitespace-nowrap uppercase"
                        onClick={() => {
                          if (sortColumn === col) setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                          else { setSortColumn(col); setSortDirection("asc"); }
                        }}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {col}
                          {sortColumn === col && (
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
                        {cols.map((col) => (
                          <td
                            key={col}
                            className={cn(
                              "p-2 font-mono min-w-[140px] whitespace-nowrap border-t border-border",
                              getAlignClass(col)
                            )}
                          >
                            {fmtCell(getRowVal(row, col), col)}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={cols.length + 1}
                        className="text-center py-8 text-muted-foreground"
                      >
                        {searchTerm ? "Tidak ada data yang sesuai dengan pencarian" : "Tidak ada data"}
                      </td>
                    </tr>
                  )}
                </tbody>

                {Object.keys(grandTotals).length > 0 && paginatedData.length > 0 && (
                  <tfoot className="sticky bottom-0 z-10">
                    {(() => {
                      const firstSummableIndex = cols.findIndex((col) => isSubsidiNumCol(col));
                      const columnsBeforeSummable = firstSummableIndex > 0 ? firstSummableIndex : 0;
                      return (
                        <tr className="bg-muted font-medium">
                          <td
                            colSpan={1 + columnsBeforeSummable}
                            className="p-2 text-sm font-medium text-center border-t-2 border-primary"
                          >
                            Grand Total
                          </td>
                          {cols.slice(firstSummableIndex).map((col) => (
                            <td
                              key={col}
                              className={cn(
                                "p-2 text-sm font-mono font-medium min-w-[140px] whitespace-nowrap border-t-2 border-primary",
                                getAlignClass(col)
                              )}
                            >
                              {isSubsidiNumCol(col)
                                ? fmtCell(grandTotals[col] ?? 0, col)
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
          <div className="shrink-0 flex flex-col md:grid md:grid-cols-3 items-center gap-3">
            <div className="flex items-center gap-2 order-2 md:order-1">
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

            <div className="flex items-center justify-center order-1 md:order-2 w-full">
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

            <div className="flex items-center justify-end gap-3 order-3 w-full md:w-auto">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {displayStart}-{displayEnd} dari {totalAvailable} baris
              </span>
              <Button variant="destructive" onClick={handleCloseModal} className="w-20">
                Tutup
              </Button>
            </div>
          </div>
        )}

        {!(lastResult && lastResult.success && lastResult.data) && (
          <DialogFooter className="shrink-0">
            <Button variant="destructive" onClick={handleCloseModal} className="w-24">
              Tutup
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Bansos Tayang Modal ───────────────────────────────────────────────────

interface BelwilBansosTayangModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilters: string[];
  reportParams: BelwilBansosReportParams;
  filterValues?: Record<string, FilterValue>;
}

export function BelwilBansosTayangModal({
  open,
  onOpenChange,
  activeFilters,
  reportParams,
  filterValues = {},
}: BelwilBansosTayangModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { executeQuery, isLoading, lastResult } = useBelwilBansosDataApi();

  const normalizedBansosFilters = useMemo(
    () => normalizeActiveFilters(activeFilters),
    [activeFilters],
  );

  const fetchBansosData = async () => {
    try {
      await executeQuery(normalizedBansosFilters, filterValues, reportParams, {
        page: currentPage,
        pageSize,
      });
    } catch (error) {
      console.error("Error fetching bansos data:", error);
    }
  };

  useEffect(() => {
    if (open && activeFilters.length > 0) {
      setCurrentPage(1);
    }
  }, [open, activeFilters, filterValues, reportParams]);

  useEffect(() => {
    if (open && activeFilters.length > 0) {
      fetchBansosData();
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

  const getBansosRowValue = (row: any, column: string) => {
    if (!row) return undefined;
    if (column in row) return row[column];
    const target = column.toUpperCase();
    for (const k of Object.keys(row)) {
      if (k.toUpperCase() === target) return row[k];
    }
    return undefined;
  };

  const bansosProcData = useMemo(() => {
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
        const aVal = getBansosRowValue(a, sortColumn);
        const bVal = getBansosRowValue(b, sortColumn);
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

  const isBansosSummable = (column: string): boolean => {
    const lower = column.toLowerCase();
    return (
      lower === "total_realisasi" ||
      lower === "total_penerima" ||
      /^real\d{1,2}$/.test(lower) ||
      /^jml\d{1,2}$/.test(lower)
    );
  };

  const bansosGrandTotals = useMemo(() => {
    if (!lastResult?.columns) return {};
    const serverTotals = lastResult?.grandTotals;
    if (serverTotals && Object.keys(serverTotals).length > 0) {
      const hasMeaningful = Object.entries(serverTotals).some(
        ([key, val]) =>
          isBansosSummable(key) && typeof val === "number" && val > 0,
      );
      if (hasMeaningful) return serverTotals;
    }
    const clientTotals: Record<string, number> = {};
    lastResult.columns.forEach((column) => {
      if (!isBansosSummable(column)) return;
      const sum = (lastResult?.data || []).reduce((acc, row) => {
        const raw = getBansosRowValue(row, column);
        const num = Number(raw);
        return acc + (!isNaN(num) && raw != null ? num : 0);
      }, 0);
      clientTotals[column] = sum;
    });
    return clientTotals;
  }, [lastResult?.grandTotals, lastResult?.data, lastResult?.columns]);

  const bansosIsServerPag = typeof lastResult?.totalCount === "number";
  const bansosTotalAvail = bansosIsServerPag
    ? lastResult?.totalCount || 0
    : bansosProcData.length;
  const bansosTotalPages = Math.max(1, Math.ceil(bansosTotalAvail / pageSize));
  const bansosStartIdx = (currentPage - 1) * pageSize;
  const bansosEndIdx = bansosStartIdx + pageSize;
  const bansosPaginatedData = bansosIsServerPag
    ? bansosProcData
    : bansosProcData.slice(bansosStartIdx, bansosEndIdx);
  const bansosDisplayStart = bansosTotalAvail === 0 ? 0 : bansosStartIdx + 1;
  const bansosDisplayEnd = bansosIsServerPag
    ? bansosStartIdx + bansosProcData.length
    : Math.min(bansosEndIdx, bansosProcData.length);

  const handleBansosColClick = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const isBansosMonetary = (column: string): boolean => {
    const lower = column.toLowerCase();
    return lower === "total_realisasi" || /^real\d{1,2}$/.test(lower);
  };

  const getBansosCellAlign = (column: string): string => {
    if (
      isBansosMonetary(column) ||
      /^jml\d{1,2}$/.test(column.toLowerCase()) ||
      column.toLowerCase() === "total_penerima"
    )
      return "text-right";
    if (
      column.toLowerCase().includes("uraian") ||
      column.toLowerCase().includes("nm")
    )
      return "text-left";
    return "text-center";
  };

  const formatBansosCell = (value: unknown, column: string): string => {
    if (value == null) return "-";
    const numValue = Number(value);
    const isNumeric = !isNaN(numValue) && value !== "" && value !== null;
    if (isNumeric && isBansosSummable(column)) {
      return new Intl.NumberFormat("id-ID").format(numValue);
    }
    return String(value);
  };

  const handleBansosRefresh = () => {
    fetchBansosData();
    setCurrentPage(1);
    setSearchTerm("");
  };

  const toggleBansosFs = () => setIsFullscreen(!isFullscreen);

  const handleBansosClose = () => {
    setIsFullscreen(false);
    onOpenChange(false);
  };

  const renderPaginationItems = () => {
    const items = [];
    if (bansosTotalPages <= 7) {
      for (let i = 1; i <= bansosTotalPages; i++) {
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
      if (currentPage > 3) items.push(<PaginationEllipsis key="left-ellipsis" />);
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(bansosTotalPages - 1, currentPage + 1);
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
      if (currentPage < bansosTotalPages - 2) items.push(<PaginationEllipsis key="right-ellipsis" />);
      items.push(
        <PaginationItem key={bansosTotalPages}>
          <PaginationLink
            isActive={currentPage === bansosTotalPages}
            onClick={(e) => { e.preventDefault(); setCurrentPage(bansosTotalPages); }}
            className="cursor-pointer select-none"
          >
            {bansosTotalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return items;
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
    <Dialog open={open} onOpenChange={handleBansosClose}>
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
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Table className="w-5 h-5 text-blue-600" />
              <span>
                Hasil Query Bansos Kewilayahan -{" "}
                {reportParams.tipeLaporan === "belwil_bansos_realisasi"
                  ? "Realisasi"
                  : "Jumlah Penerima"}
              </span>
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleBansosRefresh} disabled={isLoading}>
                <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleBansosFs}
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
            {reportParams.akumulatif && <Badge variant="secondary">Akumulatif</Badge>}
            <Badge variant="outline">Filter Aktif: {activeFilters.length}</Badge>
            {lastResult && (
              <>
                <Badge variant="outline" className="flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  {bansosTotalAvail} baris
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
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 w-12 min-w-[48px]">
                      <Skeleton className="h-4 w-6 mx-auto" />
                    </th>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <th key={i} className="p-2 min-w-[140px]">
                        <Skeleton className="h-4 w-24 mx-auto" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }).map((_, rowIdx) => (
                    <tr key={rowIdx}>
                      <td className="p-2 border-t border-border">
                        <Skeleton className="h-3 w-6 mx-auto" />
                      </td>
                      {Array.from({ length: 4 }).map((_, colIdx) => (
                        <td key={colIdx} className="p-2 border-t border-border">
                          <Skeleton className="h-3 w-24 mx-auto" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : lastResult && !lastResult.success ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-sm text-red-600 mb-2">Error: {lastResult.error}</p>
                <Button variant="outline" size="sm" onClick={handleBansosRefresh}>Coba Lagi</Button>
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
                        onClick={() => handleBansosColClick(column)}
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
                  {bansosPaginatedData.length > 0 ? (
                    bansosPaginatedData.map((row, index) => (
                      <tr key={index} className="hover:bg-muted/50">
                        <td className="p-2 text-center w-12 min-w-[48px] border-t border-border">
                          {bansosStartIdx + index + 1}
                        </td>
                        {lastResult.columns?.map((column) => (
                          <td
                            key={column}
                            className={cn(
                              "p-2 font-mono min-w-[140px] whitespace-nowrap border-t border-border",
                              getBansosCellAlign(column)
                            )}
                          >
                            {formatBansosCell(getBansosRowValue(row, column), column)}
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

                {lastResult.columns?.some((c) => isBansosSummable(c)) && bansosPaginatedData.length > 0 && (
                  <tfoot className="sticky bottom-0 z-10">
                    {(() => {
                      const firstSummIdx = lastResult.columns?.findIndex((col) => isBansosSummable(col)) ?? -1;
                      const colsBefore = firstSummIdx > 0 ? firstSummIdx : 0;
                      return (
                        <tr className="bg-muted font-medium">
                          <td
                            colSpan={1 + colsBefore}
                            className="p-2 text-sm font-medium text-center border-t-2 border-primary"
                          >
                            Grand Total
                          </td>
                          {lastResult.columns?.slice(firstSummIdx).map((col) => (
                            <td
                              key={col}
                              className={cn(
                                "p-2 text-sm font-mono font-medium min-w-[140px] whitespace-nowrap border-t-2 border-primary",
                                getBansosCellAlign(col)
                              )}
                            >
                              {isBansosSummable(col)
                                ? bansosGrandTotals[col] != null
                                  ? new Intl.NumberFormat("id-ID").format(Number(bansosGrandTotals[col]))
                                  : "-"
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
          ) : (
            <div className="flex items-center justify-center h-40 text-center text-muted-foreground">
              <p>Klik Refresh untuk memuat data</p>
            </div>
          )}
        </div>

        {/* Pagination + footer */}
        {lastResult && lastResult.success && lastResult.data && (
          <div className="shrink-0 flex flex-col md:grid md:grid-cols-3 items-center gap-3">
            <div className="flex items-center gap-2 order-2 md:order-1">
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

            <div className="flex items-center justify-center order-1 md:order-2 w-full">
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
                    onClick={(e) => { e.preventDefault(); setCurrentPage(Math.min(bansosTotalPages, currentPage + 1)); }}
                    className={cn(
                      "cursor-pointer select-none",
                      currentPage === bansosTotalPages && "pointer-events-none opacity-50"
                    )}
                  />
                </div>
              </Pagination>
            </div>

            <div className="flex items-center justify-end gap-3 order-3 w-full md:w-auto">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {bansosDisplayStart}-{bansosDisplayEnd} dari {bansosTotalAvail} baris
              </span>
              <Button variant="outline" size="sm" onClick={handleBansosClose} className="w-20">
                Tutup
              </Button>
            </div>
          </div>
        )}

        {!(lastResult && lastResult.success && lastResult.data) && (
          <DialogFooter className="shrink-0">
            <Button variant="outline" size="sm" onClick={handleBansosClose} className="w-24">
              Tutup
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
