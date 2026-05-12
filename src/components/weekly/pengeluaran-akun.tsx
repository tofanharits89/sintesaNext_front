"use client";

import { useState, useCallback, useImperativeHandle, forwardRef } from "react";
import * as XLSX from "xlsx";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { apiPath } from "@/lib/config/base-path";
import { Badge } from "@/components/ui/badge";
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
import { Table2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PieRow {
  kategori_belanja: string;
  total_realisasi: number;
  persentase: number;
}

interface BkpkRow {
  No: string;
  "Akun Belanja (BKPK)": string;
  "APBN 2026": number;
  "Realisasi 25 - 29 Apr 2026": number;
  "Realisasi s.d. 29 Apr 2026": number;
  "% thd APBN": number;
}

// ─── Color palette (matches screenshot: biru-teal, kuning-emas, ungu, hijau) ─

const PIE_COLORS: Record<string, string> = {
  "Barang dan Jasa": "#06b6d4",   // cyan-500
  "Modal":           "#eab308",   // yellow-500
  "Pegawai":         "#a855f7",   // purple-500
  "Bansos":          "#84cc16",   // lime-500
};
const PIE_FALLBACK = "#94a3b8";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt1(v: number | null | undefined): string {
  if (v == null) return "-";
  return v.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return "-";
  return fmt1(v) + "%";
}

function fmtT(v: number | null | undefined): string {
  if (v == null) return "-";
  return fmt1(v);
}

function isSubTotal(uraian: string): boolean {
  return uraian.startsWith("    ");
}

/** Default Monday of current week */
function thisMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Default Friday of current week */
function thisFriday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -2 : 5 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

// ─── Custom Tooltip for Pie ───────────────────────────────────────────────────

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as PieRow;
  return (
    <div className="pa-pie-tooltip">
      <div className="pa-pie-tooltip-name">{d.kategori_belanja}</div>
      <div className="pa-pie-tooltip-val">
        Rp {(d.total_realisasi / 1_000_000_000_000).toLocaleString("id-ID", {
          minimumFractionDigits: 1, maximumFractionDigits: 1,
        })} T
      </div>
      <div className="pa-pie-tooltip-pct">{d.persentase}%</div>
    </div>
  );
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

async function fetchPie(tglAkhir: string): Promise<PieRow[]> {
  const qs = new URLSearchParams({ tglAkhir });
  const res = await fetch(apiPath(`/weekly/pengeluaran-akun/pie?${qs}`), {
    credentials: "include",
    cache: "no-store",
    signal: AbortSignal.timeout(60_000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = JSON.parse(text)?.data ?? [];
  return data.map((d: any) => ({
    kategori_belanja: d.kategori_belanja,
    total_realisasi: Number(d.total_realisasi),
    persentase: Number(d.persentase),
  }));
}

async function fetchBkpk(tglAwal: string, tglAkhir: string): Promise<BkpkRow[]> {
  const qs = new URLSearchParams({ tglAwal, tglAkhir });
  const res = await fetch(apiPath(`/weekly/pengeluaran-akun/tabel?${qs}`), {
    credentials: "include",
    cache: "no-store",
    signal: AbortSignal.timeout(60_000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = JSON.parse(text)?.data ?? [];
  return data.map((d: any) => ({
    ...d,
    "APBN 2026": Number(d["APBN 2026"]),
    "Realisasi 25 - 29 Apr 2026": Number(d["Realisasi 25 - 29 Apr 2026"]),
    "Realisasi s.d. 29 Apr 2026": Number(d["Realisasi s.d. 29 Apr 2026"]),
    "% thd APBN": Number(d["% thd APBN"]),
  }));
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

/** Skeleton for the BKPK table (6 columns, 2 header rows) */
function BkpkTableSkeleton() {
  const ROWS = 12;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-separate border-spacing-0">
        <thead>
          <tr className="bg-zinc-100/80">
            <th className="p-3 border-b border-r border-zinc-200 w-[40px]">
              <Skeleton className="h-3 w-6 mx-auto bg-zinc-300/70" />
            </th>
            <th className="p-3 border-b border-r border-zinc-200 min-w-[14rem]">
              <Skeleton className="h-4 w-32 bg-zinc-300/70" />
            </th>
            <th className="p-3 border-b border-r border-zinc-200 min-w-[6rem]">
              <Skeleton className="h-4 w-16 mx-auto bg-zinc-300/70" />
            </th>
            {/* Realisasi group */}
            <th colSpan={2} className="p-3 border-b border-r border-zinc-200 text-center">
              <Skeleton className="h-4 w-20 mx-auto bg-zinc-300/70" />
            </th>
            <th className="p-3 border-b border-zinc-200 min-w-[6rem]">
              <Skeleton className="h-4 w-16 mx-auto bg-zinc-300/70" />
            </th>
          </tr>
          <tr className="bg-zinc-50/80">
            {[40, 224, 96, 104, 104, 96].map((w, i) => (
              <th key={i} className="p-3 border-b border-r border-zinc-200 last:border-r-0">
                <Skeleton className="h-3 w-14 mx-auto bg-zinc-300/60" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: ROWS }).map((_, rowIdx) => (
            <tr key={rowIdx} className={rowIdx % 2 === 0 ? "bg-white" : "bg-zinc-50/40"}>
              <td className="p-3 border-b border-r border-zinc-200">
                <Skeleton className="h-3 w-4 mx-auto bg-zinc-200/80" />
              </td>
              <td className="p-3 border-b border-r border-zinc-200">
                <Skeleton className={`h-3 bg-zinc-200/80 ${rowIdx % 3 === 0 ? "w-48" : rowIdx % 3 === 1 ? "w-56 ml-3" : "w-40"}`} />
              </td>
              <td className="p-3 border-b border-r border-zinc-200">
                <Skeleton className="h-3 w-14 ml-auto bg-zinc-200/80" />
              </td>
              <td className="p-3 border-b border-r border-zinc-200">
                <Skeleton className="h-3 w-14 ml-auto bg-zinc-200/80" />
              </td>
              <td className="p-3 border-b border-r border-zinc-200">
                <Skeleton className="h-3 w-14 ml-auto bg-zinc-200/80" />
              </td>
              <td className="p-3 border-b border-zinc-200">
                <Skeleton className="h-5 w-14 rounded-full mx-auto bg-zinc-200/80" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface PengeluaranAkunHandle {
  load: () => void;
  exportExcel: () => void;
}

const PengeluaranAkun = forwardRef<PengeluaranAkunHandle, {
  tglAwal?: string;
  tglAkhir?: string;
}>(function PengeluaranAkun({ tglAwal: tglAwalProp, tglAkhir: tglAkhirProp }, ref) {
  // Pie state
  const [pieData,    setPieData]    = useState<PieRow[]>([]);
  const [pieLoading, setPieLoading] = useState(false);
  const [pieLoaded,  setPieLoaded]  = useState(false);
  const [pieError,   setPieError]   = useState<string | null>(null);

  // Table date params — use props if provided, else internal state
  const [tglAwal,  setTglAwal]  = useState(tglAwalProp ?? thisMonday());
  const [tglAkhir, setTglAkhir] = useState(tglAkhirProp ?? thisFriday());

  // Sync props → internal state when props change
  const effectiveTglAwal  = tglAwalProp  ?? tglAwal;
  const effectiveTglAkhir = tglAkhirProp ?? tglAkhir;
  const [bkpkData,    setBkpkData]    = useState<BkpkRow[]>([]);
  const [bkpkLoading, setBkpkLoading] = useState(false);
  const [bkpkLoaded,  setBkpkLoaded]  = useState(false);
  const [bkpkError,   setBkpkError]   = useState<string | null>(null);

  // Load both in one click
  const handleLoad = useCallback(async () => {
    setPieLoading(true);
    setBkpkLoading(true);
    setPieError(null);
    setBkpkError(null);

    const [pieResult, bkpkResult] = await Promise.allSettled([
      fetchPie(effectiveTglAkhir),
      fetchBkpk(effectiveTglAwal, effectiveTglAkhir),
    ]);

    if (pieResult.status === "fulfilled") {
      setPieData(pieResult.value);
      setPieLoaded(true);
    } else {
      setPieError((pieResult.reason as Error).message);
    }
    setPieLoading(false);

    if (bkpkResult.status === "fulfilled") {
      setBkpkData(bkpkResult.value);
      setBkpkLoaded(true);
    } else {
      setBkpkError((bkpkResult.reason as Error).message);
    }
    setBkpkLoading(false);
  }, [effectiveTglAwal, effectiveTglAkhir]);

  const handleExportExcel = () => {
    if (!bkpkData || bkpkData.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(bkpkData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PengeluaranAkun");
    const currentDate = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Pengeluaran_Akun_${currentDate}.xlsx`);
  };

  // Grand total from pie data
  const grandTotal = pieData.reduce((s, r) => s + r.total_realisasi, 0);
  const grandTotalT = (grandTotal / 1_000_000_000_000).toLocaleString("id-ID", {
    minimumFractionDigits: 1, maximumFractionDigits: 1,
  });

  const isLoading = pieLoading || bkpkLoading;

  useImperativeHandle(ref, () => ({
    load: handleLoad,
    exportExcel: handleExportExcel,
  }), [handleLoad, bkpkData]);

  return (
    <PengeluaranAkunInner
      pieData={pieData}
      pieLoading={pieLoading}
      pieLoaded={pieLoaded}
      pieError={pieError}
      bkpkData={bkpkData}
      bkpkLoading={bkpkLoading}
      bkpkLoaded={bkpkLoaded}
      bkpkError={bkpkError}
      grandTotalT={grandTotalT}
      tglAwal={effectiveTglAwal}
      tglAkhir={effectiveTglAkhir}
      onLoad={handleLoad}
      onExport={handleExportExcel}
    />
  );
})

// ─── Inner render component ───────────────────────────────────────────────────

export default PengeluaranAkun;function PengeluaranAkunInner({
  pieData, pieLoading, pieLoaded, pieError,
  bkpkData, bkpkLoading, bkpkLoaded, bkpkError,
  grandTotalT, tglAwal, tglAkhir,
  onLoad, onExport,
}: {
  pieData: PieRow[];
  pieLoading: boolean;
  pieLoaded: boolean;
  pieError: string | null;
  bkpkData: BkpkRow[];
  bkpkLoading: boolean;
  bkpkLoaded: boolean;
  bkpkError: string | null;
  grandTotalT: string;
  tglAwal: string;
  tglAkhir: string;
  onLoad: () => void;
  onExport: () => void;
}) {
  return (
    <section className="pa-section">
      {/* ── Empty hint ────────────────────────────────────────────────────── */}
      {!pieLoaded && !bkpkLoaded && !pieLoading && !bkpkLoading && (
        <div className="border rounded-md">
          <div className="h-10 bg-muted/50 border-b flex items-center px-4">
            <div className="text-xs font-medium text-muted-foreground uppercase">
              Data belum dimuat
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-background/50">
            <Table2 className="h-10 w-10 mb-2 opacity-20" />
            <p className="text-sm">
              Silahkan Pilih Tanggal dan klik &quot;Tampilkan&quot; untuk memuat data
            </p>
          </div>
        </div>
      )}

      {/* ── Loading skeleton (before first load) ─────────────────────────── */}
      {(pieLoading || bkpkLoading) && !pieLoaded && !bkpkLoaded && (
        <div className="space-y-3 animate-pulse">
          <div className="h-10 bg-muted rounded-md w-full" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted/50 rounded-md w-full" />
            ))}
          </div>
          <div className="h-10 bg-muted rounded-md w-full" />
        </div>
      )}

      {/* ── Error banners ─────────────────────────────────────────────────── */}
      {pieError && <div className="bn-error">Pie chart: {pieError}</div>}
      {bkpkError && <div className="bn-error">Tabel BKPK: {bkpkError}</div>}

      {/* ── Main layout: Donut + Table side by side ─────────────────────── */}
      {(pieLoaded || bkpkLoaded) && (
        <div className="pa-body">

          {/* ── Donut ───────────────────────────────────────────────────── */}
          <div className="pa-chart-card rounded-xl border-zinc-200 shadow-sm">
            <div className="pa-chart-wrap">
              {pieLoading ? (
                <div className="bn-loading"><span className="bn-spinner bn-spinner-lg" /></div>
              ) : pieLoaded && pieData.length > 0 ? (
                <div className="pa-donut-container">
                  <div className="relative w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="total_realisasi"
                          nameKey="kategori_belanja"
                          cx="50%"
                          cy="50%"
                          innerRadius="60%"
                          outerRadius="90%"
                          paddingAngle={2}
                          startAngle={90}
                          endAngle={-270}
                        >
                          {pieData.map((entry, i) => (
                            <Cell
                              key={`cell-${i}`}
                              fill={PIE_COLORS[entry.kategori_belanja] ?? PIE_FALLBACK}
                              stroke="none"
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Center label */}
                    <div className="pa-donut-center">
                      <span className="pa-donut-center-label">Total</span>
                      <span className="pa-donut-center-value">Rp{grandTotalT} T</span>
                    </div>
                  </div>

                  {/* Custom legend (matches screenshot style) */}
                  <div className="pa-legend">
                    {pieData.map((row) => (
                      <div key={row.kategori_belanja} className="pa-legend-item">
                        <span
                          className="pa-legend-dot"
                          style={{ background: PIE_COLORS[row.kategori_belanja] ?? PIE_FALLBACK }}
                        />
                        <span className="pa-legend-name">{row.kategori_belanja}</span>
                        <span
                          className="pa-legend-pct"
                          style={{ color: PIE_COLORS[row.kategori_belanja] ?? PIE_FALLBACK }}
                        >
                          {row.persentase > 0 ? `${row.persentase}%` : `${row.persentase}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* ── BKPK Table ──────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 rounded-xl border overflow-hidden bg-card shadow-sm h-full">
            {bkpkLoading ? (
              <BkpkTableSkeleton />
            ) : bkpkLoaded ? (
              <Table className="relative border-separate border-spacing-0 text-xs whitespace-nowrap">
                <TableHeader className="bg-background sticky top-0 z-20 shadow-sm">
                  <TableRow className="hover:bg-transparent">
                    <TableHead rowSpan={2} className="sticky left-0 z-30 p-3 text-left font-semibold text-[11px] !bg-background border-b border-r border-zinc-200 w-[40px]">
                      No
                    </TableHead>
                    <TableHead rowSpan={2} className="p-3 text-left font-semibold text-[11px] !bg-background border-b border-r border-zinc-200 min-w-[14rem]">
                      Akun Belanja (BKPK)<br />
                      <span className="text-[10px] font-normal text-muted-foreground">(Rp Triliun)</span>
                    </TableHead>
                    <TableHead rowSpan={2} className="p-3 text-center font-semibold text-[11px] !bg-background border-b border-r border-zinc-200 min-w-[6rem]">
                      APBN<br />2026
                    </TableHead>
                    <TableHead colSpan={2} className="p-3 text-center font-bold text-[12px] !bg-background border-b border-r border-zinc-200 text-foreground">
                      Realisasi
                    </TableHead>
                    <TableHead rowSpan={2} className="p-3 text-center font-semibold text-[11px] !bg-background border-b border-zinc-200 min-w-[6rem]">
                      % thd<br />APBN
                    </TableHead>
                  </TableRow>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="p-3 text-center font-semibold text-[11px] !bg-background border-b border-r border-zinc-200 text-foreground/80 min-w-[6.5rem]">
                      {tglAwal} –<br />{tglAkhir}
                    </TableHead>
                    <TableHead className="p-3 text-center font-semibold text-[11px] !bg-background border-b border-r border-zinc-200 text-foreground/80 min-w-[6.5rem]">
                      s.d.<br />{tglAkhir}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bkpkData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="p-12 text-center text-muted-foreground border-b border-zinc-200">
                        Tidak ada data untuk parameter yang dipilih.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bkpkData.map((row, i) => {
                      const isSub = isSubTotal(row["Akun Belanja (BKPK)"]);
                      const uraian = row["Akun Belanja (BKPK)"];
                      const isGrandTotal = uraian.includes("Total Seluruhnya");
                      const isTop10Total = uraian.includes("Total 10 BKPK");
                      
                      return (
                        <TableRow
                          key={i}
                          className={cn(
                            "group hover:bg-muted/30",
                            isGrandTotal && "bg-zinc-100/80 font-bold",
                            isTop10Total && "bg-zinc-50/50 font-semibold",
                            isSub && !isGrandTotal && !isTop10Total && "bg-zinc-50/30"
                          )}
                        >
                          <TableCell className="p-3 text-center border-b border-r border-zinc-200 font-mono text-muted-foreground">
                            {row["No"]}
                          </TableCell>
                          <TableCell className={cn(
                            "p-3 border-b border-r border-zinc-200 group-hover:bg-muted/40 transition-colors whitespace-normal min-w-[14rem]",
                            isGrandTotal && "font-bold text-[13px]",
                            isTop10Total && "font-semibold",
                            isSub && !isGrandTotal && !isTop10Total && "pl-4 text-muted-foreground"
                          )}>
                            {uraian.trim()}
                          </TableCell>
                          <TableCell className="p-3 text-right font-mono border-b border-r border-zinc-200">
                            {fmt1(row["APBN 2026"])}
                          </TableCell>
                          <TableCell className="p-3 text-right font-mono border-b border-r border-zinc-200">
                            {fmt1(row["Realisasi 25 - 29 Apr 2026"])}
                          </TableCell>
                          <TableCell className="p-3 text-right font-mono border-b border-r border-zinc-200 bg-zinc-50/50 group-hover:bg-zinc-100/50">
                            {fmt1(row["Realisasi s.d. 29 Apr 2026"])}
                          </TableCell>
                          <TableCell className="p-3 text-center border-b border-zinc-200">
                            <Badge variant="secondary" className="font-bold px-3 font-mono">
                              {fmtPct(row["% thd APBN"])}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
