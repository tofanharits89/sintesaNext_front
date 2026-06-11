"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import axios from "axios";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

import { FileSpreadsheet, X } from "lucide-react";
import { ApbdDetailTableSkeleton } from "@/components/iku-pa/apbd-skeleton";

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
        scrollWheelZoom: false,
        zoomControl: true,
      }).setView([-2, 118], 5);
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

  const detailColumns = useMemo<ColumnDef<DetailRow>[]>(() => {
    const maxMonth = triwulan * 3;
    const twLabel = ["I", "II", "III", "IV"][triwulan - 1];
    return [
      {
        id: "no",
        header: () => <div className="text-center font-medium">No</div>,
        cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
      },
      {
        accessorKey: "nmpemda",
        header: () => <div className="text-center font-medium">Pemerintah Daerah</div>,
        cell: ({ row }) => (
          <div className="font-medium whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis">
            {row.getValue("nmpemda")}
          </div>
        ),
      },
      {
        accessorKey: "nmakun1",
        header: () => <div className="text-center font-medium">Kategori</div>,
        cell: ({ row }) => <div>{row.getValue("nmakun1")}</div>,
      },
      {
        accessorKey: "akun2",
        header: () => <div className="text-center font-medium">Kode Akun</div>,
        cell: ({ row }) => (
          <div className="font-mono text-center">{row.getValue("akun2")}</div>
        ),
      },
      {
        accessorKey: "nmakun2",
        header: () => <div className="text-center font-medium">Nama Akun</div>,
        cell: ({ row }) => <div>{row.getValue("nmakun2")}</div>,
      },
      {
        accessorKey: "pagu",
        header: () => <div className="text-center font-medium">Pagu (Rp)</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono tabular-nums">{fmt(row.getValue("pagu"))}</div>
        ),
      },
      ...Array.from({ length: maxMonth }, (_, i) => ({
        id: `real${i + 1}`,
        header: () => (
          <div className="text-center font-medium">{MONTH_LABELS[i]}</div>
        ),
        cell: ({ row }: { row: { original: DetailRow } }) => (
          <div className="text-right font-mono tabular-nums">
            {fmt(getReal(row.original, i + 1))}
          </div>
        ),
      })) as ColumnDef<DetailRow>[],
      {
        accessorKey: "realisasi",
        header: () => (
          <div className="text-center font-medium whitespace-nowrap">
            Total s.d. Tw {twLabel}
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right font-mono tabular-nums font-semibold text-blue-600">
            {fmt(row.getValue("realisasi"))}
          </div>
        ),
      },
      {
        accessorKey: "persen",
        header: () => <div className="text-center font-medium">%</div>,
        cell: ({ row }) => {
          const persen = row.getValue<number>("persen");
          const colorClass =
            persen >= 90
              ? "border-green-500 text-green-600"
              : persen < 50
                ? "border-red-500 text-red-600"
                : "border-yellow-500 text-yellow-600";
          return (
            <div className="flex justify-end">
              <Badge variant="outline" className={`font-mono tabular-nums font-bold ${colorClass}`}>
                {persen.toFixed(1)}%
              </Badge>
            </div>
          );
        },
      },
    ];
  }, [triwulan]);

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
      {/* ── Filter Triwulan + Peta ─── */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base font-semibold">
              Peta Sebaran APBD per Kanwil
            </CardTitle>
            <Tabs
              value={String(triwulan)}
              onValueChange={(v) => setTriwulan(Number(v))}
              className="w-full sm:w-auto"
            >
              <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex rounded-xl p-1 h-auto">
                {[1, 2, 3, 4].map((tw) => (
                  <TabsTrigger
                    key={tw}
                    value={String(tw)}
                    className="text-xs px-3 py-1.5 rounded-lg data-[state=active]:bg-card"
                  >
                    Triwulan {["I", "II", "III", "IV"][tw - 1]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-3 text-sm text-red-500">{error}</div>
          )}
          {/* ─── Peta + Legenda side-by-side (70 : 30) ─── */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch">

            {/* ── Map container — stretches to match legend height ── */}
            <Card className="relative w-full lg:w-[70%] lg:shrink-0 border shadow-sm overflow-hidden py-0 min-h-[350px]">
              {loading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm">
                  <Skeleton className="h-full w-full absolute inset-0 rounded-none" />
                  <div className="relative z-20 flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-muted-foreground font-medium">Memuat data peta…</span>
                  </div>
                </div>
              )}
              <div
                ref={containerRef}
                className="relative isolate z-0 w-full h-[350px] lg:h-full"
                style={{ background: "#b8b89a" }}
              />
            </Card>

            {/* ── Legenda container — natural height drives the row ── */}
            <Card className="w-full lg:w-[30%] border shadow-sm overflow-hidden flex flex-col py-0 gap-0">
              <CardHeader className="shrink-0 px-4 pb-3 pt-4">
                <CardTitle className="text-base font-semibold">Legenda Indeks APBD</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <div className="rounded-md border">
                  <Table className="relative border-separate border-spacing-0 text-[11px]">
                    <TableHeader className="bg-background sticky top-0 z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="bg-background font-medium text-[11px] text-center">Capaian</TableHead>
                        <TableHead className="bg-background font-medium text-center text-[11px]">Tw I–III</TableHead>
                        <TableHead className="bg-background font-medium text-center text-[11px]">Tw IV</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {INDEKS_LEGEND.map((idx, i) => (
                        <TableRow key={idx}>
                          <TableCell className="py-1.5">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold px-1.5 py-0.5 whitespace-nowrap gap-1.5"
                              style={{
                                borderColor: INDEKS_COLORS[idx],
                                color: INDEKS_COLORS[idx],
                              }}
                            >
                              <span
                                className="inline-block w-2 h-2 rounded-full shrink-0"
                                style={{ background: INDEKS_COLORS[idx] }}
                              />
                              Indeks {idx}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={`text-center py-1.5 font-mono ${
                              triwulan !== 4
                                ? "font-semibold text-blue-900"
                                : "text-muted-foreground"
                            }`}
                          >
                            {LEGEND_TW1TO3[i]}
                          </TableCell>
                          <TableCell
                            className={`text-center py-1.5 font-mono ${
                              triwulan === 4
                                ? "font-semibold text-blue-900"
                                : "text-muted-foreground"
                            }`}
                          >
                            {LEGEND_TW4[i]}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

          </div>
        </CardContent>
      </Card>

      {/* ─── Detail per Kanwil ─── */}
      {selectedKanwil && (
        <Card className="border-blue-900/10 shadow-lg overflow-hidden mt-6 bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>
              Detail: {selectedKanwil.name} &mdash; Tw{" "}
              {["I", "II", "III", "IV"][triwulan - 1]}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadExcel}
                disabled={!detailData.length}
                className="h-8 bg-green-700 hover:bg-green-600 border-none text-white text-xs font-semibold transition-colors gap-2 px-3"
                title="Download Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Unduh Data Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {detailLoading ? (
              <ApbdDetailTableSkeleton rows={8} />
            ) : detailError ? (
              <div className="p-12 text-sm text-red-500 font-mono bg-red-50 rounded-md">
                {detailError}
              </div>
            ) : detailData.length === 0 ? (
              <div className="p-12 text-sm text-center text-gray-500 italic">
                Tidak ada data untuk kanwil ini.
              </div>
            ) : (
              <DataTable
                columns={detailColumns}
                data={detailData}
                initialPageSize={10}
                tableClassName="text-xs"
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
