"use client";

import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { useBelanjaNegaraWeekly, type BelanjaNegaraRow } from "@/hooks/use-belanja-negara-weekly";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format number in trillions (Rp triliun) */
function fmtTriliun(value: number | null | undefined): string {
  if (value == null) return "-";
  const t = value / 1_000_000_000_000;
  return t.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** Format a percentage */
function fmtPct(value: number | null | undefined): string {
  if (value == null) return "-";
  return value.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
}

/** Growth value color */
function growthColor(value: number | null): string {
  if (value == null) return "";
  return value >= 0 ? "bn-positive" : "bn-negative";
}

/** Row level determines indentation & weight */
function rowLevel(uraian: string): "l1" | "l2" | "l3" {
  if (uraian.startsWith("    ")) return "l3";
  if (uraian.startsWith("  ")) return "l2";
  return "l1";
}

/** Format a date object to YYYY-MM-DD (local) */
function toLocalISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Add days to a date and return YYYY-MM-DD */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return toLocalISO(d);
}

/** Get the last working day before a given date */
function getLastWorkingDay(d: Date): Date {
  const result = new Date(d);
  result.setDate(result.getDate() - 1);
  while (result.getDay() === 0 || result.getDay() === 6) {
    result.setDate(result.getDate() - 1);
  }
  return result;
}

/** 
 * Default for the date range picker:
 * Monday of this week to Today (if Mon-Fri)
 * OR Monday to Friday of the week that just ended (if Sat-Sun)
 */
function getDefaultRange(): { from: Date; to: Date } {
  const to = new Date();
  const day = to.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
  
  if (day === 0) { // Sunday -> Friday
    to.setDate(to.getDate() - 2);
  } else if (day === 6) { // Saturday -> Friday
    to.setDate(to.getDate() - 1);
  }
  
  const from = new Date(to);
  const toDay = from.getDay(); // Now guaranteed 1-5
  from.setDate(from.getDate() - (toDay - 1));
  
  return { from, to };
}


// ─── Skeleton ────────────────────────────────────────────────────────────────

