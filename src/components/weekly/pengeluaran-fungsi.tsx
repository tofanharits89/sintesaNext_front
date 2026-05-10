"use client";

import { useState, useCallback, useImperativeHandle, forwardRef } from "react";
import * as XLSX from "xlsx";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { apiPath } from "@/lib/config/base-path";
import { Skeleton } from "@/components/ui/skeleton";
import { Table2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FungsiPieRow {
  nama_fungsi: string;
  total_pagu: number;
  persentase: number;
}

interface FungsiTabelRow {
  NO: string;
  FUNGSI: string;
  PAGU: number;
  REALISASI: number;
  BLOKIR: number;
  "%": number;
}

// ─── Color palette ───────────────────────────────────────────────────────────

const PIE_COLORS = [
  "#4A86C6", // Blue (Pendidikan)
  "#C94F4F", // Red (Ketertiban)
  "#95C15A", // Green (Ekonomi)
  "#8C68A6", // Purple (Pertahanan)
  "#4EADC5", // Teal (Kesehatan)
  "#F29C49", // Orange (Pelayanan Umum)
  "#284E76", // Dark Blue (Perlindungan Sosial)
  "#A33636", // Dark Red (Perumahan)
  "#5A8B28", // Dark Green (Agama)
  "#5B3E7A", // Dark Purple (Lingkungan)
  "#2C7A8C", // Dark Teal (Pariwisata)
  "#B5682A", // Dark Orange (Lainnya)
];

const PIE_FALLBACK = "#94a3b8";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt2(v: number | null | undefined): string {
  if (v == null) return "-";
  return v.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return "-";
  return fmt2(v) + "%";
}

function isSubTotal(uraian: string): boolean {
  return uraian === "TOTAL";
}

/** Default Friday of current week */
function thisFriday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -2 : 5 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

// ─── Custom Tooltip & Label ───────────────────────────────────────────────────

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as FungsiPieRow;
  return (
    <div className="pa-pie-tooltip">
      <div className="pa-pie-tooltip-name">{d.nama_fungsi}</div>
      <div className="pa-pie-tooltip-val">
        Pagu: {(d.total_pagu / 1_000_000_000).toLocaleString("id-ID", {
          minimumFractionDigits: 2, maximumFractionDigits: 2,
        })} M
      </div>
      <div className="pa-pie-tooltip-pct">Persentase: {d.persentase}%</div>
    </div>
  );
}

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, persentase }: any) => {
  if (persentase < 1) return null;
  const RADIAN = Math.PI / 180;
  // Position label slightly outside the pie
  const radius = innerRadius + (outerRadius - innerRadius) * 1.1; 
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="#333" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize="10px"
      fontWeight="bold"
      className="pf-chart-label"
    >
      {`${persentase}%`}
    </text>
  );
};

// ─── Fetcher ──────────────────────────────────────────────────────────────────

