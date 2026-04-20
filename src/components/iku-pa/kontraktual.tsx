"use client";

import React, { useState, useCallback, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

// ─── Konstanta ────────────────────────────────────────────────────────────────

const SUBDIT_DEFS = [
  { label: "Subdit PA I", subdit: "I" },
  { label: "Subdit PA II", subdit: "II" },
  { label: "Subdit PA III", subdit: "III" },
  { label: "Subdit PA IV", subdit: "IV" },
];
const triwulans = ["Tw I", "Tw II", "Tw III", "Tw IV"];

// ─── Tipe ─────────────────────────────────────────────────────────────────────

type SummaryRow = {
  kddept: string;
  nmdept: string;
  subdit: string;
  jenbel: string;
  periode: string;
  kontrak: number;
  pagu: number;
  persentase: number;
  indeks: number;
};

type DetailRow = {
  id: number;
  kddept?: string;
  nmdept?: string;
  kdunit?: string;
  nmunit?: string;
  kdsatker?: string;
  nmsatker?: string;
  subdit?: string;
  seksi?: string;
  jenbel?: string;
  periode?: string;
  kontrak?: number;
  pagu?: number;
};

type ActiveCell = { subditIdx: number; twIdx: number } | null;

// averages[subdit] = [avgTw1, avgTw2, avgTw3, avgTw4]
type HeaderAverages = Record<string, (number | null)[]>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);

const indeksColor = (idx: number) => {
  if (idx >= 4.75) return "text-green-600 font-semibold";
  if (idx >= 4) return "text-blue-600 font-semibold";
  if (idx >= 3.75) return "text-yellow-600 font-semibold";
  return "text-red-600 font-semibold";
};

// ─── Komponen Utama ──────────────────────────────────────────────────────────

