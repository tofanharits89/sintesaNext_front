"use client";

import { useState, useMemo } from "react";
import { useBelanjaNegaraWeekly, type BelanjaNegaraRow } from "@/hooks/use-belanja-negara-weekly";

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
  return (
    <div className="bn-date-field">
      <label className="bn-date-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        type="date"
        className="bn-date-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BelanjaNegaraWeekly() {
  // Date state
  const [tglSd2026,    setTglSd2026]    = useState(lastFriday());
  const [tglAwal2026,  setTglAwal2026]  = useState(thisMonday());
  const [tglAkhir2026, setTglAkhir2026] = useState(thisFriday());
  const [tglYoy2025,   setTglYoy2025]   = useState(() => {
    const d = new Date(thisFriday());
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [tglReal2025, setTglReal2025] = useState("2025-05-31");

  // Applied params (only updated on "Tampilkan" click)
  const [appliedParams, setAppliedParams] = useState({
    tglSd2026:    lastFriday(),
    tglAwal2026:  thisMonday(),
    tglAkhir2026: thisFriday(),
    tglYoy2025:   (() => {
      const d = new Date(thisFriday());
      d.setFullYear(d.getFullYear() - 1);
      return d.toISOString().slice(0, 10);
    })(),
    tglReal2025:  "2025-05-31",
  });

  const { data, isLoading, error, refetch } = useBelanjaNegaraWeekly(appliedParams);

  const handleApply = () => {
    setAppliedParams({ tglSd2026, tglAwal2026, tglAkhir2026, tglYoy2025, tglReal2025 });
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
      <div className="bn-page-header">
        <div className="bn-title-block">
          <h1 className="bn-page-title">Belanja Negara</h1>
          <p className="bn-page-subtitle">Realisasi Mingguan — Update s.d. {titleDate}</p>
        </div>
        {bnRow && !isLoading && (
          <div className="bn-headline-badges">
            <div className="bn-badge-card bn-badge-realisasi">
              <span className="bn-badge-label">Realisasi s.d. {titleDate}</span>
              <span className="bn-badge-value">Rp {fmtTriliun(bnRow["Realisasi s.d. 29 Apr 2026"])} T</span>
            </div>
            <div className={`bn-badge-card bn-badge-growth ${growthColor(bnRow["Growth YoY (%)"])}`}>
              <span className="bn-badge-label">Growth YoY</span>
              <span className="bn-badge-value">{fmtPct(bnRow["Growth YoY (%)"])}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Date Filter Panel ───────────────────────────────────────────────── */}
      <div className="bn-filter-panel">
        <div className="bn-filter-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>Parameter Tanggal</span>
        </div>

        <div className="bn-filter-grid">
          <div className="bn-filter-group">
            <span className="bn-filter-group-label">2026</span>
            <div className="bn-filter-row">
              <DateField id="tgl-sd-2026"    label="s.d. Awal Minggu"   value={tglSd2026}    onChange={setTglSd2026} />
              <DateField id="tgl-awal-2026"  label="Awal Minggu Ini"    value={tglAwal2026}  onChange={setTglAwal2026} />
              <DateField id="tgl-akhir-2026" label="Akhir Minggu Ini"   value={tglAkhir2026} onChange={setTglAkhir2026} />
            </div>
          </div>

          <div className="bn-filter-group">
            <span className="bn-filter-group-label">2025</span>
            <div className="bn-filter-row">
              <DateField id="tgl-real-2025" label="Real 2025 s.d."  value={tglReal2025} onChange={setTglReal2025} />
              <DateField id="tgl-yoy-2025"  label="YoY 2025 s.d."   value={tglYoy2025}  onChange={setTglYoy2025} />
            </div>
          </div>
        </div>

        <button
          className="bn-apply-btn"
          onClick={handleApply}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="bn-spinner" />
              Memuat...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              Tampilkan Data
            </>
          )}
        </button>
      </div>

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {error && (
        <div className="bn-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {String((error as any)?.message || error)}
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="bn-table-wrapper">
        {isLoading ? (
          <div className="bn-loading">
            <span className="bn-spinner bn-spinner-lg" />
            <span>Memuat data...</span>
          </div>
        ) : (
          <table className="bn-table">
            <thead>
              <tr>
                <th rowSpan={2} className="bn-th bn-th-uraian">Uraian<br/><span className="bn-th-sub">(Rp triliun)</span></th>

                {/* 2025 group */}
                <th colSpan={3} className="bn-th bn-th-group bn-group-2025">Tahun 2025</th>

                {/* 2026 group */}
                <th colSpan={9} className="bn-th bn-th-group bn-group-2026">Tahun 2026</th>
              </tr>
              <tr>
                {/* 2025 sub-headers */}
                <th className="bn-th bn-th-num bn-group-2025">Pagu<br/>2025</th>
                <th className="bn-th bn-th-num bn-group-2025">Real s.d.<br/>{tglReal2025}</th>
                <th className="bn-th bn-th-num bn-group-2025">% Capaian<br/>2025</th>

                {/* 2026 sub-headers */}
                <th className="bn-th bn-th-num bn-group-2026">APBN<br/>2026</th>
                <th className="bn-th bn-th-num bn-group-2026">DIPA<br/>2026</th>
                <th className="bn-th bn-th-num bn-group-2026">Real s.d.<br/>{appliedParams.tglSd2026}</th>
                <th className="bn-th bn-th-num bn-group-2026">Real<br/>{appliedParams.tglAwal2026} – {appliedParams.tglAkhir2026}</th>
                <th className="bn-th bn-th-num bn-group-2026">Real s.d.<br/>{appliedParams.tglAkhir2026}</th>
                <th className="bn-th bn-th-num bn-group-2026">% thd<br/>APBN</th>
                <th className="bn-th bn-th-num bn-group-2026">% thd<br/>DIPA</th>
                <th className="bn-th bn-th-num bn-group-2026">Sisa Pagu<br/>APBN</th>
                <th className="bn-th bn-th-num bn-group-2026">Growth<br/>YoY (%)</th>
              </tr>
            </thead>

            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={13} className="bn-empty">Tidak ada data untuk parameter yang dipilih.</td>
                </tr>
              ) : (
                data.map((row, idx) => {
                  const level = rowLevel(row.uraian);
                  const growth = row["Growth YoY (%)"];
                  return (
                    <tr key={idx} className={`bn-tr bn-tr-${level}`}>
                      <td className="bn-td bn-td-uraian">{row.uraian}</td>

                      {/* 2025 */}
                      <td className="bn-td bn-td-num">{fmtTriliun(row["Pagu 2025"])}</td>
                      <td className="bn-td bn-td-num">{fmtTriliun(row["Realisasi 2025 (s.d. Mei)"])}</td>
                      <td className="bn-td bn-td-num">{fmtPct(row["% Capaian 2025"])}</td>

                      {/* 2026 */}
                      <td className="bn-td bn-td-num">{fmtTriliun(row["APBN 2026"])}</td>
                      <td className="bn-td bn-td-num">{fmtTriliun(row["DIPA 2026"])}</td>
                      <td className="bn-td bn-td-num">{fmtTriliun(row["Realisasi s.d. 24 Apr 2026"])}</td>
                      <td className="bn-td bn-td-num">{fmtTriliun(row["Realisasi 25-29 Apr 2026"])}</td>
                      <td className="bn-td bn-td-num bn-td-highlight">{fmtTriliun(row["Realisasi s.d. 29 Apr 2026"])}</td>
                      <td className="bn-td bn-td-num">{fmtPct(row["% thd APBN"])}</td>
                      <td className="bn-td bn-td-num">{fmtPct(row["% thd DIPA"])}</td>
                      <td className="bn-td bn-td-num">{fmtTriliun(row["Sisa Pagu APBN"])}</td>
                      <td className={`bn-td bn-td-num ${growthColor(growth)}`}>
                        {fmtPct(growth)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      <p className="bn-source">
        Sumber: OMSPAN Dit.PKN — data diperbarui s.d. {titleDate}
      </p>
    </section>
  );
}