async function fetchFungsiPie(): Promise<FungsiPieRow[]> {
  const res = await fetch(apiPath("/weekly/pengeluaran-fungsi/pie"), {
    credentials: "include",
    cache: "no-store",
    signal: AbortSignal.timeout(60_000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = JSON.parse(text)?.data ?? [];
  return data.map((d: any) => ({
    nama_fungsi: d.nama_fungsi,
    total_pagu: Number(d.total_pagu),
    persentase: Number(d.persentase),
  }));
}

async function fetchFungsiTabel(tglAkhir: string): Promise<FungsiTabelRow[]> {
  const qs = new URLSearchParams({ tglAkhir });
  const res = await fetch(apiPath(`/weekly/pengeluaran-fungsi/tabel?${qs}`), {
    credentials: "include",
    cache: "no-store",
    signal: AbortSignal.timeout(60_000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = JSON.parse(text)?.data ?? [];
  return data.map((d: any) => ({
    ...d,
    PAGU: Number(d.PAGU),
    REALISASI: Number(d.REALISASI),
    BLOKIR: Number(d.BLOKIR),
    "%": Number(d["%"]),
  }));
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

/** Skeleton for the Fungsi table (6 columns, 1 header row) */
function FungsiTableSkeleton() {
  const ROWS = 13;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-separate border-spacing-0">
        <thead>
          <tr className="bg-zinc-100/80">
            {["w-8", "w-40", "w-24", "w-24", "w-24", "w-16"].map((w, i) => (
              <th key={i} className="p-3 border-b border-r border-zinc-200 last:border-r-0">
                <Skeleton className={`h-3 ${w} mx-auto bg-zinc-300/70`} />
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
                <Skeleton className={`h-3 bg-zinc-200/80 ${rowIdx % 2 === 0 ? "w-36" : "w-28"}`} />
              </td>
              {[0, 1, 2].map((j) => (
                <td key={j} className="p-3 border-b border-r border-zinc-200">
                  <Skeleton className="h-3 w-16 ml-auto bg-zinc-200/80" />
                </td>
              ))}
              <td className="p-3 border-b border-zinc-200">
                <Skeleton className="h-3 w-12 ml-auto bg-zinc-200/80" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface PengeluaranFungsiHandle {
  load: () => void;
  exportExcel: () => void;
}

const PengeluaranFungsi = forwardRef<PengeluaranFungsiHandle, {
  tglAkhir?: string;
}>(function PengeluaranFungsi({ tglAkhir: tglAkhirProp }, ref) {
  // Pie state
  const [pieData,    setPieData]    = useState<FungsiPieRow[]>([]);
  const [pieLoading, setPieLoading] = useState(false);
  const [pieLoaded,  setPieLoaded]  = useState(false);
  const [pieError,   setPieError]   = useState<string | null>(null);

  // Date param
  const [tglAkhirInternal, setTglAkhirInternal] = useState(thisFriday());
  const tglAkhir = tglAkhirProp ?? tglAkhirInternal;

  // Table state
  const [tabelData,    setTabelData]    = useState<FungsiTabelRow[]>([]);
  const [tabelLoading, setTabelLoading] = useState(false);
  const [tabelLoaded,  setTabelLoaded]  = useState(false);
  const [tabelError,   setTabelError]   = useState<string | null>(null);

  // Load both in one click
  const handleLoad = useCallback(async () => {
    setPieLoading(true);
    setTabelLoading(true);
    setPieError(null);
    setTabelError(null);

    const [pieResult, tabelResult] = await Promise.allSettled([
      fetchFungsiPie(),
      fetchFungsiTabel(tglAkhir),
    ]);

    if (pieResult.status === "fulfilled") {
      setPieData(pieResult.value);
      setPieLoaded(true);
    } else {
      setPieError((pieResult.reason as Error).message);
    }
    setPieLoading(false);

    if (tabelResult.status === "fulfilled") {
      setTabelData(tabelResult.value);
      setTabelLoaded(true);
    } else {
      setTabelError((tabelResult.reason as Error).message);
    }
    setTabelLoading(false);
  }, [tglAkhir]);

  const handleExportExcel = () => {
    if (!tabelData || tabelData.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(tabelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PengeluaranFungsi");
    const currentDate = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Pengeluaran_Fungsi_${currentDate}.xlsx`);
  };

  const isLoading = pieLoading || tabelLoading;

  useImperativeHandle(ref, () => ({
    load: handleLoad,
    exportExcel: handleExportExcel,
  }), [handleLoad, tabelData]);

  return (
    <section className="pa-section pf-section">
      {/* ── Empty hint ────────────────────────────────────────────────────── */}
      {!pieLoaded && !tabelLoaded && !isLoading && (
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
      {isLoading && !pieLoaded && !tabelLoaded && (
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
      {tabelError && <div className="bn-error">Tabel Fungsi: {tabelError}</div>}

      {/* ── Main layout: Pie + Table side by side ─────────────────────── */}
      {(pieLoaded || tabelLoaded) && (
        <div className="pf-body">

          {/* ── Pie Chart ───────────────────────────────────────────────────── */}
          <div className="pa-chart-card pf-chart-card">
            <div className="pa-chart-wrap">
              {pieLoading ? (
                <div className="bn-loading"><span className="bn-spinner bn-spinner-lg" /></div>
              ) : pieLoaded && pieData.length > 0 ? (
                <div className="pf-donut-container">
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <Pie
                        data={pieData}
                        dataKey="total_pagu"
                        nameKey="nama_fungsi"
                        cx="50%"
                        cy="50%"
                        outerRadius="85%"
                        labelLine={true}
                        label={renderCustomizedLabel}
                      >
                        {pieData.map((entry, i) => (
                          <Cell
                            key={`cell-${i}`}
                            fill={PIE_COLORS[i % PIE_COLORS.length] ?? PIE_FALLBACK}
                            stroke="none"
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{ fontSize: '9px', paddingTop: '10px' }}
                        iconType="square"
                        iconSize={8}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </div>
          </div>

          {/* ── Fungsi Table ──────────────────────────────────────────────── */}
          <div className="pa-table-card pf-table-card">
            <div className="pf-table-title-right">
              (Milyar Rupiah)
            </div>
            {tabelLoading ? (
              <FungsiTableSkeleton />
            ) : tabelLoaded ? (
              <div className="pa-table-wrap">
                <table className="pa-table pf-table">
                  <thead>
                    <tr>
                      <th className="pa-th pa-th-no">NO</th>
                      <th className="pa-th pf-th-fungsi">FUNGSI</th>
                      <th className="pa-th pf-th-num">PAGU</th>
                      <th className="pa-th pf-th-num">REALISASI</th>
                      <th className="pa-th pf-th-num">BLOKIR</th>
                      <th className="pa-th pf-th-num">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabelData.map((row, i) => {
                      const isSub = isSubTotal(row.FUNGSI);
                      return (
                        <tr
                          key={i}
                          className={`pa-tr${isSub ? " pa-tr-grand pf-tr-grand" : ""}`}
                        >
                          <td className="pa-td pa-td-no">{row.NO}</td>
                          <td className="pa-td pf-td-fungsi">{row.FUNGSI}</td>
                          <td className="pa-td pf-td-num">{fmt2(row.PAGU)}</td>
                          <td className="pa-td pf-td-num">{fmt2(row.REALISASI)}</td>
                          <td className="pa-td pf-td-num">{fmt2(row.BLOKIR)}</td>
                          <td className="pa-td pf-td-num pf-td-pct">{fmtPct(row["%"])}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
});

export default PengeluaranFungsi;

