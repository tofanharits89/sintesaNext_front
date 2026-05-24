"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, FileSpreadsheet, X, Download } from "lucide-react";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/animate-ui/components/radix/dialog";

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

// ─── Detail Columns ─────────────────────────────────────────────────────────

const detailColumns: ColumnDef<DetailRow>[] = [
  {
    id: "no",
    header: () => <div className="text-center font-medium">NO</div>,
    cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
  },
  {
    accessorKey: "kdsatker",
    header: () => (
      <div className="text-center font-medium whitespace-nowrap">KODE SATKER</div>
    ),
    cell: ({ row }) => (
      <div className="text-center font-mono">
        {row.original.kdsatker}
      </div>
    ),
  },
  {
    accessorKey: "nmsatker",
    header: () => <div className="text-center font-medium">SATUAN KERJA</div>,
    cell: ({ row }) => (
      <div className="text-center max-w-[300px] truncate mx-auto" title={row.original.nmsatker}>
        {row.original.nmsatker}
      </div>
    ),
  },
  {
    accessorKey: "nmunit",
    header: () => <div className="text-center font-medium">UNIT</div>,
    cell: ({ row }) => (
      <div className="text-center max-w-[200px] truncate mx-auto" title={row.original.nmunit}>
        {row.original.nmunit}
      </div>
    ),
  },
  {
    accessorKey: "seksi",
    header: () => <div className="text-center font-medium">SEKSI</div>,
    cell: ({ row }) => <div className="text-center">{row.original.seksi}</div>,
  },
  {
    accessorKey: "pagu",
    header: () => <div className="text-center font-medium whitespace-nowrap">PAGU (RP)</div>,
    cell: ({ row }) => {
      const val = row.original.pagu ?? 0;
      return (
        <div className="text-right font-mono tabular-nums pr-2">
          {Number(val).toLocaleString("id-ID", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </div>
      );
    },
  },
  {
    accessorKey: "kontrak",
    header: () => <div className="text-center font-medium whitespace-nowrap">KONTRAK (RP)</div>,
    cell: ({ row }) => {
      const val = row.original.kontrak ?? 0;
      return (
        <div className="text-right font-mono text-green-600 dark:text-green-400 tabular-nums pr-2">
          {Number(val).toLocaleString("id-ID", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </div>
      );
    },
  },
];

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

  const columns = useMemo<ColumnDef<SummaryRow>[]>(
    () => [
      {
        id: "no",
        header: () => <div className="text-center font-medium">No</div>,
        cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
      },
      {
        accessorKey: "kddept",
        header: () => <div className="text-center font-medium">BA</div>,
        cell: ({ row }) => (
          <div className="text-center font-mono">{row.getValue("kddept")}</div>
        ),
      },
      {
        accessorKey: "nmdept",
        header: () => <div className="text-center font-medium">Kementerian / Lembaga</div>,
        cell: ({ row }) => (
          <div className="text-center min-w-[200px]">{row.getValue("nmdept")}</div>
        ),
      },
      {
        accessorKey: "jenbel",
        header: () => <div className="text-center font-medium">Jenis Belanja</div>,
        cell: ({ row }) => (
          <div className="text-center min-w-[200px]">{row.getValue("jenbel")}</div>
        ),
      },
      {
        accessorKey: "periode",
        header: () => <div className="text-center font-medium">Periode</div>,
        cell: ({ row }) => (
          <div className="text-center">{row.getValue("periode")}</div>
        ),
      },
      {
        accessorKey: "pagu",
        header: () => <div className="text-center font-medium">Pagu (Rp)</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono tabular-nums">
            {fmt(row.getValue("pagu"))}
          </div>
        ),
      },
      {
        accessorKey: "kontrak",
        header: () => <div className="text-center font-medium">Kontrak (Rp)</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono tabular-nums">
            {fmt(row.getValue("kontrak"))}
          </div>
        ),
      },
      {
        accessorKey: "persentase",
        header: () => <div className="text-center font-medium">% Kontrak</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono tabular-nums">
            {Number(row.getValue("persentase")).toFixed(2)}%
          </div>
        ),
      },
      {
        accessorKey: "indeks",
        header: () => <div className="text-center font-medium">Indeks</div>,
        cell: ({ row }) => (
          <div
            className={`text-center ${indeksColor(row.getValue("indeks"))}`}
          >
            {row.getValue("indeks")}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center font-medium">Details</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 cursor-pointer"
              onClick={() => handleDetailsClick(row.original)}
              title="Lihat detail satker"
            >
              <Eye className="h-4 w-4 text-amber-600" />
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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
        <Card className="border-blue-900/10 shadow-lg overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Filter Data : Pilih Subdit dan Periode</CardTitle>
            {activeGroup && (
              <div className="text-xs font-medium text-muted-foreground bg-blue-50 dark:bg-blue-900/10 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-900/20">
                Menampilkan:{" "}
                <span className="text-blue-900 dark:text-blue-400 font-bold">
                  {activeGroup.label} — {activeTw}
                </span>{" "}
                · Rata-rata indeks:{" "}
                <span className="text-blue-900 dark:text-blue-400 font-bold">
                  {activeAvg ?? "—"}
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="rounded-xl border border-blue-900/10 shadow-sm overflow-hidden bg-white dark:bg-slate-950">
              <div className="flex w-full overflow-x-auto no-scrollbar scroll-smooth">
                {SUBDIT_DEFS.map((g, gi) => (
                  <div 
                    key={g.label} 
                    className="flex flex-col flex-1 min-w-max border-r border-blue-900/10 last:border-r-0"
                  >
                    <div className="bg-blue-900 text-white font-bold text-center py-2.5 px-4 text-[10px] uppercase tracking-widest border-b border-yellow-400/30">
                      {g.label}
                    </div>
                    <div className="flex flex-1">
                      {triwulans.map((tw, ti) => {
                        const isActive =
                          active?.subditIdx === gi && active?.twIdx === ti;
                        const avg = headerAvg[g.subdit]?.[ti];
                        const display =
                          avg !== null && avg !== undefined ? avg : "—";
                        return (
                          <div
                            key={`${gi}-${ti}`}
                            onClick={() => fetchData(gi, ti)}
                            className={`
                              group flex flex-col flex-1 items-center justify-center py-2 px-2
                              border-r border-blue-900/5 last:border-r-0 cursor-pointer 
                              transition-all duration-300 min-w-[50px] relative
                              ${isActive 
                                ? "bg-yellow-400 text-blue-900 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]" 
                                : "bg-white hover:bg-blue-50 dark:bg-slate-950 dark:hover:bg-blue-900/20"
                              }
                            `}
                            title={`Lihat ${g.label} – ${tw} (rata-rata indeks: ${display})`}
                          >
                            <span className={`
                              text-[9px] font-bold uppercase mb-0.5 tracking-tight
                              ${isActive ? "text-blue-900/70" : "text-muted-foreground/80"}
                            `}>
                              {tw}
                            </span>
                            <span className={`
                              text-sm font-black tabular-nums
                              ${isActive ? "text-blue-900" : "text-foreground"}
                            `}>
                              {display}
                            </span>
                            {isActive && (
                              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-900/20" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Tabel data ──────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Ringkasan IKU Kontraktual</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadExcel}
              disabled={rows.length === 0 || loading}
              className="bg-green-700 dark:bg-card hover:bg-green-600 flex items-center"
              title="Unduh Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-white mr-2" />
              <span className="text-sm text-white">Unduh Data Excel</span>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={10} />
            ) : error ? (
              <div className="py-10 text-center text-sm text-red-500">
                {error}
              </div>
            ) : rows.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Tidak ada data untuk filter ini.
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={rows}
                initialPageSize={10}
                tableClassName="text-xs"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Modal Detail ───────────────────────────────────────────────────────── */}
      <Dialog 
        open={modal.open} 
        onOpenChange={(open) => setModal((prev) => ({ ...prev, open }))}
      >
        <DialogContent 
          showCloseButton={false}
          className="max-w-7xl sm:max-w-7xl h-[85vh] flex flex-col p-0 overflow-hidden"
        >
          <DialogHeader className="px-6 py-4">
            <DialogTitle>Detail Satker: {modal.row?.nmdept ?? "Memuat..."}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {detailLoading ? (
              <TableSkeleton rows={10} />
            ) : detailError ? (
              <div className="py-12 text-center">
                <p className="text-red-500 font-medium">{detailError}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => modal.row && handleDetailsClick(modal.row)}
                >
                  Coba Lagi
                </Button>
              </div>
            ) : detailRows.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center text-muted-foreground border rounded-lg bg-muted/10">
                <FileSpreadsheet className="w-12 h-12 mb-4 opacity-10" />
                <p className="text-sm">Tidak ada data detail untuk satker ini.</p>
              </div>
            ) : (
              <DataTable 
                columns={detailColumns} 
                data={detailRows} 
                hidePagination 
                initialPageSize={detailRows.length || 100}
                tableClassName="text-xs"
              />
            )}
          </div>

          <DialogFooter className="px-6 py-4 flex flex-row items-center sm:justify-between gap-2 bg-muted/5">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadDetailExcel}
              disabled={detailRows.length === 0 || detailLoading}
              className="bg-green-700 text-white hover:bg-green-600 hover:text-white"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Unduh Data Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => setModal({ open: false, row: null })}>
              <X className="h-4 w-4 mr-2" /> Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
