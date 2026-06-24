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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import {
  FileSpreadsheet,
  MapPin,
  TrendingUp,
  Wallet,
  BarChart3,
  Building2,
  ChevronDown,
} from "lucide-react";
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

type NasionalRow = {
  pad: number;
  tkd: number;
  belanja_daerah: number;
  pagu_total: number;
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
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
];

function getReal(row: DetailRow, i: number): number {
  return Number((row as unknown as Record<string, number>)[`real${i}`] ?? 0);
}

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);

const fmtTrili = (n: number) => {
  if (Math.abs(n) >= 1_000_000_000_000)
    return `Rp ${(n / 1_000_000_000_000).toFixed(2)} T`;
  if (Math.abs(n) >= 1_000_000_000)
    return `Rp ${(n / 1_000_000_000).toFixed(2)} M`;
  return `Rp ${fmt(n)}`;
};

// ─── Komponen Card Statistik Nasional ───────────────────────────────────────
function NasionalStatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  colorClass: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-base font-bold tracking-tight">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ─── Komponen Badge Indeks ──────────────────────────────────────────────────
function IndeksBadge({ indeks }: { indeks: number }) {
  const color = INDEKS_COLORS[indeks] ?? "#888";
  return (
    <Badge
      variant="outline"
      className="text-sm font-bold px-3 py-1 gap-1.5"
      style={{ borderColor: color, color }}
    >
      <span
        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
        style={{ background: color }}
      />
      Indeks {indeks}
    </Badge>
  );
}

