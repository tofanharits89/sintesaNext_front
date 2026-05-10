"use client";

import { useState, useCallback, useImperativeHandle, forwardRef } from "react";
import * as XLSX from "xlsx";
import { apiPath } from "@/lib/config/base-path";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RealisasiKlRow {
  "BAGIAN ANGGARAN": string;
  real_sd_prev_year: number;
  "% thd APBN 2025": number;
  APBN: number;
  DIPA: number;
  real_sd_prev: number;
  real_weekly: number;
  real_sd_curr: number;
  "% thd APBN": number;
  "% thd DIPA": number;
  "Sisa Pagu APBN": number;
  "Sisa Pagu DIPA": number;
  "Growth YoY": number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt1(v: number | null | undefined): string {
  if (v == null) return "-";
  return v.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return "-";
  return fmt1(v) + "%";
}

function isSubTotal(uraian: string): boolean {
  return uraian === "15 K/L Terbesar" || uraian.includes("Lainnya");
}

function isGrandTotal(uraian: string): boolean {
  return uraian === "Jumlah Total";
}

const fmtDateObj = (dString: string) => {
  if (!dString) return "";
  const d = new Date(dString);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
};

const fmtDateShort = (dString: string) => {
  if (!dString) return "";
  const d = new Date(dString);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
};

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

// ─── Fetcher ──────────────────────────────────────────────────────────────────

async function fetchRealisasiKl(params: Record<string, string>): Promise<RealisasiKlRow[]> {
  const qs = new URLSearchParams(params);
  const res = await fetch(apiPath(`/weekly/realisasi-kl?${qs}`), {
    credentials: "include",
    cache: "no-store",
    signal: AbortSignal.timeout(60_000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = JSON.parse(text)?.data ?? [];
  return data.map((d: any) => ({
    ...d,
    real_sd_prev_year: Number(d.real_sd_prev_year),
    "% thd APBN 2025": Number(d["% thd APBN 2025"]),
    APBN: Number(d.APBN),
    DIPA: Number(d.DIPA),
    real_sd_prev: Number(d.real_sd_prev),
    real_weekly: Number(d.real_weekly),
    real_sd_curr: Number(d.real_sd_curr),
    "% thd APBN": Number(d["% thd APBN"]),
    "% thd DIPA": Number(d["% thd DIPA"]),
    "Sisa Pagu APBN": Number(d["Sisa Pagu APBN"]),
    "Sisa Pagu DIPA": Number(d["Sisa Pagu DIPA"]),
    "Growth YoY": Number(d["Growth YoY"]),
  }));
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

/** Skeleton for the Realisasi K/L table (13 columns, 2 header rows) */
function RealisasiKlTableSkeleton() {
  const COL_COUNT = 13;
  const ROWS = 17;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-separate border-spacing-0">
        <thead>
          <tr className="bg-zinc-100/80">
            <th className="p-2 border-b border-r border-zinc-200 min-w-[250px]">
              <Skeleton className="h-4 w-32 bg-zinc-300/70" />
            </th>
            <th colSpan={2} className="p-2 border-b border-r border-zinc-200 text-center">
              <Skeleton className="h-4 w-16 mx-auto bg-zinc-300/70" />
            </th>
            <th colSpan={10} className="p-2 border-b border-zinc-200 text-center">
              <Skeleton className="h-4 w-16 mx-auto bg-zinc-300/70" />
            </th>
          </tr>
          <tr className="bg-zinc-50/80">
            {Array.from({ length: COL_COUNT }).map((_, i) => (
              <th key={i} className="p-2 border-b border-r border-zinc-200 last:border-r-0">
                <Skeleton className="h-3 w-14 mx-auto bg-zinc-300/60" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: ROWS }).map((_, rowIdx) => (
            <tr key={rowIdx} className={rowIdx % 2 === 0 ? "bg-white" : "bg-zinc-50/40"}>
              <td className="p-2 border-b border-r border-zinc-200 min-w-[250px]">
                <Skeleton className={`h-3 bg-zinc-200/80 ${rowIdx % 3 === 0 ? "w-44" : rowIdx % 3 === 1 ? "w-52" : "w-36"}`} />
              </td>
              {Array.from({ length: COL_COUNT - 1 }).map((_, colIdx) => (
                <td key={colIdx} className="p-2 border-b border-r border-zinc-200 last:border-r-0">
                  {colIdx === 1 || colIdx === 7 || colIdx === 8 || colIdx === 11 ? (
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

// ─── Handle ───────────────────────────────────────────────────────────────────

export interface RealisasiKlHandle {
  load: () => void;
  exportExcel: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const RealisasiKlWeekly = forwardRef<RealisasiKlHandle, {
  tglAwal?: string;
  tglAkhir?: string;
}>(function RealisasiKlWeekly({ tglAwal: tglAwalProp, tglAkhir: tglAkhirProp }, ref) {
  // Date params — use props if provided, else internal state
  const [tglAwalInternal, setTglAwalInternal] = useState(thisMonday());
  const [tglAkhirInternal, setTglAkhirInternal] = useState(thisFriday());

  const tglAwal = tglAwalProp ?? tglAwalInternal;
  const tglAkhir = tglAkhirProp ?? tglAkhirInternal;

  // Table state
  const [data,    setData]    = useState<RealisasiKlRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded,  setLoaded]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Derive other dates for the API
  const dtAwal = new Date(tglAwal);
  const dtSd26 = new Date(dtAwal);
  dtSd26.setDate(dtSd26.getDate() - 1);
  const tglSd26 = dtSd26.toISOString().slice(0, 10);

  const dtAkhir = new Date(tglAkhir);
  const dtAkhir25 = new Date(dtAkhir);
  dtAkhir25.setFullYear(dtAkhir25.getFullYear() - 1);
  const tglAkhir25 = dtAkhir25.toISOString().slice(0, 10);

  // Dynamic strings for table headers
  const strAkhir25 = fmtDateObj(tglAkhir25);
  const strSd26 = fmtDateObj(tglSd26);
  const strAwal26 = fmtDateShort(tglAwal);
  const strAkhir26 = fmtDateObj(tglAkhir);
  const year26 = dtAkhir.getFullYear().toString();
  const year25 = dtAkhir25.getFullYear().toString();

  const handleLoad = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRealisasiKl({
        tglSd26,
        tglAwal26: tglAwal,
        tglAkhir26: tglAkhir,
        tglAkhir25,
      });
      setData(result);
      setLoaded(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tglSd26, tglAwal, tglAkhir, tglAkhir25]);

  const handleExportExcel = () => {
    if (!data || data.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RealisasiKL");
    const currentDate = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Realisasi_KL_${currentDate}.xlsx`);
  };

  useImperativeHandle(ref, () => ({
    load: handleLoad,
    exportExcel: handleExportExcel,
  }), [handleLoad, data]);

  return (
    <section className="pa-section">
      {/* ── Empty hint ────────────────────────────────────────────────────── */}
      {!loaded && !loading && (
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

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {error && <div className="bn-error">{error}</div>}

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {loaded && (
        <div className="pa-table-card rk-table-card">
          {loading ? (
            <RealisasiKlTableSkeleton />
          ) : (
            <div className="pa-table-wrap">
              <table className="pa-table rk-table">
                <thead>
                  {/* Row 1: Groups */}
                  <tr>
                    <th rowSpan={2} className="pa-th rk-th-header" style={{ width: '250px' }}>
                      BAGIAN<br/>ANGGARAN<br/>
                      <span className="pa-th-sub">(Rp Triliun)</span>
                    </th>
                    <th colSpan={2} className="pa-th rk-th-group rk-th-dark">
                      TA. {year25}
                    </th>
                    <th colSpan={10} className="pa-th rk-th-group rk-th-yellow">
                      TA. {year26}
                    </th>
                  </tr>
                  {/* Row 2: Columns */}
                  <tr>
                    <th className="pa-th rk-th-dark">
                      s.d.<br/>{strAkhir25}
                    </th>
                    <th className="pa-th rk-th-dark">
                      % thd<br/>APBN
                    </th>
                    
                    <th className="pa-th rk-th-yellow">APBN</th>
                    <th className="pa-th rk-th-yellow">DIPA</th>
                    
                    <th className="pa-th rk-th-yellow">
                      s.d.<br/>{strSd26}
                    </th>
                    <th className="pa-th rk-th-yellow">
                      {strAwal26} - {strAkhir26}
                    </th>
                    <th className="pa-th rk-th-yellow">
                      s.d.<br/>{strAkhir26}
                    </th>
                    
                    <th className="pa-th rk-th-yellow">% thd<br/>APBN</th>
                    <th className="pa-th rk-th-yellow">% thd<br/>DIPA</th>
                    
                    <th colSpan={2} className="pa-th rk-th-sisa-group" style={{ padding: 0 }}>
                      <div className="rk-th-sisa-title">Sisa Pagu s.d. {strAkhir26}</div>
                      <div className="rk-th-sisa-cols">
                        <div className="rk-th-sisa-col">APBN</div>
                        <div className="rk-th-sisa-col">DIPA</div>
                      </div>
                    </th>
                    
                    <th className="pa-th rk-th-yellow">Growth<br/>YoY</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => {
                    const uraian = row["BAGIAN ANGGARAN"];
                    const isSub = isSubTotal(uraian);
                    const isGrand = isGrandTotal(uraian);
                    
                    let trClass = "pa-tr";
                    if (isSub) trClass += " rk-tr-subtotal";
                    if (isGrand) trClass += " rk-tr-grand pa-tr-grand";

                    return (
                      <tr key={i} className={trClass}>
                        <td className="pa-td pa-td-akun rk-td-uraian">
                          {isSub || isGrand ? <strong>{uraian}</strong> : uraian}
                        </td>
                        
                        {/* 2025 Metriks */}
                        <td className="pa-td pa-td-num">{fmt1(row.real_sd_prev_year)}</td>
                        <td className="pa-td text-center">
                          <Badge variant="secondary" className="font-bold px-3">{fmtPct(row["% thd APBN 2025"])}</Badge>
                        </td>
                        
                        {/* 2026 Metriks */}
                        <td className="pa-td pa-td-num">{fmt1(row.APBN)}</td>
                        <td className="pa-td pa-td-num">{fmt1(row.DIPA)}</td>
                        
                        <td className="pa-td pa-td-num">{fmt1(row.real_sd_prev)}</td>
                        <td className="pa-td pa-td-num rk-td-highlight">{fmt1(row.real_weekly)}</td>
                        <td className="pa-td pa-td-num rk-td-highlight">{fmt1(row.real_sd_curr)}</td>
                        
                        <td className="pa-td text-center">
                          <Badge variant="secondary" className="font-bold px-3">{fmtPct(row["% thd APBN"])}</Badge>
                        </td>
                        <td className="pa-td text-center">
                          <Badge variant="secondary" className="font-bold px-3">{fmtPct(row["% thd DIPA"])}</Badge>
                        </td>
                        
                        <td className="pa-td pa-td-num">{fmt1(row["Sisa Pagu APBN"])}</td>
                        <td className="pa-td pa-td-num">{fmt1(row["Sisa Pagu DIPA"])}</td>
                        
                        <td className="pa-td text-center">
                          <Badge
                            variant={row["Growth YoY"] > 0 ? "success" : row["Growth YoY"] < 0 ? "destructive" : "secondary"}
                            className="font-bold px-3"
                          >
                            {fmtPct(row["Growth YoY"])}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
});

export default RealisasiKlWeekly;