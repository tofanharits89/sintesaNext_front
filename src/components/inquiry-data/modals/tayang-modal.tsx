"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Download, 
  FileSpreadsheet, 
  FileText,
  Clock,
  BarChart3
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
  const { executeQuery, downloadCSV, downloadExcel, isLoading, lastResult } = useInquiryDataApi();

  const fetchData = async () => {
    try {
      await executeQuery(activeFilters, filterValues, reportParams);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (open && activeFilters.length > 0) {
      fetchData();
    }
  }, [open, activeFilters, filterValues, reportParams]);

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

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = processedData.slice(startIndex, endIndex);

  // Handle column header click for sorting
  const handleColumnClick = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Format cell value for display
  const formatCellValue = (value: any, column: string): string => {
    if (value == null) return "-";
    
    // Format numeric values
    if (typeof value === "number") {
      // Check if it's a percentage
      if (column.toLowerCase().includes("persentase")) {
        return `${value.toFixed(2)}%`;
      }
      // Check if it's a monetary value
      if (column.toLowerCase().includes("pagu") || 
          column.toLowerCase().includes("realisasi") || 
          column.toLowerCase().includes("anggaran")) {
        return new Intl.NumberFormat("id-ID").format(value);
      }
      return value.toLocaleString("id-ID");
    }
    
    return String(value);
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
      pergerakan_blokir_bulanan_per_jenis: "Pergerakan Blokir Bulanan Per Jenis",
      volume_output_kegiatan: "Volume Output Kegiatan (Data Caput)",
    };
    return labels[tipeLaporan] || tipeLaporan;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[80vh] sm:max-w-7xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Hasil Query - {getReportTypeLabel(reportParams.tipeLaporan)}</span>
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
        </DialogHeader>

        {/* Query Summary */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="secondary">
              Tahun: {reportParams.tahun}
            </Badge>
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

        {/* Content */}
        <ScrollArea className="h-[50vh] w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Mengeksekusi query...</p>
              </div>
            </div>
          ) : lastResult && !lastResult.success ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <p className="text-sm text-red-600 mb-2">Error: {lastResult.error}</p>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  Coba Lagi
                </Button>
              </div>
            </div>
          ) : lastResult && lastResult.success && lastResult.data ? (
            <div className="border rounded-lg">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium">No</th>
                    {lastResult.columns?.map((column) => (
                      <th
                        key={column}
                        className="p-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleColumnClick(column)}
                      >
                        <div className="flex items-center gap-1">
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
                    paginatedData.map((row, index) => (
                      <tr key={index} className="border-t hover:bg-muted/50">
                        <td className="p-3 text-sm">{startIndex + index + 1}</td>
                        {lastResult.columns?.map((column) => (
                          <td key={column} className="p-3 text-sm font-mono">
                            {formatCellValue(row[column], column)}
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
              </table>
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
        </ScrollArea>

        {/* Pagination */}
        {lastResult && lastResult.success && totalPages > 1 && (
          <div className="flex items-center justify-between py-2">
            <p className="text-sm text-muted-foreground">
              Menampilkan {startIndex + 1}-{Math.min(endIndex, processedData.length)} dari {processedData.length} baris
              {searchTerm && ` (difilter dari ${lastResult.rowCount} total)`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Sebelumnya
              </Button>
              <span className="text-sm">
                Halaman {currentPage} dari {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {lastResult && lastResult.success ? `Total: ${lastResult.rowCount} baris data` : "Siap untuk menampilkan data"}
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
