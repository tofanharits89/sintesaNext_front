"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import axios from "axios";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const geoData = require("./indobaru.json");

type KanwilRow = {
  kdkanwil: string;
  nmkanwil: string;
  pad: number;
  tkd: number;
  belanja_daerah: number;
  capaian_persen: number;
  indeks: number;
};

type DetailRow = {
  kdpemda: string;
  nmpemda: string;
  akun1: string;
  nmakun1: string;
  akun2: string;
  nmakun2: string;
  pagu: number;
  real1: number;
  real2: number;
  real3: number;
  real4: number;
  real5: number;
  real6: number;
  real7: number;
  real8: number;
  real9: number;
  real10: number;
  real11: number;
  real12: number;
  realisasi: number;
  persen: number;
};

const INDEKS_COLORS: Record<number, string> = {
  5: "#1a7e4a",
  4.75: "#27ae60",
  4.5: "#58d68d",
  4.25: "#a9dfbf",
  4: "#f4d03f",
  3.75: "#f39c12",
  3.5: "#e67e22",
  3.25: "#e74c3c",
  3: "#c0392b",
  2.75: "#7b241c",
};

const INDEKS_LEGEND = [5, 4.75, 4.5, 4.25, 4, 3.75, 3.5, 3.25, 3, 2.75];

const LEGEND_TW1TO3 = [
  "<= 22,50%",
  "22,50% <= x < 24,00%",
  "24,00% <= x < 25,50%",
  "25,50% <= x < 27,00%",
  "27,00% <= x <= 33,00%",
  "33,00% < x < 36,00%",
  "36,00% <= x < 39,00%",
  "39,00% <= x < 42,00%",
  "42,00% <= x < 45,00%",
  ">= 45,00%",
];

const LEGEND_TW4 = [
  "<= 2,25%",
  "2,25% <= x < 2,40%",
  "2,40% <= x < 2,55%",
  "2,55% <= x < 2,70%",
  "2,70% <= x <= 3,30%",
  "3,30% < x < 3,60%",
  "3,60% <= x < 3,90%",
  "3,90% <= x < 4,20%",
  "4,20% <= x < 4,50%",
  ">= 4,50%",
];

// KODE_PROV di GeoJSON tidak sama persis dengan kdkanwil untuk 4 provinsi berikut.
// Sisanya (01-08, 10-23, 25-30, 33) sudah cocok langsung.
const KODE_PROV_TO_KDKANWIL: Record<string, string> = {
  "09": "31", // Kepulauan Riau → kdkanwil 31
  "65": "34", // Kalimantan Utara → kdkanwil 34
  "72": "24", // Sulawesi Tengah → kdkanwil 24
  "76": "32", // Sulawesi Barat → kdkanwil 32
};

function getKdkanwil(kodeProv: string): string {
  return KODE_PROV_TO_KDKANWIL[kodeProv] ?? kodeProv;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ags",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function getReal(row: DetailRow, i: number): number {
  return Number((row as unknown as Record<string, number>)[`real${i}`] ?? 0);
}

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);

