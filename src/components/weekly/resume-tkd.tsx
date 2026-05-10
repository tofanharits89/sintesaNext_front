"use client";

import { useState, useCallback, useImperativeHandle, forwardRef } from "react";
import * as XLSX from "xlsx";
import { apiPath } from "@/lib/config/base-path";
import { Table2 } from "lucide-react";

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

// ─── Handle ───────────────────────────────────────────────────────────────────

export interface ResumeTkdHandle {
  load: () => void;
  exportExcel: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const ResumeTkd = forwardRef<ResumeTkdHandle, {
  tglAwal?: string;
  tglAkhir?: string;
}>(function ResumeTkd({ tglAwal: tglAwalProp, tglAkhir: tglAkhirProp }, ref) {
    const [tglAwalInternal, setTglAwalInternal] = useState(thisMonday());
    const [tglAkhirInternal, setTglAkhirInternal] = useState(thisFriday());

    const tglAwal = tglAwalProp ?? tglAwalInternal;
    const tglAkhir = tglAkhirProp ?? tglAkhirInternal;

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

    useImperativeHandle(ref, () => ({
        load: handleLoad,
        exportExcel: handleExportExcel,
    }), [handleLoad, bodyData]);

    // Calculate max value for the bar chart
    let maxVal = 0;
    if (bodyData.length > 0) {
        maxVal = Math.max(...bodyData.map(d => Math.max(d["2026 (Rp Triliun)"], d["2025 (Rp Triliun)"])));
        if (maxVal === 0) maxVal = 1; // prevent div by zero
    }

    return (
        <section className="pa-section rt-section">
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
});

export default ResumeTkd;
