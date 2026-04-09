"use client";

import React, { useState, useCallback, useEffect } from "react";
import axios from "axios";

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
  periode: string;
  kontrak: number;
  pagu: number;
  persentase: number;
  indeks: number;
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

  return (
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
                  const display = avg !== null && avg !== undefined ? avg : "—";
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
      <div className="overflow-x-auto rounded-lg border shadow-sm">
        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Memuat data…
          </div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-red-500">{error}</div>
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
                  Kode
                </th>
                <th className="border border-blue-700 px-3 py-2 text-left min-w-[200px]">
                  Kementerian / Lembaga
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
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={`${r.kddept}-${r.periode}`}
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
