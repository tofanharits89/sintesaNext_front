"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { ResetButton } from "@/components/ui/reset-button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import tkdData from "@/data/kdkppn_tkd.json";
import { apiPath } from "@/lib/config/base-path";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Loader2, Clock, DatabaseZap } from "lucide-react";
import { RekonDataDetailModal } from "./rekon-data-detail";
import { toast } from "sonner";
import { http } from "@/lib/api/httpClient";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RekonRow {
  thang: string;
  bulan: string;
  nmbulan: string;
  kdkppn: string;
  nmkppn: string;
  kdpemda: string;
  nmpemda: string;
  pagu?: number;
  alokasi_bulan?: number;
  tunda?: number;
  cabut?: number;
  potongan?: number;
  salur?: number;
  beda?: string | null;
}

interface RekonsiliasiDataTabProps {}

// ---------------------------------------------------------------------------
// Fetcher helper (GET only — no CSRF needed)
// ---------------------------------------------------------------------------

async function fetcher<T>(url: string): Promise<T> {
  const resp = await fetch(url, { credentials: "include" });
  if (!resp.ok) {
    const text = await resp.text();
    let msg = `HTTP ${resp.status}`;
    try { const j = JSON.parse(text); msg = j?.msg || j?.message || msg; } catch {}
    throw new Error(msg);
  }
  const json = await resp.json();
  return (json?.result ?? json?.data ?? json) as T;
}

// ---------------------------------------------------------------------------
// OMSPAN API (login + fetch data) — called client-side
// ---------------------------------------------------------------------------

const OMSPAN_API_BASE = "https://spanint.kemenkeu.go.id/apitkd/api";
const OMSPAN_CREDS = { username: "dpa_api", password: "AksesDpa23" };

