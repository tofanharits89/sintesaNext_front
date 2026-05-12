"use client";

import React, { forwardRef, useImperativeHandle, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
} from "recharts";
import { apiPath } from "@/lib/config/base-path";
import { Skeleton } from "@/components/ui/skeleton";
import { Table2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SpasialMbgRow {
  PROVINSI: string;
  "SPPG *": number;
  "PENERIMA (JUTA)*": number;
  "TENAGA KERJA (RIBU)*": number;
  "REALISASI (MILIAR)**": number;
}

interface PiePenerimaRow {
  "Nilai Slice Biru (Aktual)": number;
  "Nilai Slice Kuning (Sisa Target)": number;
  "Legend Aktual": string;
  "Legend Potensi": string;
  "Teks Tengah Donut": string;
}

interface PieSppgRow {
  "Nilai Slice Hijau (Aktual)": number;
  "Nilai Slice Merah (Sisa Target)": number;
  "Legend Aktual": string;
  "Legend Rencana": string;
  "Teks Tengah Donut": string;
}

interface BarTop10Row {
  Wilayah: string;
  "Jumlah Penerima": number;
}

// ─── Handle ───────────────────────────────────────────────────────────────────

export interface SpasialMbgHandle {
  load: () => void;
  exportExcel: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt2(v: number | null | undefined): string {
  if (v == null) return "-";
  return v.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtInt(v: number | null | undefined): string {
  if (v == null) return "-";
  return v.toLocaleString("id-ID");
}

function firstOfYear(): string {
  return `${new Date().getFullYear()}-01-01`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function fetchJSON<T>(url: string): Promise<T[]> {
  const res = await fetch(url, { credentials: "include", cache: "no-store", signal: AbortSignal.timeout(60_000) });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return JSON.parse(text)?.data ?? [];
}

// ─── Donut Chart Component ────────────────────────────────────────────────────

function DonutChart({
  title,
  aktual,
  sisa,
  pctText,
  legendAktual,
  legendSisa,
  colorAktual,
  colorSisa,
}: {
  title: string;
  aktual: number;
  sisa: number;
  pctText: string;
  legendAktual: string;
  legendSisa: string;
  colorAktual: string;
  colorSisa: string;
}) {
  const data = [
    { name: legendAktual, value: aktual },
    { name: legendSisa,   value: Math.max(sisa, 0) },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-[11px] font-bold text-center text-slate-700 uppercase tracking-wide">{title}</div>
      <div className="relative w-[160px] h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={74}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={2}
            >
              <Cell fill={colorAktual} />
              <Cell fill={colorSisa} />
            </Pie>
            <ReTooltip
              formatter={(v: any, name?: string | number) => [
                typeof v === "number" ? v.toLocaleString("id-ID") : v,
                name ?? "",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[15px] font-extrabold text-slate-800">{pctText}</span>
        </div>
      </div>
      {/* Legend */}
      <div className="flex flex-col gap-1 w-full max-w-[200px]">
        <div className="flex items-start gap-1.5 text-[10px] leading-tight">
          <span className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ background: colorAktual }} />
          <span className="text-slate-700">{legendAktual}</span>
        </div>
        <div className="flex items-start gap-1.5 text-[10px] leading-tight">
          <span className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ background: colorSisa }} />
          <span className="text-slate-600">{legendSisa}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Bar Chart Component ──────────────────────────────────────────────────────

function Top10BarChart({ data }: { data: BarTop10Row[] }) {
  // Sort ascending for horizontal bar (bottom = highest)
  const sorted = [...data].reverse();

  return (
    <div className="w-full">
      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide text-center mb-2">
        Top 10 Penerima MBG per Provinsi (Juta)
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          layout="vertical"
          data={sorted}
          margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis
            type="number"
            tick={{ fontSize: 9, fill: "#64748b" }}
            tickFormatter={(v) => v.toLocaleString("id-ID")}
          />
          <YAxis
            type="category"
            dataKey="Wilayah"
            width={130}
            tick={{ fontSize: 9, fill: "#334155" }}
          />
          <ReTooltip
            formatter={(v: any) => [`${Number(v).toLocaleString("id-ID")} Juta`, "Penerima"] as [string, string]}
            labelStyle={{ fontSize: 11 }}
          />
          <Bar dataKey="Jumlah Penerima" fill="#1b5ea8" radius={[0, 3, 3, 0]} barSize={14}>
            <LabelList
              dataKey="Jumlah Penerima"
              position="right"
              style={{ fontSize: 9, fill: "#1e40af", fontWeight: 600 }}
              formatter={(v: any) => Number(v).toLocaleString("id-ID")}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Province Table ───────────────────────────────────────────────────────────

function ProvTable({ rows }: { rows: SpasialMbgRow[] }) {
  return (
    <div className="pa-table-wrap">
      <table className="pa-table">
        <thead>
          <tr>
            {(["PROVINSI", "SPPG *", "PENERIMA (JUTA)*", "TENAGA KERJA (RIBU)*", "REALISASI (MILIAR)**"] as const).map((h) => (
              <th key={h} className="pa-th">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isRowTotal = row.PROVINSI === "TOTAL";
            return (
              <tr key={i} className={`pa-tr ${isRowTotal ? "pa-tr-grand" : ""}`}>
                <td className="pa-td font-medium text-left whitespace-normal">{row.PROVINSI}</td>
                <td className="pa-td pa-td-num">{fmtInt(row["SPPG *"])}</td>
                <td className="pa-td pa-td-num">{fmt2(row["PENERIMA (JUTA)*"])}</td>
                <td className="pa-td pa-td-num">{fmt2(row["TENAGA KERJA (RIBU)*"])}</td>
                <td className="pa-td pa-td-num">{fmt2(row["REALISASI (MILIAR)**"])}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Charts skeleton */}
        <div className="flex flex-col gap-4">
          {[1, 2].map((k) => (
            <div key={k} className="rounded-lg border border-slate-200 p-4 flex flex-col items-center gap-2">
              <Skeleton className="h-3 w-32 bg-slate-200" />
              <Skeleton className="h-36 w-36 rounded-full bg-slate-200" />
              <Skeleton className="h-2 w-40 bg-slate-200" />
              <Skeleton className="h-2 w-40 bg-slate-200" />
            </div>
          ))}
          <div className="rounded-lg border border-slate-200 p-4">
            <Skeleton className="h-3 w-32 mx-auto mb-2 bg-slate-200" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full mb-1.5 bg-slate-200" />
            ))}
          </div>
        </div>
        {/* Table skeleton */}
        <div className="lg:col-span-2 rounded-lg border border-slate-200 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className={`flex gap-2 p-2 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
              <Skeleton className="h-3 w-28 bg-slate-200" />
              {Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="h-3 w-14 ml-auto bg-slate-200" />)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const SpasialMbg = forwardRef<SpasialMbgHandle, {
  tglAwal?: string;
  tglAkhir?: string;
}>(function SpasialMbg({ tglAwal: tglAwalProp, tglAkhir: tglAkhirProp }, ref) {
  const tglAwal  = tglAwalProp  ?? firstOfYear();
  const tglAkhir = tglAkhirProp ?? today();

  const [rows,         setRows]         = useState<SpasialMbgRow[]>([]);
  const [piePenerima,  setPiePenerima]  = useState<PiePenerimaRow | null>(null);
  const [pieSppg,      setPieSppg]      = useState<PieSppgRow | null>(null);
  const [barTop10,     setBarTop10]     = useState<BarTop10Row[]>([]);

  const [loading, setLoading] = useState(false);
  const [loaded,  setLoaded]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleLoad = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ tglAwal, tglAkhir });
      const [tableData, piePenData, pieSppgData, barData] = await Promise.all([
        fetchJSON<SpasialMbgRow>(apiPath(`/weekly/spasial-mbg?${qs}`)),
        fetchJSON<PiePenerimaRow>(apiPath(`/weekly/spasial-mbg/pie-penerima`)),
        fetchJSON<PieSppgRow>(apiPath(`/weekly/spasial-mbg/pie-sppg`)),
        fetchJSON<BarTop10Row>(apiPath(`/weekly/spasial-mbg/bar-top10`)),
      ]);
      setRows(tableData);
      setPiePenerima(piePenData[0] ?? null);
      setPieSppg(pieSppgData[0] ?? null);
      setBarTop10(barData);
      setLoaded(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tglAwal, tglAkhir]);

  const handleExportExcel = useCallback(() => {
    if (!rows.length) return;
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Spasial MBG");
    XLSX.writeFile(wb, `Progres_Spasial_MBG_${tglAwal}_${tglAkhir}.xlsx`);
  }, [rows, tglAwal, tglAkhir]);

  useImperativeHandle(ref, () => ({ load: handleLoad, exportExcel: handleExportExcel }), [handleLoad, handleExportExcel]);

  const dataRows  = rows.filter((r) => r.PROVINSI !== "TOTAL");
  const totalRow  = rows.find((r) => r.PROVINSI === "TOTAL");
  const half      = Math.ceil(dataRows.length / 2);
  const leftRows  = dataRows.slice(0, half);
  const rightRows = dataRows.slice(half);

  return (
    <section className="pa-section space-y-4">
      {/* ── Empty state ───────────────────────────────────────────────── */}
      {!loaded && !loading && (
        <div className="border rounded-md">
          <div className="h-10 bg-muted/50 border-b flex items-center px-4">
            <div className="text-xs font-medium text-muted-foreground uppercase">Data belum dimuat</div>
          </div>
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-background/50">
            <Table2 className="h-10 w-10 mb-2 opacity-20" />
            <p className="text-sm">Silahkan Pilih Tanggal dan klik &quot;Tampilkan&quot; untuk memuat data</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm px-4 py-3">
          Error: {error}
        </div>
      )}

      {loading && <PageSkeleton />}

      {/* ── Data ──────────────────────────────────────────────────────── */}
      {loaded && !loading && (
        <div className="space-y-4">
          {/* Notes */}
          <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground italic">
            <span>* Sumber: Data Summary Prov (tgtarik terakhir)</span>
            <span>** Sumber: Realisasi via mapping SPPG–Norekening</span>
          </div>

          {/* Main layout: chart column (left) + table (right) */}
          <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4 items-start">

            {/* ── Left Column: Charts ───────────────────────────────────── */}
            <div className="flex flex-col gap-4">

              {/* Donut Penerima */}
              {piePenerima && (
                <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
                  <DonutChart
                    title="Jumlah Penerima MBG"
                    aktual={Number(piePenerima["Nilai Slice Biru (Aktual)"])}
                    sisa={Number(piePenerima["Nilai Slice Kuning (Sisa Target)"])}
                    pctText={piePenerima["Teks Tengah Donut"]}
                    legendAktual={piePenerima["Legend Aktual"]}
                    legendSisa={piePenerima["Legend Potensi"]}
                    colorAktual="#1b5ea8"
                    colorSisa="#fbbf24"
                  />
                </div>
              )}

              {/* Donut SPPG */}
              {pieSppg && (
                <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
                  <DonutChart
                    title="Jumlah SPPG"
                    aktual={Number(pieSppg["Nilai Slice Hijau (Aktual)"])}
                    sisa={Number(pieSppg["Nilai Slice Merah (Sisa Target)"])}
                    pctText={pieSppg["Teks Tengah Donut"]}
                    legendAktual={pieSppg["Legend Aktual"]}
                    legendSisa={pieSppg["Legend Rencana"]}
                    colorAktual="#16a34a"
                    colorSisa="#f87171"
                  />
                </div>
              )}

              {/* Bar Top-10 */}
              {barTop10.length > 0 && (
                <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
                  <Top10BarChart data={barTop10} />
                </div>
              )}
            </div>

            {/* ── Right Column: Province Table ──────────────────────────── */}
            <div className="pa-table-card">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="border-r border-border">
                  <ProvTable rows={leftRows} />
                </div>
                <div>
                  <ProvTable rows={rightRows} />
                </div>
              </div>

              {totalRow && (
                <div className="border-t border-border">
                  <ProvTable rows={[totalRow]} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

export default SpasialMbg;
