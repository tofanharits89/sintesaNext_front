"use client";

import { useState, useCallback } from "react";
import { apiPath } from "@/lib/config/base-path";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RealisasiKlRow {
  "BAGIAN ANGGARAN": string;
  "Real s.d. 29 Apr 2025": number;
  "% thd APBN 2025": number;
  APBN: number;
  DIPA: number;
  "REAL s.d. 24 April 2026": number;
  "25 - 29 Apr 2026": number;
  "REAL s.d. 29 Apr 2026": number;
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
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
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
    "Real s.d. 29 Apr 2025": Number(d["Real s.d. 29 Apr 2025"]),
    "% thd APBN 2025": Number(d["% thd APBN 2025"]),
    APBN: Number(d.APBN),
    DIPA: Number(d.DIPA),
    "REAL s.d. 24 April 2026": Number(d["REAL s.d. 24 April 2026"]),
    "25 - 29 Apr 2026": Number(d["25 - 29 Apr 2026"]),
    "REAL s.d. 29 Apr 2026": Number(d["REAL s.d. 29 Apr 2026"]),
    "% thd APBN": Number(d["% thd APBN"]),
    "% thd DIPA": Number(d["% thd DIPA"]),
    "Sisa Pagu APBN": Number(d["Sisa Pagu APBN"]),
    "Sisa Pagu DIPA": Number(d["Sisa Pagu DIPA"]),
    "Growth YoY": Number(d["Growth YoY"]),
  }));
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RealisasiKlWeekly() {
  // Date params
  const [tglAwal, setTglAwal] = useState(thisMonday());
  const [tglAkhir, setTglAkhir] = useState(thisFriday());

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

  return (
    <section className="pa-section">
      {/* ── Title ──────────────────────────────────────────────────────────── */}
      <div className="pa-header">
        <div>
          <h2 className="pa-title">Belanja K/L: Realisasi 15 K/L dengan Pagu APBN Terbesar</h2>
          <p className="pa-subtitle">
            Realisasi K/L beserta sisa pagu s.d. {strAkhir26}
          </p>
        </div>

        {/* ── Controls ────────────────────────────────────────────────────── */}
        <div className="pa-controls">
          <div className="pa-date-group">
            <label className="pa-ctrl-label" htmlFor="rk-tgl-awal">Awal Periode</label>
            <input id="rk-tgl-awal" type="date" className="pa-date-input"
              value={tglAwal} onChange={(e) => setTglAwal(e.target.value)} />
          </div>
          <div className="pa-date-group">
            <label className="pa-ctrl-label" htmlFor="rk-tgl-akhir">Akhir Periode</label>
            <input id="rk-tgl-akhir" type="date" className="pa-date-input"
              value={tglAkhir} onChange={(e) => setTglAkhir(e.target.value)} />
          </div>
          <button className="pa-load-btn" onClick={handleLoad} disabled={loading}>
            {loading ? (
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

      {/* ── Empty hint ────────────────────────────────────────────────────── */}
      {!loaded && !loading && (
        <div className="pa-empty-hint">Klik "Tampilkan" untuk memuat data.</div>
      )}

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {error && <div className="bn-error">{error}</div>}

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {loaded && (
        <div className="pa-table-card rk-table-card">
          {loading ? (
            <div className="bn-loading"><span className="bn-spinner bn-spinner-lg" /></div>
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
                      Real<br/>s.d.<br/>{strAkhir25}
                    </th>
                    <th className="pa-th rk-th-dark">
                      % thd<br/>APBN
                    </th>
                    
                    <th className="pa-th rk-th-yellow">APBN</th>
                    <th className="pa-th rk-th-yellow">DIPA</th>
                    
                    <th className="pa-th rk-th-yellow">
                      REAL<br/>s.d.<br/>{strSd26}
                    </th>
                    <th className="pa-th rk-th-yellow">
                      {strAwal26} - {strAkhir26}
                    </th>
                    <th className="pa-th rk-th-yellow">
                      REAL<br/>s.d.<br/>{strAkhir26}
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
                        <td className="pa-td pa-td-num">{fmt1(row["Real s.d. 29 Apr 2025"])}</td>
                        <td className="pa-td pa-td-num">{fmtPct(row["% thd APBN 2025"])}</td>
                        
                        {/* 2026 Metriks */}
                        <td className="pa-td pa-td-num">{fmt1(row.APBN)}</td>
                        <td className="pa-td pa-td-num">{fmt1(row.DIPA)}</td>
                        
                        <td className="pa-td pa-td-num">{fmt1(row["REAL s.d. 24 April 2026"])}</td>
                        <td className="pa-td pa-td-num rk-td-highlight">{fmt1(row["25 - 29 Apr 2026"])}</td>
                        <td className="pa-td pa-td-num rk-td-highlight">{fmt1(row["REAL s.d. 29 Apr 2026"])}</td>
                        
                        <td className="pa-td pa-td-num">{fmtPct(row["% thd APBN"])}</td>
                        <td className="pa-td pa-td-num">{fmtPct(row["% thd DIPA"])}</td>
                        
                        <td className="pa-td pa-td-num">{fmt1(row["Sisa Pagu APBN"])}</td>
                        <td className="pa-td pa-td-num">{fmt1(row["Sisa Pagu DIPA"])}</td>
                        
                        <td className="pa-td pa-td-num">{fmtPct(row["Growth YoY"])}</td>
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
}