export default function MapApbd() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerRef = useRef<any>(null);

  // ── State accordion legenda (default tertutup) ──
  const [legendOpen, setLegendOpen] = useState(false);

  // ── State kanwil yg diklik di peta (null = tampilkan Nasional) ──
  const [mapSelectedKd, setMapSelectedKd] = useState<string | null>(null);

  // ── Filter PETA ──
  const [triwulan, setTriwulan] = useState(1);
  const [data, setData] = useState<KanwilRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // noDataMap: true jika backend kembalikan noData (data triwulan belum ada)
  const [noDataMap, setNoDataMap] = useState(false);

  // ── Data Nasional ──
  const [nasionalData, setNasionalData] = useState<NasionalRow | null>(null);
  const [nasionalLoading, setNasionalLoading] = useState(false);

  // ── Filter TABEL (independen dari peta) ──
  const [tableTriwulan, setTableTriwulan] = useState(1);
  // Hanya simpan kdkanwil (string) agar Select value tidak pernah undefined/null
  // Default: 'nasional' → tabel menampilkan agregat semua kanwil
  const [tableKdkanwil, setTableKdkanwil] = useState<string>("nasional");

  const [detailData, setDetailData] = useState<DetailRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  // noDataDetail: true jika backend kembalikan noData untuk tabel detail
  const [noDataDetail, setNoDataDetail] = useState(false);

  // Map untuk lookup warna per kanwil (dipakai peta)
  const dataMap = useMemo(() => {
    const m = new Map<string, KanwilRow>();
    data.forEach((r) => m.set(r.kdkanwil, r));
    return m;
  }, [data]);

  // Daftar opsi dropdown Provinsi (diambil dari data peta yang sudah ada)
  const kanwilOptions = useMemo(() => {
    return [...data]
      .filter((r) => r.kdkanwil?.trim() !== "" && r.nmkanwil?.trim() !== "")
      .sort((a, b) => a.nmkanwil.localeCompare(b.nmkanwil))
      .map((r) => ({ kdkanwil: r.kdkanwil.trim(), name: r.nmkanwil.trim() }));
  }, [data]);

  // Nama kanwil aktif — di-derive dari options agar tidak perlu menyimpan name di state
  const tableKanwilName = useMemo(() => {
    if (tableKdkanwil === "nasional") return "Nasional (Agregat)";
    return kanwilOptions.find((o) => o.kdkanwil === tableKdkanwil)?.name ?? tableKdkanwil;
  }, [kanwilOptions, tableKdkanwil]);

  // ── Inisialisasi Leaflet Map ──────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let destroyed = false;
    let ro: ResizeObserver | null = null;

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

      // ResizeObserver: panggil invalidateSize setiap kali container berubah ukuran
      // (terjadi saat layout flex selesai render atau sidebar toggle)
      ro = new ResizeObserver(() => { map.invalidateSize(); });
      ro.observe(containerRef.current!);
    });

    return () => {
      destroyed = true;
      ro?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // ── Update Layer Peta ─────────────────────────────────────────────────────
  const updateLayer = useCallback(() => {
    if (!mapRef.current) return;

    import("leaflet").then(({ default: L }) => {
      if (!mapRef.current) return;

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
          // Klik peta → sync ke filter tabel + update overlay stat
          lyr.on("click", () => {
            const kd = getKdkanwil(kodeProv);
            if (dataMap.has(kd)) {
              setTableKdkanwil(kd);
              setMapSelectedKd(kd);
            }
          });
        },
      });

      layer.addTo(mapRef.current);
      layerRef.current = layer;
    });
  }, [data, dataMap]);

  useEffect(() => {
    const t = setTimeout(updateLayer, 150);
    return () => clearTimeout(t);
  }, [updateLayer]);

  // ── Fetch Data Peta ───────────────────────────────────────────────────────
  const fetchData = useCallback(async (tw: number) => {
    setLoading(true);
    setError(null);
    setNoDataMap(false);
    try {
      const res = await axios.get<{ result: KanwilRow[]; noData?: boolean }>(
        "/api/v1/iku-pa/apbd/map",
        { params: { triwulan: tw }, withCredentials: true },
      );
      if (res.data.noData) {
        setNoDataMap(true);
        setData([]);
      } else {
        setData(res.data.result ?? []);
      }
    } catch {
      setError("Gagal memuat data peta. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch Data Nasional ───────────────────────────────────────────────────
  const fetchNasional = useCallback(async (tw: number) => {
    setNasionalLoading(true);
    try {
      const res = await axios.get<{ result: NasionalRow | null; noData?: boolean }>(
        "/api/v1/iku-pa/apbd/nasional",
        { params: { triwulan: tw }, withCredentials: true },
      );
      // Jika noData, tetap set null agar overlay stat menampilkan "Data tidak tersedia"
      setNasionalData(res.data.noData ? null : (res.data.result ?? null));
    } catch {
      setNasionalData(null);
    } finally {
      setNasionalLoading(false);
    }
  }, []);

  // ── Fetch Detail Tabel ────────────────────────────────────────────────────
  const fetchDetail = useCallback(async (kdkanwil: string, tw: number) => {
    setDetailLoading(true);
    setDetailError(null);
    setNoDataDetail(false);
    try {
      const res = await axios.get<{ result: DetailRow[]; noData?: boolean }>(
        "/api/v1/iku-pa/apbd/detail",
        { params: { kdkanwil, triwulan: tw }, withCredentials: true },
      );
      if (res.data.noData) {
        setNoDataDetail(true);
        setDetailData([]);
      } else {
        setDetailData(res.data.result ?? []);
      }
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

  // ── Download Excel ────────────────────────────────────────────────────────
  const downloadExcel = useCallback(() => {
    if (!detailData.length) return;
    const maxMonth = tableTriwulan * 3;
    const headers = [
      "Pemerintah Daerah",
      "Kategori",
      "Kode Akun",
      "Nama Akun",
      "Pagu",
      ...MONTH_LABELS.slice(0, maxMonth),
      `Total s.d. Tw ${["I", "II", "III", "IV"][tableTriwulan - 1]}`,
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
    a.download = `detail-apbd-${tableKanwilName.replace(/\s+/g, "-")}-tw${tableTriwulan}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [detailData, tableKanwilName, tableTriwulan]);

  // ── Definisi Kolom Tabel Detail ───────────────────────────────────────────
  const detailColumns = useMemo<ColumnDef<DetailRow>[]>(() => {
    const maxMonth = tableTriwulan * 3;
    const twLabel = ["I", "II", "III", "IV"][tableTriwulan - 1];
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
  }, [tableTriwulan]);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchData(triwulan);
    fetchNasional(triwulan);
  }, [triwulan, fetchData, fetchNasional]);

  useEffect(() => {
    if (tableKdkanwil) {
      fetchDetail(tableKdkanwil, tableTriwulan);
    } else {
      setDetailData([]);
    }
  }, [tableKdkanwil, tableTriwulan, fetchDetail]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ══ BAGIAN 1: Filter Triwulan + Peta ═════════════════════════════ */}
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
          {/* ── Peta full-width, overlay panel Legenda+Stat di kanan ── */}
          <div className="relative">

            {/* Map container — full width */}
            <Card className="relative w-full border shadow-sm overflow-hidden py-0 min-h-[420px]">
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
                className="relative isolate z-0 w-full h-[420px]"
                style={{ background: "#b8b89a" }}
              />
            </Card>

            {/* Panel overlay: Legenda accordion + Stat Card — absolut di atas peta sebelah kanan */}
            <div className="absolute top-2 right-2 z-20 w-[270px] flex flex-col rounded-xl border bg-card/95 backdrop-blur-sm shadow-lg overflow-hidden">

              {/* ── Tombol Accordion Legenda ── */}
              <button
                type="button"
                onClick={() => setLegendOpen((o) => !o)}
                className="flex items-center justify-between w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="text-xs font-semibold">Legenda Indeks APBD</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${legendOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* ── Isi Legenda (collapsible) ── */}
              {legendOpen && (
                <div className="px-3 pb-2 border-t">
                  <Table className="relative border-separate border-spacing-0 text-[10px] mt-1">
                    <TableHeader className="bg-card sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="bg-card font-medium text-[10px] text-center py-1 px-1">Capaian</TableHead>
                        <TableHead className="bg-card font-medium text-center text-[10px] py-1 px-1">Tw I–III</TableHead>
                        <TableHead className="bg-card font-medium text-center text-[10px] py-1 px-1">Tw IV</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {INDEKS_LEGEND.map((idx, i) => (
                        <TableRow key={idx}>
                          <TableCell className="py-0.5 px-1">
                            <Badge
                              variant="outline"
                              className="text-[9px] font-semibold px-1 py-0.5 whitespace-nowrap gap-1"
                              style={{ borderColor: INDEKS_COLORS[idx], color: INDEKS_COLORS[idx] }}
                            >
                              <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ background: INDEKS_COLORS[idx] }} />
                              {idx}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-center py-0.5 px-1 font-mono text-[9px] ${triwulan !== 4 ? "font-semibold text-blue-900" : "text-muted-foreground"}`}>
                            {LEGEND_TW1TO3[i]}
                          </TableCell>
                          <TableCell className={`text-center py-0.5 px-1 font-mono text-[9px] ${triwulan === 4 ? "font-semibold text-blue-900" : "text-muted-foreground"}`}>
                            {LEGEND_TW4[i]}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* ── Separator ── */}
              <div className="mx-3 border-t" />

              {/* ── Stat Card: Nasional by default, ganti ke kanwil saat user klik peta ── */}
              <div className="px-3 py-2.5 flex flex-col gap-2">
                {(() => {
                  const selRow = mapSelectedKd ? dataMap.get(mapSelectedKd) : null;
                  const isNas = !selRow;
                  const showLabel = selRow ? selRow.nmkanwil : "Agregat Nasional";
                  const showData = selRow
                    ? { pad: selRow.pad, tkd: selRow.tkd, belanja_daerah: selRow.belanja_daerah, capaian_persen: selRow.capaian_persen, indeks: selRow.indeks }
                    : nasionalData;
                  const isLoading = isNas ? nasionalLoading : false;

                  return (
                    <>
                      {/* Header */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600/10 shrink-0">
                            <Building2 className="h-3 w-3 text-blue-600" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold leading-tight truncate">{showLabel}</p>
                            <p className="text-[9px] text-muted-foreground">
                              Tw {["I", "II", "III", "IV"][triwulan - 1]}
                              {!isNas && (
                                <button
                                  onClick={() => setMapSelectedKd(null)}
                                  className="ml-1.5 underline opacity-60 hover:opacity-100"
                                >
                                  ← Nasional
                                </button>
                              )}
                            </p>
                          </div>
                        </div>
                        {isLoading ? (
                          <Skeleton className="h-5 w-16 rounded-full shrink-0" />
                        ) : showData ? (
                          <IndeksBadge indeks={showData.indeks} />
                        ) : null}
                      </div>

                      {/* Stat grid */}
                      {isLoading ? (
                        <div className="grid grid-cols-2 gap-1.5">
                          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
                        </div>
                      ) : showData ? (
                        <div className="grid grid-cols-2 gap-1.5">
                          <NasionalStatCard label="Total PAD"     value={fmtTrili(showData.pad)}             icon={Wallet}    colorClass="bg-emerald-500/10 text-emerald-600" />
                          <NasionalStatCard label="Total TKD"     value={fmtTrili(showData.tkd)}             icon={BarChart3} colorClass="bg-blue-500/10 text-blue-600" />
                          <NasionalStatCard label="Belanja"       value={fmtTrili(showData.belanja_daerah)}  icon={TrendingUp} colorClass="bg-orange-500/10 text-orange-600" />
                          <NasionalStatCard label="Capaian"       value={`${Number(showData.capaian_persen).toFixed(2)}%`} icon={MapPin} colorClass="bg-purple-500/10 text-purple-600" />
                        </div>
                      ) : (
                        <div className="text-[10px] text-muted-foreground italic text-center py-2">Data tidak tersedia.</div>
                      )}
                    </>
                  );
                })()}
              </div>

            </div>

          </div>
        </CardContent>
      </Card>

      {/* ══ BAGIAN 2: Filter + Tabel Detail per Kanwil ═════════════════════ */}
      <Card className="border-blue-900/10 shadow-lg overflow-hidden bg-card">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-4">
            {/* Judul */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Detail APBD per Kanwil</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Klik provinsi pada peta untuk memperbarui tampilan, atau gunakan filter di bawah.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadExcel}
                disabled={!detailData.length}
                className="h-8 bg-green-700 hover:bg-green-600 border-none text-white text-xs font-semibold transition-colors gap-2 px-3 self-start sm:self-auto"
                title="Download Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Unduh Data
              </Button>
            </div>

            {/* ── Filter Dropdown Independen ── */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              {/* Dropdown Provinsi */}
              <div className="flex flex-col gap-1 w-full sm:w-72">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" />
                  Provinsi / Kanwil
                </label>
                <Select
                  value={tableKdkanwil}
                  onValueChange={setTableKdkanwil}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Pilih Provinsi…" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Opsi agregat nasional selalu tersedia di atas */}
                    <SelectItem value="nasional">🇮🇩 Nasional (Agregat)</SelectItem>
                    {kanwilOptions.length === 0 ? (
                      <SelectItem value="__loading" disabled>
                        Memuat data…
                      </SelectItem>
                    ) : (
                      kanwilOptions.map((opt) => (
                        <SelectItem key={opt.kdkanwil} value={opt.kdkanwil}>
                          {opt.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Dropdown / Tabs Triwulan Tabel */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <BarChart3 className="h-3 w-3" />
                  Triwulan
                </label>
                <Tabs
                  value={String(tableTriwulan)}
                  onValueChange={(v) => setTableTriwulan(Number(v))}
                >
                  <TabsList className="h-9 rounded-lg p-0.5">
                    {[1, 2, 3, 4].map((tw) => (
                      <TabsTrigger
                        key={tw}
                        value={String(tw)}
                        className="text-xs px-3 h-8 rounded-md data-[state=active]:bg-card"
                      >
                        Tw {["I", "II", "III", "IV"][tw - 1]}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Label kanwil aktif */}
            {tableKdkanwil && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 text-blue-500" />
                Menampilkan:{" "}
                <span className="font-semibold text-foreground">
                  {tableKanwilName}
                </span>
                <span className="text-muted-foreground">—</span>
                <span>
                  Triwulan {["I", "II", "III", "IV"][tableTriwulan - 1]}
                </span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {detailLoading ? (
            <ApbdDetailTableSkeleton rows={8} />
          ) : detailError ? (
            <div className="p-12 text-sm text-red-500 font-mono bg-red-50 rounded-md">
              {detailError}
            </div>
          ) : noDataDetail ? (
            <div className="p-12 flex flex-col items-center gap-2 text-center">
              <span className="text-3xl">📭</span>
              <p className="text-sm font-semibold text-foreground">
                Data Triwulan {["I", "II", "III", "IV"][tableTriwulan - 1]} belum tersedia
              </p>
              <p className="text-xs text-muted-foreground">
                Realisasi APBD untuk periode ini belum diinput ke database.
              </p>
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
    </div>
  );
}
