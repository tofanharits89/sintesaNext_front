"use client";

import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { useBelanjaNegaraWeekly, type BelanjaNegaraRow } from "@/hooks/use-belanja-negara-weekly";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/utils";
import { DatePicker } from "@/components/ui/date-picker";

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

/** Today's date in YYYY-MM-DD */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Monday of current week (ISO) */
function thisMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Friday of current week */
function thisFriday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -2 : 5 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Last Friday (before this week) */
function lastFriday(): string {
  const d = new Date(thisMonday());
  d.setDate(d.getDate() - 3); // Mon - 3 = Fri of prev week
  return d.toISOString().slice(0, 10);
}

// ─── DatePicker sub-component ─────────────────────────────────────────────────

interface DateFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}

function DateField({ id, label, value, onChange }: DateFieldProps) {
  // Convert string (YYYY-MM-DD) to Date object
  const dateValue = value ? new Date(value) : undefined;

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      // Convert Date object to string (YYYY-MM-DD)
      const year = newDate.getFullYear();
      const month = String(newDate.getMonth() + 1).padStart(2, "0");
      const day = String(newDate.getDate()).padStart(2, "0");
      onChange(`${year}-${month}-${day}`);
    }
  };

  return (
    <div className="bn-date-field">
      <label className="bn-date-label" htmlFor={id}>{label}</label>
      <DatePicker
        date={dateValue}
        onDateChange={handleDateChange}
        className="w-full h-8 text-[11px]"
        disabledDates={{ dayOfWeek: [0, 6] }}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BelanjaNegaraWeekly() {
  // Date state
  const [tglSd2026, setTglSd2026] = useState(lastFriday());
  const [tglAwal2026, setTglAwal2026] = useState(thisMonday());
  const [tglAkhir2026, setTglAkhir2026] = useState(thisFriday());

  // Applied params (only updated on "Tampilkan" click)
  const [appliedParams, setAppliedParams] = useState({
    tglSd2026: lastFriday(),
    tglAwal2026: thisMonday(),
    tglAkhir2026: thisFriday(),
    tglYoy2025: (() => {
      const d = new Date(thisFriday());
      d.setFullYear(d.getFullYear() - 1);
      return d.toISOString().slice(0, 10);
    })(),
    tglReal2025: (() => {
      const d = new Date(thisFriday());
      d.setFullYear(d.getFullYear() - 1);
      return d.toISOString().slice(0, 10);
    })(),
  });

  const { data, isLoading, error, refetch } = useBelanjaNegaraWeekly(appliedParams);

  const handleApply = () => {
    // Calculate 2025 date automatically from 2026 Akhir Minggu Ini
    const d2025 = new Date(tglAkhir2026);
    d2025.setFullYear(d2025.getFullYear() - 1);
    const tgl2025 = d2025.toISOString().slice(0, 10);

    setAppliedParams({ 
      tglSd2026, 
      tglAwal2026, 
      tglAkhir2026, 
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

      {/* ── Date Filter Panel ───────────────────────────────────────────────── */}
      <Card className="p-4 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b pb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>Parameter Tanggal</span>
        </div>

        <div className="bn-filter-grid">
          <div className="bn-filter-group">
            <span className="bn-filter-group-label">Parameter Minggu Berjalan (2026)</span>
            <div className="bn-filter-row">
              <DateField id="tgl-sd-2026" label="s.d. Akhir Minggu Lalu" value={tglSd2026} onChange={setTglSd2026} />
              <DateField id="tgl-awal-2026" label="Awal Minggu Ini" value={tglAwal2026} onChange={setTglAwal2026} />
              <DateField id="tgl-akhir-2026" label="Akhir Minggu Ini" value={tglAkhir2026} onChange={setTglAkhir2026} />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="success"
            onClick={handleExportExcel}
            disabled={isLoading || data.length === 0}
            className="font-bold"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Excel
          </Button>

          <Button
            onClick={handleApply}
            disabled={isLoading}
            className="font-bold"
          >
            {isLoading ? (
              <>
                <span className="bn-spinner" />
                Memuat...
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
      </Card>

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {error && (
        <div className="bn-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {String((error as any)?.message || error)}
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="rounded-md border overflow-hidden bg-card shadow-sm">
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
                      <TableCell className="p-2 text-right font-mono border-b border-r border-zinc-200">{fmtTriliun(row["Realisasi 2025 (s.d. Mei)"])}</TableCell>
                      <TableCell className="p-2 text-center border-b border-r border-zinc-200">
                        <Badge variant="secondary" className="font-bold px-3 font-mono">
                          {fmtPct(row["% Capaian 2025"])}
                        </Badge>
                      </TableCell>

                      {/* 2026 */}
                      <TableCell className="p-2 text-right font-mono border-b border-r border-zinc-200">{fmtTriliun(row["APBN 2026"])}</TableCell>
                      <TableCell className="p-2 text-right font-mono border-b border-r border-zinc-200">{fmtTriliun(row["DIPA 2026"])}</TableCell>
                      <TableCell className="p-2 text-right font-mono border-b border-r border-zinc-200">{fmtTriliun(row["Realisasi s.d. 24 Apr 2026"])}</TableCell>
                      <TableCell className="p-2 text-right font-mono border-b border-r border-zinc-200">{fmtTriliun(row["Realisasi 25-29 Apr 2026"])}</TableCell>
                      <TableCell className="p-2 text-right font-mono border-b border-r border-zinc-200 bg-zinc-50/50 group-hover:bg-zinc-100/50">{fmtTriliun(row["Realisasi s.d. 29 Apr 2026"])}</TableCell>
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
