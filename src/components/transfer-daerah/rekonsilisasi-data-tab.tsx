"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import tkdData from "@/data/kdkppn_tkd.json";
import { apiPath } from "@/lib/config/base-path";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Loader2 } from "lucide-react";
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

interface RekonsiliasiDataTabProps {
  // No selectedYear prop — this tab manages its own year state (all tahun anggaran)
}

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
// OMSPAN API (login + fetch data) — called client-side (SPAN API)
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
  const [selectedStatus, setSelectedStatus] = useState("all"); // "all" | "00" | "01"
  const [isSyncing, setIsSyncing] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<string>("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<{
    kdkppn: string;
    kdpemda: string;
    thang: string;
    bulan: string;
  } | null>(null);

  // Build unique KPPN list from TKD mapping
  const uniqueKppn = Array.from(
    new Map(
      (tkdData as Array<any>).map((d) => [
        d.kdkppn,
        { kdkppn: d.kdkppn, nmkppn: d.nmkppn },
      ])
    ).values()
  ).sort((a, b) => a.kdkppn.localeCompare(b.kdkppn));

  // Kab/Kota filtered by selected KPPN
  const filteredKabKotaOptions = selectedKppn
    ? (tkdData as Array<any>)
        .filter((row) => row.kdkppn === selectedKppn && !String(row.kdkabkota).endsWith("00"))
        .sort((a, b) => String(a.kdkabkota).localeCompare(String(b.kdkabkota)))
    : [];

  useEffect(() => { setSelectedKabKota(""); }, [selectedKppn]);

  // Months list (value = "01" .. "12", label = "Januari" etc.)
  const months = [
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },
    { value: "04", label: "April" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  // Build query string
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

  const { data: rekonData, isLoading, error, refetch } = useQuery<RekonRow[]>({
    queryKey: ["rekon-omspan", selectedYear, selectedMonth, selectedKppn, selectedKabKota, selectedStatus],
    queryFn: () => fetcher<RekonRow[]>(rekapUrl),
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Load update info
  const { data: updateData } = useQuery<{ tgupdate: string }>({
    queryKey: ["rekon-omspan-update-info"],
    queryFn: () => fetcher<{ tgupdate: string }>(updateInfoUrl),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (updateData?.tgupdate) setUpdateInfo(updateData.tgupdate);
  }, [updateData]);

  // Sync from OMSPAN
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // 1. Truncate existing data (via http — auto-attach CSRF)
      await http.delete(apiPath(`/transfer-daerah/omspan/truncate?thang=${selectedYear}`));

      // 2. Login OMSPAN
      const token = await loginOmspan(selectedYear);

      // 3. Fetch pemotongan & penundaan in parallel
      const [pemotongan, penundaan] = await Promise.all([
        fetchOmspanPemotongan(token),
        fetchOmspanPenundaan(token),
      ]);

      // 4. Save in batches of 150 (via http — auto-attach CSRF)
      const saveBatch = async (path: string, items: any[]) => {
        const batchSize = 150;
        for (let i = 0; i < items.length; i += batchSize) {
          await http.post(apiPath(path), items.slice(i, i + batchSize));
        }
      };

      await saveBatch(`/transfer-daerah/omspan/pemotongan?thang=${selectedYear}`, pemotongan);
      await saveBatch(`/transfer-daerah/omspan/penundaan?thang=${selectedYear}`, penundaan);

      // 5. Refresh data table and update info
      await queryClient.invalidateQueries({ queryKey: ["rekon-omspan"] });
      await queryClient.invalidateQueries({ queryKey: ["rekon-omspan-update-info"] });

      toast.success(`Sinkronisasi berhasil — Data OMSPAN ${selectedYear} berhasil diperbarui`);
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
      header: ({ column }: any) => <div className="text-center font-medium">No</div>,
      cell: ({ row }: any) => <div className="text-center">{row.getValue("no")}</div>,
    },
    {
      accessorKey: "thang",
      header: ({ column }: any) => <div className="text-center font-medium">TA</div>,
      cell: ({ row }: any) => <div className="text-center">{row.getValue("thang")}</div>,
    },
    {
      accessorKey: "nmbulan",
      header: ({ column }: any) => <div className="text-center font-medium">Bulan</div>,
      cell: ({ row }: any) => <div className="text-center">{row.getValue("nmbulan")}</div>,
    },
    {
      accessorKey: "nmkppn",
      header: ({ column }: any) => <div className="text-center font-medium">KPPN</div>,
      cell: ({ row }: any) => (
        <div className="text-center max-w-[160px] truncate mx-auto" title={row.getValue("nmkppn")}>
          {row.original.nmkppn} - {row.original.kdkppn}
        </div>
      ),
    },
    {
      accessorKey: "nmpemda",
      header: ({ column }: any) => <div className="text-center font-medium">Kab/Kota</div>,
      cell: ({ row }: any) => (
        <div className="text-center max-w-[160px] truncate mx-auto" title={row.getValue("nmpemda")}>
          {row.original.nmpemda} - {row.original.kdpemda}
        </div>
      ),
    },
    {
      accessorKey: "beda",
      header: ({ column }: any) => <div className="text-center font-medium">Status</div>,
      cell: ({ row }: any) => {
        const beda = row.getValue("beda");
        return (
          <div className="flex justify-center">
            <button
              onClick={() => handleOpenDetail(row.original as RekonRow)}
              className="cursor-pointer"
              title="Lihat Detail Rekon"
            >
              {beda ? (
                <Badge variant="destructive" className="gap-1">
                  <span>⚠</span> Berbeda
                </Badge>
              ) : (
                <Badge variant="default" className="gap-1 bg-emerald-600 hover:bg-emerald-700">
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
    <div className="space-y-6">
      {/* Filter Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filter Data Rekonsilisasi</CardTitle>
            <ResetButton onReset={handleReset} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Tahun */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tahun Anggaran</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bulan */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Bulan</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* KPPN */}
            <div className="space-y-2">
              <label className="text-sm font-medium">KPPN</label>
              <Select value={selectedKppn} onValueChange={setSelectedKppn}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih KPPN" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueKppn.map((k) => (
                    <SelectItem key={k.kdkppn} value={k.kdkppn} title={`${k.kdkppn} - ${k.nmkppn}`}>
                      <span className="truncate">{k.kdkppn} - {k.nmkppn}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Kab/Kota */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Kab/Kota</label>
              <Select value={selectedKabKota} onValueChange={setSelectedKabKota} disabled={!selectedKppn}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={selectedKppn ? "Pilih Kab/Kota" : "Pilih KPPN dulu"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredKabKotaOptions.map((loc) => (
                    <SelectItem key={loc.kdkabkota} value={loc.kdkabkota} title={`${loc.kdkabkota} - ${loc.nmkabkota}`}>
                      <span className="truncate">{loc.kdkabkota} - {loc.nmkabkota}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua Data" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">Semua Data</SelectItem>
                  <SelectItem value="00">Data Sama</SelectItem>
                  <SelectItem value="01">Data Berbeda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sync button */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ambil Data OMSPAN</label>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleSync}
                disabled={isSyncing}
                title={updateInfo ? `Update terakhir: ${updateInfo}` : "Klik untuk ambil data OMSPAN"}
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <RefreshCw className="h-4 w-4 text-red-500" />
                )}
                {isSyncing ? "Mengambil..." : "Sinkronisasi"}
              </Button>
              {updateInfo && (
                <p className="text-xs text-muted-foreground italic">(update {updateInfo})</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Data Rekonsilisasi DAU</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat data...
            </div>
          )}
          {error ? (
            <div className="text-sm text-red-600">{String((error as Error).message || error)}</div>
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
