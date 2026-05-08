"use client";

import { useState, useCallback } from "react";
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

async function fetchPie(): Promise<PieRow[]> {
  const res = await fetch(apiPath("/weekly/pengeluaran-akun/pie"), {
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PengeluaranAkun() {
  // Pie state
  const [pieData,    setPieData]    = useState<PieRow[]>([]);
  const [pieLoading, setPieLoading] = useState(false);
  const [pieLoaded,  setPieLoaded]  = useState(false);
  const [pieError,   setPieError]   = useState<string | null>(null);

  // Table date params
  const [tglAwal,  setTglAwal]  = useState(thisMonday());
  const [tglAkhir, setTglAkhir] = useState(thisFriday());

  // Table state
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
      fetchPie(),
      fetchBkpk(tglAwal, tglAkhir),
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
  }, [tglAwal, tglAkhir]);

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

  return (
    <section className="pa-section">
      {/* ── Title ──────────────────────────────────────────────────────────── */}
      <div className="pa-header">
        <div>
          <h2 className="pa-title">Pengeluaran Pemerintah Berdasarkan Akun Belanja</h2>
          <p className="pa-subtitle">
            Komposisi dan top-10 BKPK realisasi K/L s.d. {tglAkhir}
          </p>
        </div>

        {/* ── Date filter + button ──────────────────────────────────────── */}
        <div className="pa-controls">
          <div className="pa-date-group">
            <label className="pa-ctrl-label" htmlFor="pa-tgl-awal">Awal Periode</label>
            <input id="pa-tgl-awal" type="date" className="pa-date-input"
              value={tglAwal} onChange={(e) => setTglAwal(e.target.value)} />
          </div>
          <div className="pa-date-group">
            <label className="pa-ctrl-label" htmlFor="pa-tgl-akhir">Akhir Periode</label>
            <input id="pa-tgl-akhir" type="date" className="pa-date-input"
              value={tglAkhir} onChange={(e) => setTglAkhir(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="pa-load-btn" onClick={handleExportExcel} disabled={isLoading || bkpkData.length === 0} style={{ backgroundColor: "#16a34a" }}>
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
      {!pieLoaded && !bkpkLoaded && !isLoading && (
        <div className="pa-empty-hint">Klik "Tampilkan" untuk memuat data.</div>
      )}

      {/* ── Error banners ─────────────────────────────────────────────────── */}
      {pieError && <div className="bn-error">Pie chart: {pieError}</div>}
      {bkpkError && <div className="bn-error">Tabel BKPK: {bkpkError}</div>}

      {/* ── Main layout: Donut + Table side by side ─────────────────────── */}
      {(pieLoaded || bkpkLoaded) && (
        <div className="pa-body">

          {/* ── Donut ───────────────────────────────────────────────────── */}
          <div className="pa-chart-card">
            <div className="pa-chart-wrap">
              {pieLoading ? (
                <div className="bn-loading"><span className="bn-spinner bn-spinner-lg" /></div>
              ) : pieLoaded && pieData.length > 0 ? (
                <div className="pa-donut-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="total_realisasi"
                        nameKey="kategori_belanja"
                        cx="50%"
                        cy="50%"
                        innerRadius="52%"
                        outerRadius="78%"
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
          <div className="pa-table-card">
            {bkpkLoading ? (
              <div className="bn-loading"><span className="bn-spinner bn-spinner-lg" /></div>
            ) : bkpkLoaded ? (
              <div className="pa-table-wrap">
                <table className="pa-table">
                  <thead>
                    <tr>
                      <th className="pa-th pa-th-no">No</th>
                      <th className="pa-th pa-th-akun">Akun Belanja (BKPK)<br /><span className="pa-th-sub">(Rp Triliun)</span></th>
                      <th className="pa-th pa-th-num">APBN<br />2026</th>
                      <th colSpan={2} className="pa-th pa-th-group">Realisasi</th>
                      <th className="pa-th pa-th-num">% thd<br />APBN</th>
                    </tr>
                    <tr>
                      <th className="pa-th" colSpan={3}></th>
                      <th className="pa-th pa-th-num pa-th-sub-col">
                        {tglAwal}<br />– {tglAkhir}
                      </th>
                      <th className="pa-th pa-th-num pa-th-sub-col">
                        s.d.<br />{tglAkhir}
                      </th>
                      <th className="pa-th"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bkpkData.map((row, i) => {
                      const isSub = isSubTotal(row["Akun Belanja (BKPK)"]);
                      const uraian = row["Akun Belanja (BKPK)"];
                      const isGrandTotal = uraian.includes("Total Seluruhnya");
                      const isTop10Total = uraian.includes("Total 10 BKPK");
                      return (
                        <tr
                          key={i}
                          className={`pa-tr${isSub ? (isGrandTotal ? " pa-tr-grand" : isTop10Total ? " pa-tr-subtotal" : " pa-tr-sub") : ""}`}
                        >
                          <td className="pa-td pa-td-no">{row["No"]}</td>
                          <td className="pa-td pa-td-akun">{uraian.trim()}</td>
                          <td className="pa-td pa-td-num">{fmt1(row["APBN 2026"])}</td>
                          <td className="pa-td pa-td-num">{fmt1(row["Realisasi 25 - 29 Apr 2026"])}</td>
                          <td className="pa-td pa-td-num pa-td-highlight">{fmt1(row["Realisasi s.d. 29 Apr 2026"])}</td>
                          <td className="pa-td text-center">
                            <Badge variant="secondary" className="font-bold px-3">{fmtPct(row["% thd APBN"])}</Badge>
                          </td>
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