async function loginOmspan(thang: string): Promise<string> {
  const resp = await fetch(`${OMSPAN_API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ ...OMSPAN_CREDS, thang }),
  });
  if (!resp.ok) throw new Error(`Login OMSPAN gagal (HTTP ${resp.status})`);
  const json = await resp.json();
  return json.token as string;
}

async function fetchOmspanPemotongan(token: string): Promise<any[]> {
  const resp = await fetch(`${OMSPAN_API_BASE}/dau/pemotongan`, {
    headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`Ambil pemotongan OMSPAN gagal (HTTP ${resp.status})`);
  const json = await resp.json();
  return json.data ?? [];
}

async function fetchOmspanPenundaan(token: string): Promise<any[]> {
  const resp = await fetch(`${OMSPAN_API_BASE}/dau/penundaan`, {
    headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`Ambil penundaan OMSPAN gagal (HTTP ${resp.status})`);
  const json = await resp.json();
  return json.data ?? [];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RekonsiliasiDataTab({}: RekonsiliasiDataTabProps) {
  const queryClient = useQueryClient();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) =>
    (currentYear - i).toString()
  );

  const currentMonth = new Date().getMonth() + 1;
  const defaultMonth = String(currentMonth).padStart(2, "0");

  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedKppn, setSelectedKppn] = useState("");
  const [selectedKabKota, setSelectedKabKota] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isSyncing, setIsSyncing] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<string>("");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<{
    kdkppn: string;
    kdpemda: string;
    thang: string;
    bulan: string;
  } | null>(null);

  const uniqueKppn = Array.from(
    new Map(
      (tkdData as Array<any>).map((d) => [
        d.kdkppn,
        { kdkppn: d.kdkppn, nmkppn: d.nmkppn },
      ])
    ).values()
  ).sort((a, b) => a.kdkppn.localeCompare(b.kdkppn));

  const filteredKabKotaOptions = selectedKppn
    ? (tkdData as Array<any>)
        .filter((row) => row.kdkppn === selectedKppn && !String(row.kdkabkota).endsWith("00"))
        .sort((a, b) => String(a.kdkabkota).localeCompare(String(b.kdkabkota)))
    : [];

  useEffect(() => { setSelectedKabKota(""); }, [selectedKppn]);

  const months = [
    { value: "01", label: "Januari" }, { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },   { value: "04", label: "April" },
    { value: "05", label: "Mei" },     { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },{ value: "10", label: "Oktober" },
    { value: "11", label: "November" },{ value: "12", label: "Desember" },
  ];

  const buildQueryKey = () => {
    const params = new URLSearchParams();
    params.set("thang", selectedYear);
    if (selectedMonth && selectedMonth !== "00") params.set("bulan", selectedMonth);
    if (selectedKppn) params.set("kdkppn", selectedKppn);
    if (selectedKabKota) params.set("kdpemda", selectedKabKota);
    if (selectedStatus && selectedStatus !== "all") params.set("bedadata", selectedStatus);
    return params.toString();
  };

  const rekapUrl = apiPath(`/transfer-daerah/omspan/rekap?${buildQueryKey()}`);
  const updateInfoUrl = apiPath(`/transfer-daerah/omspan/update-info`);

  const { data: rekonData, isLoading, error } = useQuery<RekonRow[]>({
    queryKey: ["rekon-omspan", selectedYear, selectedMonth, selectedKppn, selectedKabKota, selectedStatus],
    queryFn: () => fetcher<RekonRow[]>(rekapUrl),
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: updateData } = useQuery<{ tgupdate: string }>({
    queryKey: ["rekon-omspan-update-info"],
    queryFn: () => fetcher<{ tgupdate: string }>(updateInfoUrl),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (updateData?.tgupdate) setUpdateInfo(updateData.tgupdate);
  }, [updateData]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await http.delete(apiPath(`/transfer-daerah/omspan/truncate?thang=${selectedYear}`));
      const token = await loginOmspan(selectedYear);
      const [pemotongan, penundaan] = await Promise.all([
        fetchOmspanPemotongan(token),
        fetchOmspanPenundaan(token),
      ]);

      const saveBatch = async (path: string, items: any[]) => {
        const batchSize = 150;
        for (let i = 0; i < items.length; i += batchSize) {
          await http.post(apiPath(path), items.slice(i, i + batchSize));
        }
      };

      await saveBatch(`/transfer-daerah/omspan/pemotongan?thang=${selectedYear}`, pemotongan);
      await saveBatch(`/transfer-daerah/omspan/penundaan?thang=${selectedYear}`, penundaan);

      await queryClient.invalidateQueries({ queryKey: ["rekon-omspan"] });
      await queryClient.invalidateQueries({ queryKey: ["rekon-omspan-update-info"] });

      toast.success(`Sinkronisasi berhasil — Data OMSPAN ${selectedYear} telah diperbarui`);
    } catch (err: any) {
      toast.error(`Gagal sinkronisasi: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReset = () => {
    setSelectedYear(currentYear.toString());
    setSelectedMonth(defaultMonth);
    setSelectedKppn("");
    setSelectedKabKota("");
    setSelectedStatus("all");
  };

  const handleOpenDetail = (row: RekonRow) => {
    setSelectedDetail({
      kdkppn: row.kdkppn,
      kdpemda: row.kdpemda,
      thang: row.thang,
      bulan: row.bulan,
    });
    setModalOpen(true);
  };

  const rows = (rekonData ?? []).map((row, idx) => ({ ...row, no: idx + 1 }));

  const columns = [
    {
      accessorKey: "no",
      header: () => <div className="text-center font-semibold text-xs">No</div>,
      cell: ({ row }: any) => (
        <div className="text-center text-xs tabular-nums text-muted-foreground">{row.getValue("no")}</div>
      ),
    },
    {
      accessorKey: "thang",
      header: () => <div className="text-center font-semibold text-xs">TA</div>,
      cell: ({ row }: any) => (
        <div className="text-center text-xs font-medium">{row.getValue("thang")}</div>
      ),
    },
    {
      accessorKey: "nmbulan",
      header: () => <div className="text-center font-semibold text-xs">Bulan</div>,
      cell: ({ row }: any) => (
        <div className="text-center text-xs">{row.getValue("nmbulan")}</div>
      ),
    },
    {
      accessorKey: "nmkppn",
      header: () => <div className="text-center font-semibold text-xs">KPPN</div>,
      cell: ({ row }: any) => (
        <div className="text-xs max-w-[160px] truncate" title={row.getValue("nmkppn")}>
          <span className="font-medium">{row.original.kdkppn}</span>
          <span className="text-muted-foreground"> - {row.original.nmkppn}</span>
        </div>
      ),
    },
    {
      accessorKey: "nmpemda",
      header: () => <div className="text-center font-semibold text-xs">Kab/Kota</div>,
      cell: ({ row }: any) => (
        <div className="text-xs max-w-[180px] truncate" title={row.getValue("nmpemda")}>
          <span className="font-medium">{row.original.kdpemda}</span>
          <span className="text-muted-foreground"> - {row.original.nmpemda}</span>
        </div>
      ),
    },
    {
      accessorKey: "beda",
      header: () => <div className="text-center font-semibold text-xs">Status</div>,
      cell: ({ row }: any) => {
        const beda = row.getValue("beda");
        return (
          <div className="flex justify-center">
            <button
              onClick={() => handleOpenDetail(row.original as RekonRow)}
              className="cursor-pointer focus:outline-none"
              title="Lihat Detail Rekon"
            >
              {beda ? (
                <Badge variant="destructive" className="gap-1 text-xs px-2 py-0.5">
                  <span>⚠</span> Berbeda
                </Badge>
              ) : (
                <Badge className="gap-1 text-xs px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <span>✓</span> Sama
                </Badge>
              )}
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DatabaseZap className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Filter Rekonsilisasi DAU</CardTitle>
            </div>
            <ResetButton onReset={handleReset} />
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Tahun Anggaran */}
            <div className="space-y-1.5">
              <Label htmlFor="rekon-year" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Tahun Anggaran
              </Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="rekon-year" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y} className="text-xs">{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bulan */}
            <div className="space-y-1.5">
              <Label htmlFor="rekon-month" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Bulan
              </Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="rekon-month" className="h-8 text-xs">
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* KPPN */}
            <div className="space-y-1.5">
              <Label htmlFor="rekon-kppn" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                KPPN
              </Label>
              <Select value={selectedKppn} onValueChange={setSelectedKppn}>
                <SelectTrigger id="rekon-kppn" className="h-8 text-xs">
                  <SelectValue placeholder="Semua KPPN" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueKppn.map((k) => (
                    <SelectItem key={k.kdkppn} value={k.kdkppn} className="text-xs">
                      {k.kdkppn} - {k.nmkppn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Kab/Kota */}
            <div className="space-y-1.5">
              <Label htmlFor="rekon-kabkota" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Kab/Kota
              </Label>
              <Select value={selectedKabKota} onValueChange={setSelectedKabKota} disabled={!selectedKppn}>
                <SelectTrigger id="rekon-kabkota" className="h-8 text-xs">
                  <SelectValue placeholder={selectedKppn ? "Semua Kab/Kota" : "Pilih KPPN dulu"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredKabKotaOptions.map((loc) => (
                    <SelectItem key={loc.kdkabkota} value={loc.kdkabkota} className="text-xs">
                      {loc.kdkabkota} - {loc.nmkabkota}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="rekon-status" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Status
              </Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="rekon-status" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Semua Data</SelectItem>
                  <SelectItem value="00" className="text-xs">Data Sama</SelectItem>
                  <SelectItem value="01" className="text-xs">Data Berbeda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sync */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Sinkronisasi OMSPAN
              </Label>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 gap-1.5 text-xs border-amber-400/60 text-amber-700 hover:bg-amber-50 hover:border-amber-500 dark:text-amber-400 dark:hover:bg-amber-950/30"
                onClick={handleSync}
                disabled={isSyncing}
                title={updateInfo ? `Update terakhir: ${updateInfo}` : "Klik untuk ambil data OMSPAN"}
              >
                {isSyncing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                {isSyncing ? "Mengambil..." : "Sinkronisasi"}
              </Button>
              {updateInfo && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5 shrink-0" />
                  {updateInfo}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Data Rekonsilisasi DAU</CardTitle>
            {rekonData && (
              <span className="text-xs text-muted-foreground">
                {rekonData.length.toLocaleString("id-ID")} baris
              </span>
            )}
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Memuat data...</span>
            </div>
          )}
          {error ? (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-xs text-destructive">
              {String((error as Error).message || error)}
            </div>
          ) : (
            <DataTable columns={columns} data={rows} />
          )}
        </CardContent>
      </Card>

      {/* Detail Rekon Modal */}
      {selectedDetail && (
        <RekonDataDetailModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          kdkppn={selectedDetail.kdkppn}
          kdpemda={selectedDetail.kdpemda}
          thang={selectedDetail.thang}
          bulan={selectedDetail.bulan}
        />
      )}
    </div>
  );
}
