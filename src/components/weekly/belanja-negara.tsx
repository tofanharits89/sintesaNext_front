"use client";

import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { useBelanjaNegaraWeekly, type BelanjaNegaraRow } from "@/hooks/use-belanja-negara-weekly";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/utils";
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


// ─── Main Component ───────────────────────────────────────────────────────────

export default function BelanjaNegaraWeekly() {
  // Compute default values
  const defaultRange = getDefaultRange();
  const defaultFromStr = toLocalISO(defaultRange.from);
  const defaultToStr = toLocalISO(defaultRange.to);

  // Date range state (Minggu Ini)
  const [range, setRange] = useState<DateRange | undefined>({
    from: defaultRange.from,
    to: defaultRange.to
  });

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

  const { data, isLoading, error, refetch } = useBelanjaNegaraWeekly(appliedParams);

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
    <section className="bn-section">
      {/* ── Header ─────────────────────────────────────────────────────────── */}

      {/* ── Table & Filter Container ───────────────────────────────────────── */}
      <div className="rounded-xl border overflow-hidden bg-card shadow-sm">
        {/* integrated filter header */}
        <div className="p-4 border-b bg-muted/40 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Periode Minggu Ini</span>
              </div>
              <DateRangePicker 
                date={range} 
                onDateChange={setRange}
                disabledDates={{ dayOfWeek: [0, 6] }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={isLoading || data.length === 0}
              className="h-9 px-3"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span className="hidden sm:inline">Unduh Data Excel</span>
              <span className="sm:hidden">Excel</span>
            </Button>

            <Button
              size="sm"
              onClick={handleApply}
              disabled={isLoading}
              className="h-9 px-4"
            >
              {isLoading ? (
                <>
                  <span className="bn-spinner" />
                  <span>Memuat...</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  Tampilkan Data
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ── Error ───────────────────────────────────────────────────────────── */}
        {error && (
          <div className="p-4 border-b bg-red-50/50">
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
        {isLoading ? (
          <div className="bn-loading">
            <span className="bn-spinner bn-spinner-lg" />
            <span>Memuat data...</span>
          </div>
        ) : (
          <Table className="relative border-separate border-spacing-0 text-xs whitespace-nowrap">
            <TableHeader className="bg-background sticky top-0 z-20 shadow-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead rowSpan={2} className="sticky left-0 z-30 p-2 text-left font-semibold text-[11px] !bg-background border-b border-r border-zinc-200 min-w-[16rem]">
                  Uraian<br /><span className="text-[10px] font-normal text-muted-foreground">(Rp triliun)</span>
                </TableHead>

                {/* 2025 group */}
                <TableHead colSpan={3} className="p-2 text-center font-bold text-[12px] !bg-background border-b border-r border-zinc-200 text-foreground">
                  Tahun 2025
                </TableHead>

                {/* 2026 group */}
                <TableHead colSpan={9} className="p-2 text-center font-bold text-[12px] !bg-background border-b border-zinc-200 text-foreground">
                  Tahun 2026
                </TableHead>
              </TableRow>
              <TableRow className="hover:bg-transparent">
                {/* 2025 sub-headers */}
                <TableHead className="p-2 text-center font-semibold text-[11px] !bg-background border-b border-r border-zinc-200 text-foreground/80 min-w-[6.5rem]">APBN<br />2025</TableHead>
                <TableHead className="p-2 text-center font-semibold text-[11px] !bg-background border-b border-r border-zinc-200 text-foreground/80 min-w-[6.5rem]">Real s.d. {appliedParams.tglReal2025 ? new Date(appliedParams.tglReal2025).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' }) : "-"}</TableHead>
                <TableHead className="p-2 text-center font-semibold text-[11px] !bg-background border-b border-r border-zinc-200 text-foreground/80 min-w-[6.5rem]">% thd<br />APBN</TableHead>

                {/* 2026 sub-headers */}
                <TableHead className="p-2 text-center font-semibold text-[11px] !bg-background border-b border-r border-zinc-200 text-foreground/80 min-w-[6.5rem]">APBN<br />2026</TableHead>
                <TableHead className="p-2 text-center font-semibold text-[11px] !bg-background border-b border-r border-zinc-200 text-foreground/80 min-w-[6.5rem]">DIPA<br />2026</TableHead>
                <TableHead className="p-2 text-center font-semibold text-[11px] !bg-background border-b border-r border-zinc-200 text-foreground/80 min-w-[6.5rem]">Real s.d. {appliedParams.tglSd2026 ? new Date(appliedParams.tglSd2026).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' }) : "-"}</TableHead>
                <TableHead className="p-2 text-center font-semibold text-[11px] !bg-background border-b border-r border-zinc-200 text-foreground/80 min-w-[6.5rem]">Real Minggu Ini<br />({appliedParams.tglAwal2026 ? new Date(appliedParams.tglAwal2026).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' }) : "-"} – {appliedParams.tglAkhir2026 ? new Date(appliedParams.tglAkhir2026).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' }) : "-"})</TableHead>
                <TableHead className="p-2 text-center font-semibold text-[11px] !bg-background border-b border-r border-zinc-200 text-foreground/80 min-w-[6.5rem]">Real s.d. {appliedParams.tglAkhir2026 ? new Date(appliedParams.tglAkhir2026).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' }) : "-"}</TableHead>
                <TableHead className="p-2 text-center font-semibold text-[11px] !bg-background border-b border-r border-zinc-200 text-foreground/80 min-w-[6.5rem]">% thd<br />APBN</TableHead>
                <TableHead className="p-2 text-center font-semibold text-[11px] !bg-background border-b border-r border-zinc-200 text-foreground/80 min-w-[6.5rem]">% thd<br />DIPA</TableHead>
                <TableHead className="p-2 text-center font-semibold text-[11px] !bg-background border-b border-r border-zinc-200 text-foreground/80 min-w-[6.5rem]">Sisa Pagu<br />APBN</TableHead>
                <TableHead className="p-2 text-center font-semibold text-[11px] !bg-background border-b border-zinc-200 text-foreground/80 min-w-[6.5rem]">Growth<br />YoY (%)</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="p-12 text-center text-muted-foreground border-b border-zinc-200">
                    Tidak ada data untuk parameter yang dipilih.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, idx) => {
                  const level = rowLevel(row.uraian);
                  const growth = row["Growth YoY (%)"];
                  return (
                    <TableRow key={idx} className={cn("group hover:bg-muted/30", `bn-tr-${level}`)}>
                      <TableCell className={cn(
                        "sticky left-0 z-10 p-2 !bg-background border-b border-r border-zinc-200 group-hover:bg-muted/40 transition-colors whitespace-normal min-w-[16rem]",
                        level === "l1" && "font-bold text-[13px]",
                        level === "l2" && "font-semibold pl-3",
                        level === "l3" && "font-normal pl-6 text-muted-foreground"
                      )}>
                        {row.uraian}
                      </TableCell>

                      {/* 2025 */}
                      <TableCell className="p-2 text-right font-mono border-b border-r border-zinc-200">{fmtTriliun(row["Pagu 2025"])}</TableCell>
                      <TableCell className="p-2 text-right font-mono border-b border-r border-zinc-200">{fmtTriliun(row.real_sd_prev_year)}</TableCell>
                      <TableCell className="p-2 text-center border-b border-r border-zinc-200">
                        <Badge variant="secondary" className="font-bold px-3 font-mono">
                          {fmtPct(row["% Capaian 2025"])}
                        </Badge>
                      </TableCell>

                      {/* 2026 */}
                      <TableCell className="p-2 text-right font-mono border-b border-r border-zinc-200">{fmtTriliun(row["APBN 2026"])}</TableCell>
                      <TableCell className="p-2 text-right font-mono border-b border-r border-zinc-200">{fmtTriliun(row["DIPA 2026"])}</TableCell>
                      <TableCell className="p-2 text-right font-mono border-b border-r border-zinc-200">{fmtTriliun(row.real_sd_prev)}</TableCell>
                      <TableCell className="p-2 text-right font-mono border-b border-r border-zinc-200">{fmtTriliun(row.real_weekly)}</TableCell>
                      <TableCell className="p-2 text-right font-mono border-b border-r border-zinc-200 bg-zinc-50/50 group-hover:bg-zinc-100/50">{fmtTriliun(row.real_sd_curr)}</TableCell>
                      <TableCell className="p-2 text-center border-b border-r border-zinc-200">
                        <Badge variant="secondary" className="font-bold px-3 font-mono">{fmtPct(row["% thd APBN"])}</Badge>
                      </TableCell>
                      <TableCell className="p-2 text-center border-b border-r border-zinc-200">
                        <Badge variant="secondary" className="font-bold px-3 font-mono">{fmtPct(row["% thd DIPA"])}</Badge>
                      </TableCell>
                      <TableCell className="p-2 text-right font-mono border-b border-r border-zinc-200">{fmtTriliun(row["Sisa Pagu APBN"])}</TableCell>
                      <TableCell className="p-2 text-center border-b border-zinc-200">
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
        )}
      </div>

      <p className="bn-source">
        Sumber: OMSPAN Dit.PKN — data diperbarui s.d. {titleDate}
      </p>
    </section>
  );
}