export default function KontraktualContent() {
  const [active, setActive] = useState<ActiveCell>({ subditIdx: 0, twIdx: 0 });
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal detail
  const [modal, setModal] = useState<{ open: boolean; row: SummaryRow | null }>(
    { open: false, row: null },
  );
  const [detailRows, setDetailRows] = useState<DetailRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Rata-rata indeks per subdit × triwulan untuk header card
  const [headerAvg, setHeaderAvg] = useState<HeaderAverages>({
    I: [null, null, null, null],
    II: [null, null, null, null],
    III: [null, null, null, null],
    IV: [null, null, null, null],
  });

  // Ambil rata-rata header saat mount
  useEffect(() => {
    axios
      .get<{ averages: HeaderAverages }>(
        "/api/v1/iku-pa/kontrak/header-averages",
        {
          withCredentials: true,
        },
      )
      .then((res) => setHeaderAvg(res.data.averages))
      .catch(() => {
        /* biarkan nilai default null */
      });
  }, []);

  const fetchData = useCallback(
    async (subditIdx: number, twIdx: number) => {
      const g = SUBDIT_DEFS[subditIdx];
      if (!g) return;
      const avg = headerAvg[g.subdit]?.[twIdx] ?? 0;

      setActive({ subditIdx, twIdx });
      setLoading(true);
      setError(null);

      try {
        const res = await axios.get("/api/v1/iku-pa/kontrak/summary", {
          params: { subdit: g.subdit, triwulan: twIdx + 1, target: avg },
          withCredentials: true,
        });
        setRows(res.data.result ?? []);
      } catch {
        setError("Gagal memuat data. Silakan coba lagi.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [headerAvg],
  );

  // Fetch default (Subdit PA I, Tw I) saat mount
  useEffect(() => {
    fetchData(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeGroup = active ? SUBDIT_DEFS[active.subditIdx] : null;
  const activeTw = active ? triwulans[active.twIdx] : null;
  const activeAvg = activeGroup
    ? headerAvg[activeGroup.subdit]?.[active!.twIdx]
    : null;
  const handleDetailsClick = async (r: SummaryRow) => {
    setModal({ open: true, row: r });
    setDetailRows([]);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await axios.get("/api/v1/iku-pa/kontrak/detail", {
        params: { kddept: r.kddept, periode: r.periode, jenbel: r.jenbel },
        withCredentials: true,
      });
      setDetailRows(res.data.result ?? []);
    } catch {
      setDetailError("Gagal memuat detail. Silakan coba lagi.");
    } finally {
      setDetailLoading(false);
    }
  };

  const downloadDetailExcel = () => {
    if (detailRows.length === 0) return;
    const { row } = modal;
    const wsData = [
      [
        "No",
        "Kode Dept",
        "K/L",
        "Kode Unit",
        "Unit",
        "Kode Satker",
        "Satker",
        "Subdit",
        "Seksi",
        "Jenbel",
        "Periode",
        "Pagu (Rp)",
        "Kontrak (Rp)",
      ],
      ...detailRows.map((d, i) => [
        i + 1,
        d.kddept ?? "",
        d.nmdept ?? "",
        d.kdunit ?? "",
        d.nmunit ?? "",
        d.kdsatker ?? "",
        d.nmsatker ?? "",
        d.subdit ?? "",
        d.seksi ?? "",
        d.jenbel ?? "",
        d.periode ?? "",
        d.pagu ?? 0,
        d.kontrak ?? 0,
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Detail");
    const fileName = `Detail_${row?.kddept ?? ""}_${row?.jenbel ?? ""}_${row?.periode ?? ""}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const downloadExcel = () => {
    if (rows.length === 0) return;
    const wsData = [
      [
        "No",
        "Kode",
        "Kementerian / Lembaga",
        "Periode",
        "Pagu (Rp)",
        "Kontrak (Rp)",
        "% Kontrak",
        "Indeks",
      ],
      ...rows.map((r, i) => [
        i + 1,
        r.kddept,
        r.nmdept,
        r.periode,
        r.pagu,
        r.kontrak,
        Number(r.persentase).toFixed(2) + "%",
        r.indeks,
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "IKI Kontraktual");
    const fileName =
      `IKI_Kontraktual_${activeGroup?.label ?? ""}_${activeTw ?? ""}.xlsx`.replace(
        /\s+/g,
        "_",
      );
    XLSX.writeFile(wb, fileName);
  };
  return (
    <>
      <div className="space-y-4">
        {/* ── Header Card ─────────────────────────────────────────────────────── */}
        <div className="overflow-x-auto rounded-lg border border-yellow-400">
          <table className="w-full border-collapse text-xs">
            <thead>
              {/* Baris 1: Subdit label */}
              <tr>
                {SUBDIT_DEFS.map((g, i) => (
                  <th
                    key={g.label}
                    colSpan={8}
                    className={`bg-blue-900 text-white font-bold text-center py-2 px-4 ${
                      i < SUBDIT_DEFS.length - 1
                        ? "border-r-2 border-yellow-400"
                        : ""
                    }`}
                  >
                    {g.label}
                  </th>
                ))}
              </tr>
              {/* Baris 2: Tw + Rata-rata Indeks (klik) */}
              <tr>
                {SUBDIT_DEFS.map((g, gi) =>
                  triwulans.map((tw, ti) => {
                    const isActive =
                      active?.subditIdx === gi && active?.twIdx === ti;
                    const avg = headerAvg[g.subdit]?.[ti];
                    const display =
                      avg !== null && avg !== undefined ? avg : "—";
                    return (
                      <React.Fragment key={`${gi}-${ti}`}>
                        <th className="bg-blue-900 text-white text-center py-1.5 px-3 border border-yellow-400 font-normal whitespace-nowrap min-w-[40px]">
                          {tw}
                        </th>
                        <th
                          onClick={() => fetchData(gi, ti)}
                          className={`text-center py-1.5 px-3 border border-yellow-400 font-bold min-w-[36px] cursor-pointer transition-colors ${
                            isActive
                              ? "bg-yellow-400 text-blue-900"
                              : "bg-blue-900 text-white hover:bg-yellow-400 hover:text-blue-900"
                          } ${
                            ti === triwulans.length - 1 &&
                            gi < SUBDIT_DEFS.length - 1
                              ? "border-r-2 border-r-yellow-400"
                              : ""
                          }`}
                          title={`Lihat ${g.label} – ${tw} (rata-rata indeks: ${display})`}
                        >
                          {display}
                        </th>
                      </React.Fragment>
                    );
                  }),
                )}
              </tr>
            </thead>
          </table>
        </div>

        {/* ── Judul aktif ─────────────────────────────────────────────────────── */}
        {activeGroup && (
          <div className="text-sm font-medium text-muted-foreground">
            Menampilkan:{" "}
            <span className="text-foreground font-semibold">
              {activeGroup.label} — {activeTw}
            </span>{" "}
            · Rata-rata indeks:{" "}
            <span className="text-foreground font-semibold">
              {activeAvg ?? "—"}
            </span>
          </div>
        )}

        {/* ── Tabel data ──────────────────────────────────────────────────────── */}
        <div className="flex justify-end">
          <button
            onClick={downloadExcel}
            disabled={rows.length === 0 || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-green-600 text-green-700 hover:bg-green-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Unduh Excel"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            Download Excel
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border shadow-sm">
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Memuat data…
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-red-500">
              {error}
            </div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Tidak ada data untuk filter ini.
            </div>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="border border-blue-700 px-3 py-2 text-center w-8">
                    No
                  </th>
                  <th className="border border-blue-700 px-3 py-2 text-left min-w-[60px]">
                    BA
                  </th>
                  <th className="border border-blue-700 px-3 py-2 text-left min-w-[200px]">
                    Kementerian / Lembaga
                  </th>
                  <th className="border border-blue-700 px-3 py-2 text-left min-w-[200px]">
                    Jenis Belanja
                  </th>
                  <th className="border border-blue-700 px-3 py-2 text-center">
                    Periode
                  </th>
                  <th className="border border-blue-700 px-3 py-2 text-right min-w-[120px]">
                    Pagu (Rp)
                  </th>
                  <th className="border border-blue-700 px-3 py-2 text-right min-w-[120px]">
                    Kontrak (Rp)
                  </th>
                  <th className="border border-blue-700 px-3 py-2 text-right">
                    % Kontrak
                  </th>
                  <th className="border border-blue-700 px-3 py-2 text-center">
                    Indeks
                  </th>
                  <th className="border border-blue-700 px-1 py-1 text-center">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={`${r.kddept}-${r.periode}-${r.jenbel}-${i}`}
                    className="hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    <td className="border border-gray-300 dark:border-gray-700 px-2 py-1.5 text-center">
                      {i + 1}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 px-2 py-1.5 font-mono">
                      {r.kddept}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 px-3 py-1.5">
                      {r.nmdept}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 px-3 py-1.5">
                      {r.jenbel}
                    </td>

                    <td className="border border-gray-300 dark:border-gray-700 px-2 py-1.5 text-center">
                      {r.periode}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 px-2 py-1.5 text-right">
                      {fmt(r.pagu)}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 px-2 py-1.5 text-right">
                      {fmt(r.kontrak)}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 px-2 py-1.5 text-right">
                      {Number(r.persentase).toFixed(2)}%
                    </td>
                    <td
                      className={`border border-gray-300 dark:border-gray-700 px-2 py-1.5 text-center ${indeksColor(r.indeks)}`}
                    >
                      {r.indeks}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 px-2 py-1.5 text-center">
                      <button
                        title="Lihat detail satker"
                        onClick={() => handleDetailsClick(r)}
                        className="inline-flex items-center justify-center p-1 rounded text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modal Detail ──────────────────────────────────────────────────── */}
      {modal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setModal({ open: false, row: null })}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-blue-900 rounded-t-lg">
              <div className="text-white text-sm font-semibold">
                Detail Satker — {modal.row?.nmdept} | Jenbel:{" "}
                {modal.row?.jenbel} | Periode: {modal.row?.periode}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadDetailExcel}
                  disabled={detailRows.length === 0 || detailLoading}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-green-400 text-green-300 hover:bg-green-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Unduh Excel"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  Excel
                </button>
                <button
                  onClick={() => setModal({ open: false, row: null })}
                  className="text-white hover:text-yellow-300 transition-colors"
                  title="Tutup"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Body modal */}
            <div className="overflow-auto flex-1 p-3">
              {detailLoading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Memuat detail…
                </div>
              ) : detailError ? (
                <div className="py-10 text-center text-sm text-red-500">
                  {detailError}
                </div>
              ) : detailRows.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Tidak ada data.
                </div>
              ) : (
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-blue-900 text-white">
                      <th className="border border-blue-700 px-2 py-1.5 text-center w-8">
                        No
                      </th>
                      <th className="border border-blue-700 px-2 py-1.5 text-left">
                        Kode Satker
                      </th>
                      <th className="border border-blue-700 px-2 py-1.5 text-left min-w-[200px]">
                        Satker
                      </th>
                      <th className="border border-blue-700 px-2 py-1.5 text-left">
                        Unit
                      </th>
                      <th className="border border-blue-700 px-2 py-1.5 text-center">
                        Seksi
                      </th>
                      <th className="border border-blue-700 px-2 py-1.5 text-right min-w-[110px]">
                        Pagu (Rp)
                      </th>
                      <th className="border border-blue-700 px-2 py-1.5 text-right min-w-[110px]">
                        Kontrak (Rp)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailRows.map((d, i) => (
                      <tr
                        key={d.id}
                        className="hover:bg-blue-50 dark:hover:bg-blue-950"
                      >
                        <td className="border border-gray-300 dark:border-gray-700 px-2 py-1 text-center">
                          {i + 1}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-700 px-2 py-1 font-mono">
                          {d.kdsatker}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-700 px-2 py-1">
                          {d.nmsatker}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-700 px-2 py-1">
                          {d.nmunit}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-700 px-2 py-1 text-center">
                          {d.seksi}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-700 px-2 py-1 text-right">
                          {fmt(d.pagu ?? 0)}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-700 px-2 py-1 text-right">
                          {fmt(d.kontrak ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
