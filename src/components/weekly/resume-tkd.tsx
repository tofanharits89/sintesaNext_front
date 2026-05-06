"use client";

import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { apiPath } from "@/lib/config/base-path";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ResumeTkdHeaderRow {
    uraian: string;
    "Penyaluran (Rp Triliun)": number;
    "% dari Pagu": number;
    "Growth YoY (%)": number;
}

interface ResumeTkdBodyRow {
    "JENIS TKD": string;
    "2026 (Rp Triliun)": number;
    "2025 (Rp Triliun)": number;
    "GROWTH YoY (%)": number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt2(v: number | null | undefined): string {
    if (v == null) return "-";
    return v.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const fmtDateObjFull = (dString: string) => {
    if (!dString) return "";
    const d = new Date(dString);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
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

async function fetchHeader(tglSd26: string, tglAkhir25: string): Promise<ResumeTkdHeaderRow> {
    const qs = new URLSearchParams({ tglSd26, tglAkhir25 });
    const res = await fetch(apiPath(`/weekly/resume-tkd/header?${qs}`), {
        credentials: "include",
        cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = JSON.parse(text)?.data ?? [];
    const d = data[0] || {};
    return {
        ...d,
        "Penyaluran (Rp Triliun)": Number(d["Penyaluran (Rp Triliun)"]),
        "% dari Pagu": Number(d["% dari Pagu"]),
        "Growth YoY (%)": Number(d["Growth YoY (%)"]),
    } as ResumeTkdHeaderRow;
}

async function fetchBody(tglAkhir26: string, tglAkhir25Body: string): Promise<ResumeTkdBodyRow[]> {
    const qs = new URLSearchParams({ tglAkhir26, tglAkhir25Body });
    const res = await fetch(apiPath(`/weekly/resume-tkd/body?${qs}`), {
        credentials: "include",
        cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = JSON.parse(text)?.data ?? [];
    return data.map((d: any) => ({
        ...d,
        "2026 (Rp Triliun)": Number(d["2026 (Rp Triliun)"]),
        "2025 (Rp Triliun)": Number(d["2025 (Rp Triliun)"]),
        "GROWTH YoY (%)": Number(d["GROWTH YoY (%)"]),
    }));
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ResumeTkd() {
    const [tglAwal, setTglAwal] = useState(thisMonday());
    const [tglAkhir, setTglAkhir] = useState(thisFriday());

    const [headerData, setHeaderData] = useState<ResumeTkdHeaderRow | null>(null);
    const [bodyData, setBodyData] = useState<ResumeTkdBodyRow[]>([]);

    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Derive dates
    const dtAwal = new Date(tglAwal);
    const dtSd26 = new Date(dtAwal);
    dtSd26.setDate(dtSd26.getDate() - 1);
    const tglSd26 = dtSd26.toISOString().slice(0, 10);

    const dtSd25 = new Date(dtSd26);
    dtSd25.setFullYear(dtSd25.getFullYear() - 1);
    const tglAkhir25 = dtSd25.toISOString().slice(0, 10);

    const dtAkhir = new Date(tglAkhir);
    const dtAkhir25Body = new Date(dtAkhir);
    dtAkhir25Body.setFullYear(dtAkhir25Body.getFullYear() - 1);
    const strTglAkhir25Body = dtAkhir25Body.toISOString().slice(0, 10);

    const strDateSd26 = fmtDateObjFull(tglSd26);
    const strDateSd25 = fmtDateObjFull(tglAkhir25);

    const handleLoad = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [hData, bData] = await Promise.all([
                fetchHeader(tglSd26, tglAkhir25),
                fetchBody(tglAkhir, strTglAkhir25Body)
            ]);
            setHeaderData(hData);
            setBodyData(bData);
            setLoaded(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [tglSd26, tglAkhir25, tglAkhir, strTglAkhir25Body]);

    const handleExportExcel = () => {
        if (!bodyData || bodyData.length === 0) return;
        const ws = XLSX.utils.json_to_sheet(bodyData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ResumeTKD");
        const currentDate = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(wb, `Resume_TKD_${currentDate}.xlsx`);
    };

    // Calculate max value for the bar chart
    let maxVal = 0;
    if (bodyData.length > 0) {
        maxVal = Math.max(...bodyData.map(d => Math.max(d["2026 (Rp Triliun)"], d["2025 (Rp Triliun)"])));
        if (maxVal === 0) maxVal = 1; // prevent div by zero
    }

    return (
        <section className="pa-section rt-section">
            <div className="pa-header">
                <div>
                    <h2 className="pa-title">Resume Penyaluran TKD</h2>
                    <p className="pa-subtitle">Infografis & Komposisi Penyaluran TKD YoY</p>
                </div>
                <div className="pa-controls">
                    <div className="pa-date-group">
                        <label className="pa-ctrl-label" htmlFor="rt-tgl-awal">Awal Periode</label>
                        <input id="rt-tgl-awal" type="date" className="pa-date-input"
                            value={tglAwal} onChange={(e) => setTglAwal(e.target.value)} />
                    </div>
                    <div className="pa-date-group">
                        <label className="pa-ctrl-label" htmlFor="rt-tgl-akhir">Akhir Periode</label>
                        <input id="rt-tgl-akhir" type="date" className="pa-date-input"
                            value={tglAkhir} onChange={(e) => setTglAkhir(e.target.value)} />
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button className="pa-load-btn" onClick={handleExportExcel} disabled={loading || bodyData.length === 0} style={{ backgroundColor: "#16a34a" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            Excel
                        </button>
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
            </div>

            {!loaded && !loading && (
                <div className="pa-empty-hint">Klik "Tampilkan" untuk memuat data.</div>
            )}

            {error && <div className="bn-error">{error}</div>}

            {loaded && headerData && (
                <div className="rt-body">
                    {/* ── Header Infocard ────────────────────────────────────────────── */}
                    <div className="rt-header-card">
                        <div className="rt-hc-left">
                            <div className="rt-hc-title">
                                Total Penyaluran<br />TKD
                            </div>
                            <div className="rt-hc-value-group">
                                <span className="rt-hc-currency">Rp</span>
                                <span className="rt-hc-value">{fmt2(headerData["Penyaluran (Rp Triliun)"])}</span>
                                <span className="rt-hc-unit">T</span>
                                <div className="rt-hc-pct">
                                    <strong>{fmt2(headerData["% dari Pagu"])}%</strong> dari pagu
                                </div>
                            </div>
                        </div>
                        <div className="rt-hc-right">
                            <div className="rt-hc-growth">
                                {headerData["Growth YoY (%)"] > 0 ? (
                                    <span className="rt-arrow rt-arrow-up">▲</span>
                                ) : headerData["Growth YoY (%)"] < 0 ? (
                                    <span className="rt-arrow rt-arrow-down">▼</span>
                                ) : (
                                    <span className="rt-arrow rt-arrow-flat">-</span>
                                )}
                                {fmt2(Math.abs(headerData["Growth YoY (%)"]))}% <span className="rt-yoy-text">YoY</span>
                            </div>
                            <div className="rt-hc-dates">
                                <strong>{strDateSd26}</strong> dan <strong>{strDateSd25}</strong>
                            </div>
                        </div>
                    </div>

                    {/* ── Body Chart ─────────────────────────────────────────────────── */}
                    <div className="rt-chart-card">
                        <div className="rt-cc-header">
                            <div className="rt-cc-title">NILAI PENYALURAN <span>(Rp Triliun)</span></div>
                            <div className="rt-cc-growth-title">GROWTH YoY <span>(%)</span></div>
                        </div>

                        <div className="rt-cc-content">
                            {bodyData.map((row, i) => {
                                const w26 = (row["2026 (Rp Triliun)"] / maxVal) * 100;
                                const w25 = (row["2025 (Rp Triliun)"] / maxVal) * 100;
                                const growth = row["GROWTH YoY (%)"];

                                return (
                                    <div className="rt-row" key={i}>
                                        <div className="rt-row-label">{row["JENIS TKD"]}</div>
                                        <div className="rt-row-bars">
                                            <div className="rt-bar-wrap">
                                                <div className="rt-bar rt-bar-26" style={{ width: `${Math.max(w26, 0.5)}%` }}></div>
                                                <span className="rt-bar-val rt-val-26">{fmt2(row["2026 (Rp Triliun)"])}</span>
                                            </div>
                                            <div className="rt-bar-wrap">
                                                <div className="rt-bar rt-bar-25" style={{ width: `${Math.max(w25, 0.5)}%` }}></div>
                                                <span className="rt-bar-val rt-val-25">{fmt2(row["2025 (Rp Triliun)"])}</span>
                                            </div>
                                        </div>
                                        <div className="rt-row-growth">
                                            <span className={`rt-growth-icon ${growth > 0 ? "up" : growth < 0 ? "down" : "flat"}`}>
                                                {growth > 0 ? "▲" : growth < 0 ? "▼" : "-"}
                                            </span>
                                            <span className="rt-growth-val">{fmt2(Math.abs(growth))}%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="rt-cc-legend">
                            <div className="rt-legend-item"><span className="rt-leg-color rt-leg-26"></span> 2026</div>
                            <div className="rt-legend-item"><span className="rt-leg-color rt-leg-25"></span> 2025</div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