export default function MapApbd() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerRef = useRef<any>(null);
  const fittedRef = useRef(false);

  const [triwulan, setTriwulan] = useState(1);
  const [data, setData] = useState<KanwilRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [selectedKanwil, setSelectedKanwil] = useState<{
    kdkanwil: string;
    name: string;
  } | null>({ kdkanwil: "13", name: "Jawa Tengah" });
  const [detailData, setDetailData] = useState<DetailRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const dataMap = useMemo(() => {
    const m = new Map<string, KanwilRow>();
    data.forEach((r) => m.set(r.kdkanwil, r));
    return m;
  }, [data]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let destroyed = false;

    import("leaflet").then(({ default: L }) => {
      if (destroyed || !containerRef.current) return;
      const map = L.map(containerRef.current, {
        attributionControl: false,
        scrollWheelZoom: true,
        zoomControl: true,
      }).setView([-2, 118], 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      mapRef.current = map;
    });

    return () => {
      destroyed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  const updateLayer = useCallback(() => {
    if (!mapRef.current) return;

    import("leaflet").then(({ default: L }) => {
      if (!mapRef.current) return;

      // Hapus layer lama
      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const layer = L.geoJSON(geoData as any, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        style: (feature: any) => {
          const kodeProv = (feature?.properties?.KODE_PROV as string) ?? "";
          const row = dataMap.get(getKdkanwil(kodeProv));
          return {
            fillColor: row
              ? (INDEKS_COLORS[row.indeks] ?? "#d5d8dc")
              : "#d5d8dc",
            color: "#ffffff",
            weight: 0.7,
            fillOpacity: 0.85,
          };
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onEachFeature: (feature: any, lyr: any) => {
          const name = (feature?.properties?.WADMKK as string) ?? "";
          const kodeProv = (feature?.properties?.KODE_PROV as string) ?? "";
          const row = dataMap.get(getKdkanwil(kodeProv));
          const html = row
            ? `<div style="line-height:1.5;font-size:12px">
                <strong>${name}</strong><br/>
                <span style="color:#888;font-size:11px">${row.nmkanwil}</span><br/>
                Capaian: <strong>${Number(row.capaian_persen).toFixed(2)}%</strong><br/>
                Indeks: <strong style="color:${INDEKS_COLORS[row.indeks]}">${row.indeks}</strong><br/>
                <hr style="margin:4px 0"/>
                <span style="font-size:10px;color:#555">
                  PAD: Rp ${fmt(row.pad)}<br/>
                  TKD: Rp ${fmt(row.tkd)}<br/>
                  Belanja: Rp ${fmt(row.belanja_daerah)}
                </span>
               </div>`
            : `<strong>${name}</strong><br/><em style="color:#aaa">Data tidak tersedia</em>`;
          lyr.bindTooltip(html, { sticky: true, opacity: 0.97 });
          lyr.on("mouseover", function (this: typeof lyr) {
            this.setStyle({ weight: 2 });
          });
          lyr.on("mouseout", function (this: typeof lyr) {
            layer.resetStyle(this);
          });
          lyr.on("click", () => {
            setSelectedKanwil({ kdkanwil: getKdkanwil(kodeProv), name });
          });
        },
      });

      layer.addTo(mapRef.current);
      layerRef.current = layer;
    });
  }, [data, dataMap]);

  useEffect(() => {
    // Delay sedikit agar mapRef.current sudah siap
    const t = setTimeout(updateLayer, 150);
    return () => clearTimeout(t);
  }, [updateLayer]);

  const fetchData = useCallback(async (tw: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<{ result: KanwilRow[] }>(
        "/api/v1/iku-pa/apbd/map",
        { params: { triwulan: tw }, withCredentials: true },
      );
      setData(res.data.result ?? []);
    } catch {
      setError("Gagal memuat data peta. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDetail = useCallback(async (kdkanwil: string, tw: number) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await axios.get<{ result: DetailRow[] }>(
        "/api/v1/iku-pa/apbd/detail",
        { params: { kdkanwil, triwulan: tw }, withCredentials: true },
      );
      setDetailData(res.data.result ?? []);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? `Error ${err.response?.status ?? ""}: ${err.response?.data?.error ?? err.message}`
        : "Gagal memuat data detail.";
      setDetailError(msg);
      setDetailData([]);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const downloadExcel = useCallback(() => {
    if (!detailData.length || !selectedKanwil) return;
    const maxMonth = triwulan * 3;
    const headers = [
      "Pemerintah Daerah",
      "Kategori",
      "Kode Akun",
      "Nama Akun",
      "Pagu",
      ...MONTH_LABELS.slice(0, maxMonth),
      `Total s.d. Tw ${["I", "II", "III", "IV"][triwulan - 1]}`,
      "%",
    ];
    const rows = detailData.map((row) => [
      row.nmpemda,
      row.nmakun1,
      row.akun2,
      row.nmakun2,
      row.pagu,
      ...Array.from({ length: maxMonth }, (_, j) => getReal(row, j + 1)),
      row.realisasi,
      row.persen.toFixed(1),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `detail-apbd-${selectedKanwil.name.replace(/\s+/g, "-")}-tw${triwulan}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [detailData, selectedKanwil, triwulan]);

  useEffect(() => {
    fetchData(triwulan);
  }, [triwulan, fetchData]);

  useEffect(() => {
    if (selectedKanwil) {
      fetchDetail(selectedKanwil.kdkanwil, triwulan);
    } else {
      setDetailData([]);
    }
  }, [selectedKanwil, triwulan, fetchDetail]);

  return (
    <div className="space-y-4">
      {/* â”€â”€ Selector Triwulan â”€â”€â”€ */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Triwulan:</span>
        {[1, 2, 3, 4].map((tw) => (
          <button
            key={tw}
            onClick={() => setTriwulan(tw)}
            className={`px-3 py-1 text-xs font-semibold rounded border transition-colors ${
              triwulan === tw
                ? "bg-blue-900 text-white border-blue-900"
                : "border-blue-900 text-blue-900 hover:bg-blue-100"
            }`}
          >
            Tw {["I", "II", "III", "IV"][tw - 1]}
          </button>
        ))}
        {loading && (
          <span className="text-xs text-muted-foreground animate-pulse ml-2">
            Memuatâ€¦
          </span>
        )}
      </div>

      {error && <div className="text-sm text-red-500">{error}</div>}

      {/* â”€â”€ Peta Leaflet â”€â”€â”€ */}
      <div
        ref={containerRef}
        className="w-full rounded-lg border border-yellow-400 overflow-hidden"
        style={{ height: 750, background: "#b8b89a" }}
      />

      {/* â”€â”€ Tabel Legenda â”€â”€â”€ */}
      {/* ─── Legenda Indeks (Accordion) ─── */}
      <div className="rounded-lg border overflow-hidden">
        <button
          type="button"
          onClick={() => setLegendOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 transition-colors"
        >
          <span>Legenda Indeks APBD</span>
          <span>{legendOpen ? "▲ Tutup" : "▼ Buka"}</span>
        </button>
        {legendOpen && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="border border-blue-700 px-3 py-2 text-center">
                    Capaian
                  </th>
                  <th className="border border-blue-700 px-3 py-2 text-center">
                    Rentang Nilai Tw I s.d. Tw III
                  </th>
                  <th className="border border-blue-700 px-3 py-2 text-center">
                    Rentang Nilai Tw IV
                  </th>
                </tr>
              </thead>
              <tbody>
                {INDEKS_LEGEND.map((idx, i) => (
                  <tr
                    key={idx}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="border border-gray-300 px-3 py-1.5 text-center">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="inline-block w-3 h-3 square-sm flex-shrink-0"
                          style={{ background: INDEKS_COLORS[idx] }}
                        />
                        <span className="font-medium">Indeks {idx}</span>
                      </span>
                    </td>
                    <td
                      className={`border border-gray-300 px-3 py-1.5 text-center ${
                        triwulan !== 4
                          ? "font-semibold text-blue-900"
                          : "text-gray-500"
                      }`}
                    >
                      {LEGEND_TW1TO3[i]}
                    </td>
                    <td
                      className={`border border-gray-300 px-3 py-1.5 text-center ${
                        triwulan === 4
                          ? "font-semibold text-blue-900"
                          : "text-gray-500"
                      }`}
                    >
                      {LEGEND_TW4[i]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Detail per Kanwil ─── */}
      {selectedKanwil && (
        <div className="rounded-lg border overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-blue-900 text-white text-xs font-semibold">
            <span>
              Detail: {selectedKanwil.name} &mdash; Tw{" "}
              {["I", "II", "III", "IV"][triwulan - 1]}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadExcel}
                disabled={!detailData.length}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
                title="Download Excel"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Excel
              </button>
              <button
                type="button"
                onClick={() => setSelectedKanwil(null)}
                className="text-white hover:text-yellow-300 font-bold"
              >
                ✕
              </button>
            </div>
          </div>
          {detailLoading ? (
            <div className="p-4 text-xs text-center text-gray-500 animate-pulse">
              Memuat data detail…
            </div>
          ) : detailError ? (
            <div className="p-4 text-xs text-red-500 font-mono bg-red-50">
              {detailError}
            </div>
          ) : detailData.length === 0 ? (
            <div className="p-4 text-xs text-center text-gray-500">
              Tidak ada data untuk kanwil ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div style={{ maxHeight: 500, overflowY: "auto" }}>
                <table
                  className="border-collapse text-xs"
                  style={{ minWidth: "max-content", width: "100%" }}
                >
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-blue-800 text-white">
                      <th className="border border-blue-700 px-2 py-1.5 text-left whitespace-nowrap sticky left-0 bg-blue-800 z-20">
                        Pemerintah Daerah
                      </th>
                      <th className="border border-blue-700 px-2 py-1.5 text-left whitespace-nowrap">
                        Kategori
                      </th>
                      <th className="border border-blue-700 px-2 py-1.5 text-left whitespace-nowrap">
                        Kode Akun
                      </th>
                      <th className="border border-blue-700 px-2 py-1.5 text-left whitespace-nowrap">
                        Nama Akun
                      </th>
                      <th className="border border-blue-700 px-2 py-1.5 text-right whitespace-nowrap">
                        Pagu (Rp)
                      </th>
                      {Array.from({ length: triwulan * 3 }, (_, i) => (
                        <th
                          key={i + 1}
                          className="border border-blue-700 px-2 py-1.5 text-right whitespace-nowrap"
                        >
                          {MONTH_LABELS[i]}
                        </th>
                      ))}
                      <th className="border border-blue-700 px-2 py-1.5 text-right whitespace-nowrap">
                        Total s.d. Tw {["I", "II", "III", "IV"][triwulan - 1]}
                      </th>
                      <th className="border border-blue-700 px-2 py-1.5 text-right whitespace-nowrap">
                        %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-900">
                    {detailData.map((row, i) => (
                      <tr
                        key={`${row.kdpemda}-${row.akun1}-${row.akun2}-${i}`}
                        className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td
                          className="border border-gray-200 px-2 py-1 text-[11px] text-gray-900 sticky left-0 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis"
                          style={{
                            background: i % 2 === 0 ? "#ffffff" : "#f9fafb",
                          }}
                        >
                          {row.nmpemda}
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-[11px] text-gray-900 whitespace-nowrap">
                          {row.nmakun1}
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-[11px] text-gray-900 whitespace-nowrap">
                          {row.akun2}
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-[11px] text-gray-900 whitespace-nowrap">
                          {row.nmakun2}
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-right whitespace-nowrap text-gray-900">
                          {fmt(row.pagu)}
                        </td>
                        {Array.from({ length: triwulan * 3 }, (_, j) => (
                          <td
                            key={j + 1}
                            className="border border-gray-200 px-2 py-1 text-right whitespace-nowrap text-gray-900"
                          >
                            {fmt(getReal(row, j + 1))}
                          </td>
                        ))}
                        <td className="border border-gray-200 px-2 py-1 text-right whitespace-nowrap font-medium text-gray-900">
                          {fmt(row.realisasi)}
                        </td>
                        <td
                          className={`border border-gray-200 px-2 py-1 text-right whitespace-nowrap font-semibold ${
                            row.persen >= 90
                              ? "text-green-700"
                              : row.persen < 50
                                ? "text-red-600"
                                : "text-yellow-700"
                          }`}
                        >
                          {row.persen.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