/** Skeleton that mirrors the belanja negara table structure (13 columns) */
function BelanjaNegaraTableSkeleton() {
  // 13 columns: 1 sticky label + 3 (2025) + 9 (2026)
  const COL_COUNT = 13;
  const ROWS = 10;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-separate border-spacing-0">
        {/* Header row 1 */}
        <thead>
          <tr className="bg-zinc-100/80">
            <th className="p-2 border-b border-r border-zinc-200 min-w-[16rem]">
              <Skeleton className="h-4 w-28 bg-zinc-300/70" />
            </th>
            {/* 2025 group label */}
            <th colSpan={3} className="p-2 border-b border-r border-zinc-200 text-center">
              <Skeleton className="h-4 w-20 mx-auto bg-zinc-300/70" />
            </th>
            {/* 2026 group label */}
            <th colSpan={9} className="p-2 border-b border-zinc-200 text-center">
              <Skeleton className="h-4 w-20 mx-auto bg-zinc-300/70" />
            </th>
          </tr>
          {/* Header row 2 — sub-columns */}
          <tr className="bg-zinc-50/80">
            {Array.from({ length: COL_COUNT }).map((_, i) => (
              <th key={i} className="p-2 border-b border-r border-zinc-200 last:border-r-0">
                <Skeleton className="h-3 w-14 mx-auto bg-zinc-300/60" />
              </th>
            ))}
          </tr>
        </thead>

        {/* Body rows */}
        <tbody>
          {Array.from({ length: ROWS }).map((_, rowIdx) => (
            <tr key={rowIdx} className={rowIdx % 2 === 0 ? "bg-white" : "bg-zinc-50/40"}>
              {/* Sticky label cell — vary widths to mimic hierarchy */}
              <td className="p-2 border-b border-r border-zinc-200 min-w-[16rem]">
                <Skeleton
                  className={cn(
                    "h-3 bg-zinc-200/80",
                    rowIdx % 3 === 0 ? "w-40" : rowIdx % 3 === 1 ? "w-52 ml-3" : "w-44 ml-6"
                  )}
                />
              </td>
              {/* Data cells */}
              {Array.from({ length: COL_COUNT - 1 }).map((_, colIdx) => (
                <td key={colIdx} className="p-2 border-b border-r border-zinc-200 last:border-r-0">
                  {/* Every 3rd column mimics a badge */}
                  {colIdx === 2 || colIdx === 8 || colIdx === 9 ? (
                    <Skeleton className="h-5 w-14 rounded-full mx-auto bg-zinc-200/80" />
                  ) : (
                    <Skeleton className="h-3 w-14 ml-auto bg-zinc-200/80" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BelanjaNegaraWeekly({ 
  dateRange, 
  onDateChange, 
  onApply,
  isLoading,
  onExport
}: { 
  dateRange?: DateRange; 
  onDateChange?: (range: DateRange | undefined) => void;
  onApply?: () => void;
  isLoading?: boolean;
  onExport?: () => void;
} = {}) {
  // Compute default values
  const defaultRange = getDefaultRange();
  const defaultFromStr = toLocalISO(defaultRange.from);
  const defaultToStr = toLocalISO(defaultRange.to);

  // Date range state (Minggu Ini)
  const [range, setRange] = useState<DateRange | undefined>(
    dateRange || {
      from: defaultRange.from,
      to: defaultRange.to
    }
  );

  // Applied params (only updated on "Tampilkan" click)
  const [appliedParams, setAppliedParams] = useState({
    tglSd2026: toLocalISO(getLastWorkingDay(defaultRange.from)),
    tglAwal2026: defaultFromStr,
    tglAkhir2026: defaultToStr,
    tglYoy2025: (() => {
      const d = new Date(defaultRange.to);
      d.setFullYear(d.getFullYear() - 1);
      return toLocalISO(d);
    })(),
    tglReal2025: (() => {
      const d = new Date(defaultRange.to);
      d.setFullYear(d.getFullYear() - 1);
      return toLocalISO(d);
    })(),
  });

  const { data, isLoading: dataLoading, error, refetch } = useBelanjaNegaraWeekly(appliedParams);

  const handleApply = () => {
    if (!range?.from || !range?.to) return;

    const tglAwal = toLocalISO(range.from);
    const tglAkhir = toLocalISO(range.to);
    const tglSd = toLocalISO(getLastWorkingDay(range.from));
    
    // Calculate 2025 date automatically from 2026 Akhir Minggu Ini
    const d2025 = new Date(range.to);
    d2025.setFullYear(d2025.getFullYear() - 1);
    const tgl2025 = toLocalISO(d2025);

    setAppliedParams({ 
      tglSd2026: tglSd, 
      tglAwal2026: tglAwal, 
      tglAkhir2026: tglAkhir, 
      tglYoy2025: tgl2025, 
      tglReal2025: tgl2025 
    });

    onApply?.();
  };

  const handleExportExcel = () => {
    if (!data || data.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BelanjaNegara");
    const currentDate = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Belanja_Negara_${currentDate}.xlsx`);
  };

  // Derive title info from params
  const titleDate = appliedParams.tglAkhir2026
    ? new Date(appliedParams.tglAkhir2026).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
    })
    : "-";

  // Total BN row for subtitle
  const bnRow = useMemo(() => data.find(r => r.uraian === "BELANJA NEGARA"), [data]);

  return (
    <>
      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 border-b bg-red-50/50 rounded-lg mb-4">
          <div className="bn-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {String((error as any)?.message || error)}
          </div>
        </div>
      )}

      {/* ── Content (Table / Loading) ────────────────────────────────────────── */}
      {dataLoading ? (
        <BelanjaNegaraTableSkeleton />
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table className="w-full border-separate border-spacing-0 text-xs">
            <TableHeader className="bg-background sticky top-0 z-10 shadow-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead rowSpan={2} className="bg-background p-3 text-left font-semibold text-[11px] border-r border-border min-w-[16rem]">
                  Uraian<br /><span className="text-[10px] font-normal text-muted-foreground">(Rp triliun)</span>
                </TableHead>

                {/* 2025 group */}
                <TableHead colSpan={3} className="bg-background p-3 text-center font-bold text-[12px] border-r border-border text-foreground">
                  Tahun 2025
                </TableHead>

                {/* 2026 group */}
                <TableHead colSpan={9} className="bg-background p-3 text-center font-bold text-[12px] border-border text-foreground">
                  Tahun 2026
                </TableHead>
              </TableRow>
              <TableRow className="hover:bg-transparent border-b border-border">
                {/* 2025 sub-headers */}
                <TableHead className="bg-background p-3 text-center font-semibold text-[11px] border-r border-border text-foreground/80 min-w-[6.5rem]">APBN<br />2025</TableHead>
                <TableHead className="bg-background p-3 text-center font-semibold text-[11px] border-r border-border text-foreground/80 min-w-[6.5rem]">Real s.d. {appliedParams.tglReal2025 ? new Date(appliedParams.tglReal2025).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' }) : "-"}</TableHead>
                <TableHead className="bg-background p-3 text-center font-semibold text-[11px] border-r border-border text-foreground/80 min-w-[6.5rem]">% thd<br />APBN</TableHead>

                {/* 2026 sub-headers */}
                <TableHead className="bg-background p-3 text-center font-semibold text-[11px] border-r border-border text-foreground/80 min-w-[6.5rem]">APBN<br />2026</TableHead>
                <TableHead className="bg-background p-3 text-center font-semibold text-[11px] border-r border-border text-foreground/80 min-w-[6.5rem]">DIPA<br />2026</TableHead>
                <TableHead className="bg-background p-3 text-center font-semibold text-[11px] border-r border-border text-foreground/80 min-w-[6.5rem]">Real s.d. {appliedParams.tglSd2026 ? new Date(appliedParams.tglSd2026).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' }) : "-"}</TableHead>
                <TableHead className="bg-background p-3 text-center font-semibold text-[11px] border-r border-border text-foreground/80 min-w-[6.5rem]">Real Minggu Ini<br />({appliedParams.tglAwal2026 ? new Date(appliedParams.tglAwal2026).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' }) : "-"} – {appliedParams.tglAkhir2026 ? new Date(appliedParams.tglAkhir2026).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' }) : "-"})</TableHead>
                <TableHead className="bg-background p-3 text-center font-semibold text-[11px] border-r border-border text-foreground/80 min-w-[6.5rem]">Real s.d. {appliedParams.tglAkhir2026 ? new Date(appliedParams.tglAkhir2026).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' }) : "-"}</TableHead>
                <TableHead className="bg-background p-3 text-center font-semibold text-[11px] border-r border-border text-foreground/80 min-w-[6.5rem]">% thd<br />APBN</TableHead>
                <TableHead className="bg-background p-3 text-center font-semibold text-[11px] border-r border-border text-foreground/80 min-w-[6.5rem]">% thd<br />DIPA</TableHead>
                <TableHead className="bg-background p-3 text-center font-semibold text-[11px] border-r border-border text-foreground/80 min-w-[6.5rem]">Sisa Pagu<br />APBN</TableHead>
                <TableHead className="bg-background p-3 text-center font-semibold text-[11px] border-border text-foreground/80 min-w-[6.5rem]">Growth<br />YoY (%)</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="p-4 text-center text-muted-foreground border-b border-border">
                    Tidak ada data untuk parameter yang dipilih.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, idx) => {
                  const level = rowLevel(row.uraian);
                  const growth = row["Growth YoY (%)"];
                  return (
                    <TableRow key={idx} className={cn("hover:bg-muted/50 border-b border-border", `bn-tr-${level}`)}>
                      <TableCell className={cn(
                        "p-3 text-left border-r border-border whitespace-normal min-w-[16rem]",
                        level === "l1" && "font-bold text-[13px] bg-muted/30",
                        level === "l2" && "font-semibold pl-6",
                        level === "l3" && "font-normal pl-9 text-muted-foreground"
                      )}>
                        {row.uraian}
                      </TableCell>

                      {/* 2025 */}
                      <TableCell className="p-3 text-right font-mono border-r border-border">{fmtTriliun(row["Pagu 2025"])}</TableCell>
                      <TableCell className="p-3 text-right font-mono border-r border-border">{fmtTriliun(row.real_sd_prev_year)}</TableCell>
                      <TableCell className="p-3 text-center border-r border-border">
                        <Badge variant="secondary" className="font-bold px-3 font-mono">
                          {fmtPct(row["% Capaian 2025"])}
                        </Badge>
                      </TableCell>

                      {/* 2026 */}
                      <TableCell className="p-3 text-right font-mono border-r border-border">{fmtTriliun(row["APBN 2026"])}</TableCell>
                      <TableCell className="p-3 text-right font-mono border-r border-border">{fmtTriliun(row["DIPA 2026"])}</TableCell>
                      <TableCell className="p-3 text-right font-mono border-r border-border">{fmtTriliun(row.real_sd_prev)}</TableCell>
                      <TableCell className="p-3 text-right font-mono border-r border-border">{fmtTriliun(row.real_weekly)}</TableCell>
                      <TableCell className="p-3 text-right font-mono border-r border-border bg-muted/20">{fmtTriliun(row.real_sd_curr)}</TableCell>
                      <TableCell className="p-3 text-center border-r border-border">
                        <Badge variant="secondary" className="font-bold px-3 font-mono">{fmtPct(row["% thd APBN"])}</Badge>
                      </TableCell>
                      <TableCell className="p-3 text-center border-r border-border">
                        <Badge variant="secondary" className="font-bold px-3 font-mono">{fmtPct(row["% thd DIPA"])}</Badge>
                      </TableCell>
                      <TableCell className="p-3 text-right font-mono border-r border-border">{fmtTriliun(row["Sisa Pagu APBN"])}</TableCell>
                      <TableCell className="p-3 text-center border-border">
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-bold px-3 font-mono",
                            growth && growth > 0 ? "text-green-600 border-green-200 bg-green-50/50" :
                              growth && growth < 0 ? "text-red-600 border-red-200 bg-red-50/50" :
                                "text-muted-foreground"
                          )}
                        >
                          {fmtPct(growth)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="bn-source text-xs text-muted-foreground mt-4">
        Sumber: OMSPAN Dit.PKN — data diperbarui s.d. {titleDate}
      </p>
    </>
  );
}
