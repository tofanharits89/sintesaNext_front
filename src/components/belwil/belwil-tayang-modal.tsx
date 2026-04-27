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
                Hasil Query Belanja Kewilayahan -{" "}
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
              : `Belanja Kewilayahan tahun ${reportParams.tahun} dengan ${activeFilters.length} filter aktif`}
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

  useEffect(() => {
    document.body.style.overflow = isFullscreen ? "hidden" : "unset";
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
              <Table className="w-5 h-5 text-teal-600" />
              <span>Hasil Query Kewilayahan Tematik – {tipeLaporanLabel}</span>
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
              : `Kewilayahan Tematik tahun ${reportParams.tahun} dengan ${activeFilters.length} filter aktif`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="secondary">Tahun: {reportParams.tahun}</Badge>
              <Badge variant="secondary">Tipe: {tipeLaporanLabel}</Badge>
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
                    setPageSize(Math.min(parseInt(value), 100));
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

  const cols: string[] =
    lastResult?.columns ||
    (lastResult?.data?.[0] ? Object.keys(lastResult.data[0] as object) : []);

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent
        className={
          isFullscreen
            ? "!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !m-0 !rounded-none !border-0 !translate-x-0 !translate-y-0 !top-0 !left-0 !transform-none flex flex-col overflow-hidden"
            : "max-w-7xl h-[90vh] sm:max-w-7xl flex flex-col overflow-hidden"
        }
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
              <Table className="w-5 h-5 text-teal-600" />
              <span>
                Hasil Query Subsidi Kewilayahan &ndash; {tipeLaporanLabel}
              </span>
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
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
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
            {lastResult?.success && totalAvailable > 0
              ? `Menampilkan ${displayStart}-${displayEnd} dari ${totalAvailable} baris`
              : `Subsidi Kewilayahan tahun ${reportParams.tahun} dengan ${activeFilters.length} filter aktif`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 items-center justify-between mb-2">
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="secondary">Tahun: {reportParams.tahun}</Badge>
            <Badge variant="secondary">Tipe: {tipeLaporanLabel}</Badge>
            {reportParams.jnsBansos && reportParams.jnsBansos !== "all" && (
              <Badge variant="secondary">
                Subsidi: {reportParams.jnsBansos}
              </Badge>
            )}
            <Badge variant="outline">
              Filter Aktif: {activeFilters.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border rounded-md bg-background w-48"
              />
            </div>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[25, 50, 100, 200].map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s} / hal
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <span className="ml-2 text-muted-foreground">
                Memuat data subsidi...
              </span>
            </div>
          ) : lastResult && !lastResult.success ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <p className="text-red-500 font-medium">Error memuat data</p>
                <p className="text-sm text-muted-foreground">
                  {lastResult.error}
                </p>
              </div>
            </div>
          ) : lastResult?.data && lastResult.data.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto opacity-30" />
                <p>Tidak ada data untuk kriteria yang dipilih</p>
              </div>
            </div>
          ) : lastResult?.data ? (
            <div className="overflow-auto h-full rounded-md border">
              <table className="min-w-full text-xs bg-background">
                <thead className="bg-muted/50 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground border-b w-10">
                      #
                    </th>
                    {cols.map((col) => (
                      <th
                        key={col}
                        className={`px-3 py-2 font-medium text-muted-foreground border-b cursor-pointer hover:bg-muted whitespace-nowrap ${getAlignClass(col)}`}
                        onClick={() => {
                          if (sortColumn === col)
                            setSortDirection(
                              sortDirection === "asc" ? "desc" : "asc",
                            );
                          else {
                            setSortColumn(col);
                            setSortDirection("asc");
                          }
                        }}
                      >
                        <span className="flex items-center gap-1">
                          {col}
                          {sortColumn === col && (
                            <Clock
                              className={`w-3 h-3 ${sortDirection === "desc" ? "rotate-180" : ""}`}
                            />
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-3 py-1.5 text-muted-foreground text-center">
                        {startIndex + i + 1}
                      </td>
                      {cols.map((col) => (
                        <td
                          key={col}
                          className={`px-3 py-1.5 whitespace-nowrap ${getAlignClass(col)}`}
                        >
                          {fmtCell(getRowVal(row, col), col)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {Object.keys(grandTotals).length > 0 && (
                    <tr className="border-t-2 font-semibold bg-muted/50 sticky bottom-0">
                      <td className="px-3 py-2 text-center">&#8721;</td>
                      {cols.map((col) => {
                        const t = grandTotals[col];
                        return (
                          <td
                            key={col}
                            className={`px-3 py-2 whitespace-nowrap ${getAlignClass(col)}`}
                          >
                            {t != null
                              ? new Intl.NumberFormat("id-ID").format(t)
                              : ""}
                          </td>
                        );
                      })}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : activeFilters.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">
                Pilih filter terlebih dahulu untuk menampilkan data
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">
                Klik &ldquo;Tayang&rdquo; untuk menampilkan data
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-4 items-center sm:flex-row sm:justify-between flex-shrink-0 pt-4 border-t">
          <div className="flex justify-center sm:flex-1">
            {lastResult?.success && totalPages > 1 && (
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
                Hasil Query Bansos Kewilayahan -{" "}
                {reportParams.tipeLaporan === "belwil_bansos_realisasi"
                  ? "Realisasi"
                  : "Jumlah Penerima"}
              </span>
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBansosRefresh}
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
                onClick={toggleBansosFs}
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
            {lastResult && lastResult.success && bansosTotalAvail > 0
              ? `Menampilkan ${bansosDisplayStart}-${bansosDisplayEnd} dari ${bansosTotalAvail} baris`
              : `Bansos Kewilayahan tahun ${reportParams.tahun} dengan ${activeFilters.length} filter aktif`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="secondary">Tahun: {reportParams.tahun}</Badge>
              <Badge variant="secondary">
                Pembulatan: {reportParams.pembulatan}
              </Badge>
              {reportParams.akumulatif && (
                <Badge variant="secondary">Akumulatif</Badge>
              )}
              <Badge variant="outline">
                Filter Aktif: {activeFilters.length}
              </Badge>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBansosRefresh}
                >
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
                            onClick={() => handleBansosColClick(column)}
                          >
                            <div className="flex items-center justify-center gap-1">
                              {column}
                              {sortColumn === column && (
                                <span className="text-xs">
                                  {sortDirection === "asc"
                                    ? "\u2191"
                                    : "\u2193"}
                                </span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bansosPaginatedData.length > 0 ? (
                        <>
                          {bansosPaginatedData.map((row, index) => (
                            <tr
                              key={index}
                              className="border-t hover:bg-muted/50"
                            >
                              <td className="p-2 text-center text-xs w-16 min-w-[80px]">
                                {bansosStartIdx + index + 1}
                              </td>
                              {lastResult.columns?.map((column) => (
                                <td
                                  key={column}
                                  className={`p-2 ${getBansosCellAlign(column)} text-xs font-mono w-40 min-w-[180px] whitespace-nowrap`}
                                >
                                  {formatBansosCell(
                                    getBansosRowValue(row, column),
                                    column,
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}

                          {lastResult.columns?.some((c) =>
                            isBansosSummable(c),
                          ) && (
                            <tr className="border-t-2 border-primary bg-muted font-medium sticky bottom-0 z-20">
                              {(() => {
                                const firstSummIdx =
                                  lastResult.columns?.findIndex((col) =>
                                    isBansosSummable(col),
                                  ) ?? -1;
                                const colsBefore =
                                  firstSummIdx > 0 ? firstSummIdx : 0;
                                return (
                                  <>
                                    <td
                                      colSpan={colsBefore + 1}
                                      className="p-2 text-xs font-semibold text-right"
                                    >
                                      GRAND TOTAL
                                    </td>
                                    {lastResult.columns
                                      ?.slice(firstSummIdx)
                                      .map((col) => (
                                        <td
                                          key={col}
                                          className="p-2 text-right text-xs font-semibold font-mono"
                                        >
                                          {isBansosSummable(col)
                                            ? bansosGrandTotals[col] != null
                                              ? new Intl.NumberFormat(
                                                  "id-ID",
                                                ).format(
                                                  Number(
                                                    bansosGrandTotals[col],
                                                  ),
                                                )
                                              : "-"
                                            : ""}
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
                            className="text-center text-sm text-muted-foreground py-8"
                          >
                            Tidak ada data yang sesuai dengan filter yang
                            dipilih.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-80">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Klik Refresh untuk memuat data
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {bansosTotalAvail > 0
                ? `${bansosDisplayStart}\u2013${bansosDisplayEnd} dari ${bansosTotalAvail} baris`
                : "Belum ada data"}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1 || isLoading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Sebelumnya
              </Button>
              <span className="text-sm self-center px-2">
                Halaman {currentPage} / {bansosTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= bansosTotalPages || isLoading}
                onClick={() =>
                  setCurrentPage((p) => Math.min(bansosTotalPages, p + 1))
                }
              >
                Berikutnya
              </Button>
              <Button variant="outline" size="sm" onClick={handleBansosClose}>
                Tutup
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
