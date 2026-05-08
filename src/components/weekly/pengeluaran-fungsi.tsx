"use client";

import { useState, useCallback } from "react";
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PengeluaranFungsi() {
  // Pie state
  const [pieData,    setPieData]    = useState<FungsiPieRow[]>([]);
  const [pieLoading, setPieLoading] = useState(false);
  const [pieLoaded,  setPieLoaded]  = useState(false);
  const [pieError,   setPieError]   = useState<string | null>(null);

  // Date param
  const [tglAkhir, setTglAkhir] = useState(thisFriday());

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

  return (
    <section className="pa-section pf-section">
      {/* ── Title ──────────────────────────────────────────────────────────── */}
      <div className="pa-header">
        <div>
          <h2 className="pa-title">Pengeluaran Pemerintah Berdasarkan Fungsi</h2>
          <p className="pa-subtitle">
            Komposisi Pagu Fungsi dan Realisasi K/L s.d. {tglAkhir}
          </p>
        </div>

        {/* ── Controls ────────────────────────────────────────────────────── */}
        <div className="pa-controls">
          <div className="pa-date-group">
            <label className="pa-ctrl-label" htmlFor="pf-tgl-akhir">Tanggal s.d.</label>
            <input id="pf-tgl-akhir" type="date" className="pa-date-input"
              value={tglAkhir} onChange={(e) => setTglAkhir(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="pa-load-btn" onClick={handleExportExcel} disabled={isLoading || tabelData.length === 0} style={{ backgroundColor: "#16a34a" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Excel
            </button>
            <button className="pa-load-btn" onClick={handleLoad} disabled={isLoading}>
              {isLoading ? (
                <><span className="bn-spinner" /> Memuat...</>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  Tampilkan
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Empty hint ────────────────────────────────────────────────────── */}
      {!pieLoaded && !tabelLoaded && !isLoading && (
        <div className="pa-empty-hint">Klik "Tampilkan" untuk memuat data.</div>
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
              <div className="bn-loading"><span className="bn-spinner bn-spinner-lg" /></div>
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
}
