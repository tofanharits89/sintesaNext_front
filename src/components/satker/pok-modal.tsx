"use client";

import { useEffect, useState, useMemo } from "react";
import { RefreshCw, AlertCircle, FileSpreadsheet, Search, ChevronRight, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/animate-ui/components/radix/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiPath } from "@/lib/config/base-path";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils/utils";

interface PokModalProps {
  isOpen: boolean;
  onClose: () => void;
  pokUrl: string | null;
  title?: string;
}

interface PokRow {
  index: number;
  kode: string;
  uraian: string;
  volume: string;
  hargaSatuan: string;
  jumlah: string;
  sdCp: string;
  level: number;
  hasChildren: boolean;
  parentIndex: number;
}

export function PokModal({ isOpen, onClose, pokUrl, title = "POK" }: PokModalProps) {
  const [data, setData] = useState<PokRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Fetch and Parse POK HTML Content into Structured typed React State
  useEffect(() => {
    if (!isOpen || !pokUrl) {
      setData([]);
      setError(null);
      setSearchQuery("");
      setExpandedRows(new Set());
      return;
    }

    let isMounted = true;
    const fetchAndParseHtml = async () => {
      setLoading(true);
      setError(null);
      try {
        const proxyUrl = apiPath(
          `/satker/satudja-proxy?url=${encodeURIComponent(pokUrl)}`,
        );
        const response = await fetch(proxyUrl, { credentials: "include" });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const text = await response.text();
        
        if (isMounted) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, "text/html");
          
          // Locate target table element
          const tableElement = doc.querySelector("table#pvtTable");
          if (!tableElement) {
            throw new Error("Format tabel POK tidak valid atau tidak ditemukan");
          }

          const rows = Array.from(tableElement.querySelectorAll("tr"));
          if (rows.length === 0) {
            throw new Error("Tabel POK tidak memiliki data");
          }

          const parsedRows: PokRow[] = [];
          const lastRowAtLevel: { [key: number]: number } = {};

          rows.forEach((row) => {
            const cells = Array.from(row.cells);
            
            // Skip header rows
            const isHeader = row.querySelector("th") !== null || row.cells[0]?.tagName === "TH";
            if (isHeader) return;

            if (cells.length < 2) return; // Skip empty rows

            // Parse level from cell class name, row class name, or default to 0
            const cellClassName = cells[0]?.className || "";
            const rowClassName = row.className || "";
            const levelMatch = cellClassName.match(/level-(\d+)/) || rowClassName.match(/level-(\d+)/);
            const level = levelMatch && levelMatch[1] ? parseInt(levelMatch[1], 10) : 0;

            const index = parsedRows.length;
            lastRowAtLevel[level] = index;

            const parentIndex = level > 0 ? (lastRowAtLevel[level - 1] ?? -1) : -1;

            // Extract display code by stripping the hidden parent hierarchy path if present
            const rawKode = cells[0]?.textContent || "";
            const kode = rawKode.includes("||") ? (rawKode.split("||")[1]?.trim() || "") : rawKode.trim();

            // Correctly map cells. If there are 7 cells, the SD/CP is at index 6 (due to double-column colspan on Jumlah)
            const sdCp = (cells.length > 6 ? cells[6] : cells[5])?.textContent?.trim() || "";

            parsedRows.push({
              index,
              kode,
              uraian: cells[1]?.textContent?.trim() || "",
              volume: cells[2]?.textContent?.trim() || "",
              hargaSatuan: cells[3]?.textContent?.trim() || "",
              jumlah: cells[4]?.textContent?.trim() || "",
              sdCp,
              level,
              hasChildren: false,
              parentIndex,
            });
          });

          // Mark parents who have children
          parsedRows.forEach((row) => {
            if (row.parentIndex !== -1) {
              const parentRow = parsedRows[row.parentIndex];
              if (parentRow) {
                parentRow.hasChildren = true;
              }
            }
          });

          // Expand level 0 and root rows by default so that programs are visible on initial load
          const initialExpanded = new Set<number>();
          parsedRows.forEach((row) => {
            if ((row.level === 0 || row.parentIndex === -1) && row.hasChildren) {
              initialExpanded.add(row.index);
            }
          });
          setExpandedRows(initialExpanded);

          setData(parsedRows);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Gagal memuat konten POK");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAndParseHtml();
    return () => {
      isMounted = false;
    };
  }, [isOpen, pokUrl, refreshTrigger]);

  // Recursively check if row is visible under current parent expansions
  const isRowVisible = (row: PokRow, allData: PokRow[]) => {
    if (row.level === 0) return true;
    let currentParentIndex = row.parentIndex;
    while (currentParentIndex !== -1) {
      const parentRow = allData[currentParentIndex];
      if (!parentRow) break;
      if (!expandedRows.has(currentParentIndex)) return false;
      currentParentIndex = parentRow.parentIndex;
    }
    return true;
  };

  // Toggle Node expansion
  const toggleRow = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
        // Recursively collapse descendants
        data.forEach((r) => {
          let pIdx = r.parentIndex;
          while (pIdx !== -1) {
            if (pIdx === index) {
              next.delete(r.index);
              break;
            }
            const parentRow = data[pIdx];
            pIdx = parentRow ? parentRow.parentIndex : -1;
          }
        });
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Real-Time Search Filter with Hierarchy Path Preservation
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) {
      return data.filter((row) => isRowVisible(row, data));
    }

    const query = searchQuery.toLowerCase();
    const matchingIndices = new Set<number>();

    data.forEach((row) => {
      const matches =
        row.kode.toLowerCase().includes(query) ||
        row.uraian.toLowerCase().includes(query) ||
        row.jumlah.toLowerCase().includes(query);
      if (matches) {
        matchingIndices.add(row.index);
      }
    });

    const indicesToKeep = new Set<number>();
    matchingIndices.forEach((idx) => {
      let currentIdx = idx;
      while (currentIdx !== -1) {
        indicesToKeep.add(currentIdx);
        const row = data[currentIdx];
        currentIdx = row ? row.parentIndex : -1;
      }
    });

    return data.filter((row) => indicesToKeep.has(row.index));
  }, [data, searchQuery, expandedRows]);

  // Clean structured Spreadsheet Excel Export
  const handleDownloadExcel = () => {
    if (data.length === 0) {
      alert("Tabel POK tidak memiliki data");
      return;
    }

    const excelRows = data.map((row) => ({
      "Kode": row.kode,
      "Program/ Kegiatan/ KRO/ RO/ Komponen": row.uraian,
      "Volume": row.volume,
      "Harga Satuan": row.hargaSatuan,
      "Jumlah": row.jumlah,
      "SD/CP": row.sdCp,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelRows);

    ws["!cols"] = [
      { wch: 15 },
      { wch: 45 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "POK");
    const safeTitle = (title || "POK").replace(/[\\/:*?"<>|]/g, "_");
    XLSX.writeFile(wb, `${safeTitle}.xlsx`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="max-w-7xl sm:max-w-7xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden"
        aria-describedby={undefined}
      >
        <DialogHeader className="p-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <DialogTitle className="truncate font-semibold text-lg">{title}</DialogTitle>
          {!loading && !error && data.length > 0 && (
            <div className="relative w-full sm:w-72 shrink-0">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari kode or uraian..."
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-muted/20 p-6">
          {loading && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="overflow-auto border border-border rounded-xl shadow-sm bg-card max-h-full">
                <table className="w-full table-fixed border-separate border-spacing-0 text-xs">
                  <colgroup>
                    <col className="w-[110px]" />
                    <col />
                    <col className="w-[150px]" />
                    <col className="w-[125px]" />
                    <col className="w-[130px]" />
                    <col className="w-[85px]" />
                  </colgroup>
                  <thead className="sticky top-0 z-10 bg-muted select-none">
                    <tr>
                      <th className="h-12 px-4 text-center font-semibold text-muted-foreground border-b border-border text-xs tracking-wider uppercase truncate" title="Kode">Kode</th>
                      <th className="h-12 px-4 text-center font-semibold text-muted-foreground border-b border-border text-xs tracking-wider uppercase truncate" title="Program/ Kegiatan/ KRO/ RO/ Komponen">Program/ Kegiatan/ KRO/ RO/ Komponen</th>
                      <th className="h-12 px-4 text-center font-semibold text-muted-foreground border-b border-border text-xs tracking-wider uppercase truncate" title="Volume">Volume</th>
                      <th className="h-12 px-4 text-center font-semibold text-muted-foreground border-b border-border text-xs tracking-wider uppercase whitespace-normal leading-tight" title="Harga Satuan">Harga Satuan</th>
                      <th className="h-12 px-4 text-center font-semibold text-muted-foreground border-b border-border text-xs tracking-wider uppercase truncate" title="Jumlah">Jumlah</th>
                      <th className="h-12 px-4 text-center font-semibold text-muted-foreground border-b border-border text-xs tracking-wider uppercase truncate" title="Sumber Dana / Cara Penarikan">SD/CP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { level: 0, kodeWidth: "w-20", descWidth: "w-[80%]", volWidth: "w-12", priceWidth: "w-16", totalWidth: "w-24", sdWidth: "w-10" },
                      { level: 1, kodeWidth: "w-24", descWidth: "w-[70%]", volWidth: "w-8", priceWidth: "w-20", totalWidth: "w-28", sdWidth: "w-8" },
                      { level: 2, kodeWidth: "w-16", descWidth: "w-[50%]", volWidth: "w-10", priceWidth: "w-16", totalWidth: "w-20", sdWidth: "w-6" },
                      { level: 2, kodeWidth: "w-16", descWidth: "w-[45%]", volWidth: "w-10", priceWidth: "w-18", totalWidth: "w-22", sdWidth: "w-6" },
                      { level: 3, kodeWidth: "w-12", descWidth: "w-[35%]", volWidth: "w-6", priceWidth: "w-14", totalWidth: "w-16", sdWidth: "w-4" },
                      { level: 1, kodeWidth: "w-24", descWidth: "w-[65%]", volWidth: "w-12", priceWidth: "w-20", totalWidth: "w-28", sdWidth: "w-8" },
                      { level: 2, kodeWidth: "w-20", descWidth: "w-[55%]", volWidth: "w-10", priceWidth: "w-16", totalWidth: "w-22", sdWidth: "w-6" },
                      { level: 0, kodeWidth: "w-20", descWidth: "w-[75%]", volWidth: "w-14", priceWidth: "w-22", totalWidth: "w-32", sdWidth: "w-10" },
                      { level: 1, kodeWidth: "w-24", descWidth: "w-[60%]", volWidth: "w-8", priceWidth: "w-18", totalWidth: "w-24", sdWidth: "w-8" },
                    ].map((row, idx) => (
                      <tr 
                        key={idx} 
                        className={cn(
                          "border-b border-border/60 align-middle",
                          row.level === 0 ? "bg-muted/10 font-semibold" : ""
                        )}
                      >
                        <td className="p-3.5 px-4">
                          <div className={cn("h-4 bg-muted-foreground/15 rounded animate-pulse", row.kodeWidth)} />
                        </td>
                        <td 
                          className="p-3.5 px-4 text-left"
                          style={{ paddingLeft: `${16 + row.level * 20}px` }}
                        >
                          <div className="flex items-center gap-1.5 w-full min-w-0">
                            {row.level > 0 && (
                              <div className="w-3.5 h-3.5 rounded bg-muted-foreground/10 animate-pulse shrink-0" />
                            )}
                            <div className={cn("h-4 bg-muted-foreground/15 rounded animate-pulse", row.descWidth)} />
                          </div>
                        </td>
                        <td className="p-3.5 px-4 text-center">
                          <div className={cn("h-4 bg-muted-foreground/15 rounded animate-pulse mx-auto", row.volWidth)} />
                        </td>
                        <td className="p-3.5 px-4 text-right">
                          <div className={cn("h-4 bg-muted-foreground/15 rounded animate-pulse ml-auto", row.priceWidth)} />
                        </td>
                        <td className="p-3.5 px-4 text-right">
                          <div className={cn("h-4 bg-muted-foreground/15 rounded animate-pulse ml-auto", row.totalWidth)} />
                        </td>
                        <td className="p-3.5 px-4 text-center">
                          <div className={cn("h-4 bg-muted-foreground/15 rounded animate-pulse mx-auto", row.sdWidth)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-destructive px-6 text-center">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setError(null);
                  setRefreshTrigger((prev) => prev + 1);
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
            </div>
          )}

          {!loading && !error && data.length > 0 && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="overflow-auto border border-border rounded-xl shadow-sm bg-card max-h-full">
                <table className="w-full table-fixed border-separate border-spacing-0 text-xs">
                  <colgroup>
                    <col className="w-[110px]" />
                    <col />
                    <col className="w-[150px]" />
                    <col className="w-[125px]" />
                    <col className="w-[130px]" />
                    <col className="w-[85px]" />
                  </colgroup>
                  <thead className="sticky top-0 z-10 bg-muted select-none">
                    <tr>
                      <th className="h-12 px-4 text-center font-semibold text-muted-foreground border-b border-border text-xs tracking-wider uppercase truncate" title="Kode">Kode</th>
                      <th className="h-12 px-4 text-center font-semibold text-muted-foreground border-b border-border text-xs tracking-wider uppercase truncate" title="Program/ Kegiatan/ KRO/ RO/ Komponen">Program/ Kegiatan/ KRO/ RO/ Komponen</th>
                      <th className="h-12 px-4 text-center font-semibold text-muted-foreground border-b border-border text-xs tracking-wider uppercase truncate" title="Volume">Volume</th>
                      <th className="h-12 px-4 text-center font-semibold text-muted-foreground border-b border-border text-xs tracking-wider uppercase whitespace-normal leading-tight" title="Harga Satuan">Harga Satuan</th>
                      <th className="h-12 px-4 text-center font-semibold text-muted-foreground border-b border-border text-xs tracking-wider uppercase truncate" title="Jumlah">Jumlah</th>
                      <th className="h-12 px-4 text-center font-semibold text-muted-foreground border-b border-border text-xs tracking-wider uppercase truncate" title="Sumber Dana / Cara Penarikan">SD/CP</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {filteredRows.map((row) => {
                        const isExpanded = expandedRows.has(row.index);
                        const isMainRow = row.level === 0;

                        return (
                          <motion.tr
                            key={row.index}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.12 }}
                            onClick={() => row.hasChildren && toggleRow(row.index)}
                            className={cn(
                              "border-b border-border/60 hover:bg-muted/40 transition-colors duration-100 align-middle",
                              isMainRow ? "bg-muted/15 font-semibold text-foreground" : 
                              row.level === 1 ? "font-medium text-foreground" : "text-muted-foreground",
                              row.hasChildren && "cursor-pointer select-none"
                            )}
                          >
                            {/* Column 1: Kode */}
                            <td 
                              className="p-3.5 px-4 font-mono text-xs tracking-tight text-left truncate max-w-0 select-all"
                              title={row.kode}
                            >
                              {row.kode}
                            </td>

                            {/* Column 2: Uraian accordion */}
                            <td 
                              className="p-3.5 px-4 text-left truncate max-w-0"
                              style={{ paddingLeft: `${16 + row.level * 20}px` }}
                              title={row.uraian}
                            >
                              <div className="flex items-center gap-1.5 w-full min-w-0">
                                {row.hasChildren && (
                                  <span className="shrink-0 text-primary p-0.5 rounded hover:bg-muted transition-colors">
                                    {isExpanded ? (
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5" />
                                    )}
                                  </span>
                                )}
                                <span className={cn(
                                  "truncate",
                                  isMainRow && "tracking-wide"
                                )}>
                                  {row.uraian}
                                </span>
                              </div>
                            </td>

                            {/* Column 3: Volume */}
                            <td 
                              className="p-3.5 px-4 text-center whitespace-nowrap text-xs truncate max-w-0"
                              title={row.volume}
                            >
                              {row.volume}
                            </td>

                            {/* Column 4: Harga Satuan */}
                            <td 
                              className="p-3.5 px-4 text-right font-mono text-xs tracking-tight truncate max-w-0"
                              title={row.hargaSatuan}
                            >
                              {row.hargaSatuan}
                            </td>

                            {/* Column 5: Jumlah */}
                            <td 
                              className={cn(
                                "p-3.5 px-4 text-right font-mono text-xs tracking-tight truncate max-w-0",
                                isMainRow ? "font-semibold text-foreground" : "text-muted-foreground"
                              )}
                              title={row.jumlah}
                            >
                              {row.jumlah}
                            </td>

                            {/* Column 6: SD/CP */}
                            <td 
                              className="p-3.5 px-4 text-center text-xs whitespace-nowrap truncate max-w-0"
                              title={row.sdCp}
                            >
                              {row.sdCp}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-4 sm:justify-between flex items-center gap-4">
          <div className="text-xs text-muted-foreground">
            {!loading && !error && data.length > 0 && (
              <p>Menampilkan {filteredRows.length} dari {data.length} baris POK</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {data.length > 0 && !loading && !error && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadExcel}
                className="bg-green-700 text-white hover:bg-green-600 hover:text-white border-green-700 hover:border-green-600 cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                Unduh Excel
              </Button>
            )}
            <Button size="sm" onClick={onClose} className="cursor-pointer">
              Tutup
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
