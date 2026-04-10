"use client";

import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ResetButton } from "@/components/ui/reset-button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Eye, Building2, Pencil } from "lucide-react";
import { RingkasanLaporanModal } from "./modals/ringkasan-laporan-modal";
import { KendalaHambatanModal } from "./modals/kendala-hambatan-modal";
import { LihatKendalaModal } from "./modals/lihat-kendala-modal";
import { TransaksiKkpModal } from "./modals/transaksi-kkp-modal";
import { TagihanKkpModal } from "./modals/tagihan-kkp-modal";
import { KartuKkpModal } from "./modals/kartu-kkp-modal";
import { SatkerDetailModal } from "./modals/satker-detail-modal";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { apiPath } from "@/lib/config/base-path";

// Type for the Ringkasan Kanwil data
export interface RingkasanKanwilData {
  id: string | number;
  kodeKppn: string;
  namaKppn: string;
  kodeBA: string;
  kodeSatker: string;
  namaSatker: string;
  upKkpPerBulan: number;
  porsiUpKkp: number;
  bankPenerbit: string;
  jumlahKartu: number;
  nilaiTagihan: number;
  nilaiTransaksi: number;
  kendala: string;
  detil_kendala?: string;
  detil_masukan_kendala?: string;
  nomor_pks?: string;
  tanggal_pks?: string;
  nomor_surat_up?: string;
  tanggal_surat_up?: string;
  tanggal_ctk_tagihan?: string;
  tanggal_jth_tempo?: string;
  nomor_sp2d_list?: string;
  tanggal_sp2d_list?: string;
  jenis_belanja_list?: string;
}

// Type for Monitoring KPPN data
export interface MonitoringKppnData {
  id: string | number;
  kdkppn: string;
  nmkppn: string;
  jumlah_satker_up_kkp: number;
  jumlah_satker_transaksi: number;
  nilai_transaksi: number;
  status?: string;
  tanggalKirim?: string | null;
}

// Ref interface for parent component access
export interface KanwilContentRef {
  getData: () => RingkasanKanwilData[];
  getSelectedPeriode: () => { year: string; periode: string };
}

interface KanwilContentProps {
  contentType?: "ringkasan" | "monitoring";
  statusLaporan?: "sent" | "not_sent";
  kppnCompletionStatus?: "complete" | "incomplete";
  onPeriodeChange?: (year: string, periode: string) => void;
}

export const KanwilContent = forwardRef<KanwilContentRef, KanwilContentProps>(
  function KanwilContent(
    {
      contentType = "monitoring",
      statusLaporan = "not_sent",
      kppnCompletionStatus = "incomplete",
      onPeriodeChange,
    },
    ref,
  ) {
    // Get authenticated user info
    const { user, isLoading: isAuthLoading } = useAuth();

    const now = new Date();
    const defaultYear = "2026";
    const defaultPeriode = `Q${Math.ceil((now.getMonth() + 1) / 3)}`;

    const [ringkasanData, setRingkasanData] = useState<RingkasanKanwilData[]>(
      [],
    );
    const [monitoringData, setMonitoringData] = useState<MonitoringKppnData[]>(
      [],
    );
    const [isLoading, setIsLoading] = useState(false);
    const [selectedYear, setSelectedYear] = useState(defaultYear);
    const [selectedKppn, setSelectedKppn] = useState("all");
    const [selectedPeriode, setSelectedPeriode] = useState(defaultPeriode);
    const [kppnRefList, setKppnRefList] = useState<
      { value: string; label: string }[]
    >([]);
    const [isLoadingKppnRef, setIsLoadingKppnRef] = useState(false);

    // Expose getData and getSelectedPeriode methods to parent component via ref
    useImperativeHandle(ref, () => ({
      getData: () => ringkasanData,
      getSelectedPeriode: () => ({
        year: selectedYear,
        periode: selectedPeriode,
      }),
    }));

    const fetchRingkasanData = async () => {
      setIsLoading(true);
      try {
        const triwulan = selectedPeriode.replace("Q", "");
        // Only add kdkppn parameter if explicitly selected from dropdown (not 'all')
        // For Kanwil users, backend will automatically filter by kdkanwil
        const kppnParam =
          selectedKppn !== "all" ? `&kdkppn=${selectedKppn}` : "";
        const apiUrl = apiPath(
          `/monev-kkp/kppn?tahun=${selectedYear}&triwulan=${triwulan}${kppnParam}`,
        );

        console.log("[Kanwil Ringkasan] Fetching data:", {
          url: apiUrl,
          tahun: selectedYear,
          triwulan,
          selectedKppn,
          userRole: user?.role,
          userKdkanwil: user?.kdkanwil,
        });

        const response = await fetch(apiUrl, { credentials: "include" });

        if (!response.ok) throw new Error("Gagal mengambil data ringkasan");
        const result = await response.json();

        console.log("[Kanwil Ringkasan] Response:", {
          dataCount: result.data?.length || 0,
          firstItem: result.data?.[0],
        });

        const mappedData = result.data.map((item: any, index: number) => ({
          id: `${item.kdsatker}-${index}`,
          kodeKppn: item.kdkppn,
          namaKppn: item.nmkppn || item.kdkppn || "-",
          kodeBA: item.kddept,
          kodeSatker: item.kdsatker,
          namaSatker: item.nmsatker,
          upKkpPerBulan: Number(item.nilai_up_kkp || 0),
          porsiUpKkp: Number(item.porsi_up_kkp_dari_total_up || 0),
          bankPenerbit: item.bank_penerbit,
          jumlahKartu: Number(item.jumlah_kartu || 0),
          nilaiTagihan: Number(item.nilai_tagihan || 0),
          nilaiTransaksi: Number(item.nilai_trans_sp2d || 0),
          kendala: item.kendala || "",
          detil_kendala: item.detil_kendala || "",
          detil_masukan_kendala: item.detil_masukan_kendala || "",
          nomor_pks: item.nomor_pks || "",
          tanggal_pks: item.tanggal_pks || "",
          nomor_surat_up: item.nomor_surat_up || "",
          tanggal_surat_up: item.tanggal_surat_up || "",
          tanggal_ctk_tagihan: item.tanggal_ctk_tagihan || "",
          tanggal_jth_tempo: item.tanggal_jth_tempo || "",
          nomor_sp2d_list: item.nomor_sp2d_list || "",
          tanggal_sp2d_list: item.tanggal_sp2d_list || "",
          jenis_belanja_list: item.jenis_belanja_list || "",
        }));
        setRingkasanData(mappedData);
      } catch (error) {
        console.error(error);
        toast.error("Gagal mengambil data ringkasan");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchMonitoringData = async () => {
      setIsLoading(true);
      try {
        const triwulan = selectedPeriode.replace("Q", "");
        const kppnParam =
          selectedKppn !== "all" ? `&kdkppn=${selectedKppn}` : "";
        const response = await fetch(
          apiPath(
            `/monev-kkp/kanwil/monitoring-kppn?tahun=${selectedYear}&triwulan=${triwulan}${kppnParam}`,
          ),
          { credentials: "include" },
        );

        if (!response.ok) throw new Error("Gagal mengambil data monitoring");
        const result = await response.json();

        const mappedData = result.data.map((item: any) => ({
          id: item.kdkppn,
          kdkppn: item.kdkppn,
          nmkppn: item.nmkppn,
          jumlah_satker_up_kkp: Number(item.jumlah_satker_up_kkp || 0),
          jumlah_satker_transaksi: Number(item.jumlah_satker_transaksi || 0),
          nilai_transaksi: Number(item.nilai_transaksi || 0),
          status:
            String(item.sts_kirim_kppn || "").trim() === "1"
              ? "sent"
              : "not_sent",
          tanggalKirim: item.tgkirim_kppn || null,
        }));
        setMonitoringData(mappedData);
      } catch (error) {
        console.error(error);
        toast.error("Gagal mengambil data monitoring");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchKppnRefList = async () => {
      setIsLoadingKppnRef(true);
      try {
        const response = await fetch(apiPath(`/monev-kkp/kanwil/ref-kppn`), {
          credentials: "include",
        });

        if (!response.ok)
          throw new Error("Gagal mengambil data referensi KPPN");
        const result = await response.json();

        const mappedList = result.data.map((item: any) => ({
          value: item.kdkppn,
          label: `${item.kdkppn} - ${item.nmkppn}`,
        }));
        setKppnRefList(mappedList);
      } catch (error) {
        console.error(error);
        toast.error("Gagal mengambil data referensi KPPN");
      } finally {
        setIsLoadingKppnRef(false);
      }
    };

    useEffect(() => {
      if (!user) return;
      if (contentType === "ringkasan") {
        fetchRingkasanData();
      } else {
        fetchMonitoringData();
      }
    }, [user, contentType, selectedYear, selectedPeriode, selectedKppn]);

    // Notify parent when year or periode changes
    useEffect(() => {
      if (onPeriodeChange) {
        onPeriodeChange(selectedYear, selectedPeriode);
      }
    }, [selectedYear, selectedPeriode]);

    // Fetch KPPN reference list on mount (for dropdown)
    useEffect(() => {
      if (!user) return;
      fetchKppnRefList();
    }, [user]);

    // Reset KPPN filter when user changes to prevent stale data from previous sessions
    useEffect(() => {
      if (user?.id) {
        setSelectedKppn("all");
        console.log("[Kanwil] User session detected, resetting KPPN filter", {
          userId: user.id,
          role: user.role,
        });
      }
    }, [user?.id]);

    const [isRingkasanModalOpen, setIsRingkasanModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [isTransaksiModalOpen, setIsTransaksiModalOpen] = useState(false);
    const [transaksiTarget, setTransaksiTarget] = useState<{
      kdsatker: string;
      namaSatker: string;
    } | null>(null);
    const [isTagihanModalOpen, setIsTagihanModalOpen] = useState(false);
    const [tagihanTarget, setTagihanTarget] = useState<{
      kdsatker: string;
      namaSatker?: string;
    } | null>(null);
    const [isKartuModalOpen, setIsKartuModalOpen] = useState(false);
    const [kartuTarget, setKartuTarget] = useState<{
      kdsatker: string;
      namaSatker?: string;
    } | null>(null);
    const [isSatkerDetailModalOpen, setIsSatkerDetailModalOpen] =
      useState(false);
    const [satkerDetailTarget, setSatkerDetailTarget] = useState<{
      kdsatker: string;
      namaSatker?: string;
    } | null>(null);
    // Build KPPN dropdown list from reference data (all KPPNs under this Kanwil)
    const kppnList = [{ value: "all", label: "Semua KPPN" }, ...kppnRefList];

    const years = ["2026", "2025", "2024", "2023"];

    const periodes = [
      { value: "Q1", label: "Triwulan 1 (Jan - Mar)" },
      { value: "Q2", label: "Triwulan 2 (Jan - Jun)" },
      { value: "Q3", label: "Triwulan 3 (Jan - Sep)" },
      { value: "Q4", label: "Triwulan 4 (Jan - Des)" },
    ];

    const handleReset = () => {
      setSelectedYear(defaultYear);
      setSelectedKppn("all");
      setSelectedPeriode(defaultPeriode);
    };

    const handleViewRingkasan = async (item: any) => {
      // If item already has satkerData (from ringkasan tab), use it directly
      if (item.satkerData) {
        setSelectedItem(item);
        setIsRingkasanModalOpen(true);
        return;
      }

      // For monitoring tab, open modal instantly with basic info
      const initialItem = {
        kodeKppn: item.kdkppn,
        namaKppn: item.nmkppn,
        satkerData: [],
      };
      setSelectedItem(initialItem);
      setIsRingkasanModalOpen(true);
      setIsModalLoading(true);

      try {
        const triwulan = selectedPeriode.replace("Q", "");
        const kdkppn = item.kdkppn;
        const apiUrl = apiPath(
          `/monev-kkp/kppn?tahun=${selectedYear}&triwulan=${triwulan}&kdkppn=${kdkppn}`,
        );

        const response = await fetch(apiUrl, { credentials: "include" });
        if (!response.ok) throw new Error("Gagal mengambil data satker");
        const result = await response.json();

        // Transform API response to match modal's expected format
        const satkerData = result.data.map((satker: any, index: number) => ({
          id: `${satker.kdsatker}-${index}`,
          kodeBA: satker.kddept,
          kodeSatker: satker.kdsatker,
          namaSatker: satker.nmsatker,
          upKkpPerBulan: Number(satker.nilai_up_kkp || 0),
          porsiUpKkp: Number(satker.porsi_up_kkp_dari_total_up || 0),
          bankPenerbit: satker.bank_penerbit,
          jumlahKartu: Number(satker.jumlah_kartu || 0),
          nilaiTagihan: Number(satker.nilai_tagihan || 0),
          nilaiTransaksi: Number(satker.nilai_trans_sp2d || 0),
          kendala: satker.kendala || "",
        }));

        // Combine monitoring item with fetched satker data
        const combinedItem = {
          kodeKppn: item.kdkppn,
          namaKppn: item.nmkppn,
          satkerData: satkerData,
        };

        setSelectedItem(combinedItem);
      } catch (error) {
        console.error("Error fetching satker data:", error);
        toast.error("Gagal mengambil data detail satker");
      } finally {
        setIsModalLoading(false);
      }
    };

    const handleEditKendala = (item: any) => {
      setSelectedItem(item);
      setIsEditModalOpen(true);
    };

    const handleViewKendala = (item: any) => {
      setSelectedItem(item);
      setIsViewModalOpen(true);
    };

    const formatRupiah = (value: number) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    };

    const formatPercent = (value: number) => {
      return `${value.toFixed(1)}%`;
    };

    const formatDate = (dateString: string | null) => {
      if (!dateString) return "-";
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    // Columns for Ringkasan Laporan Kanwil
    const ringkasanColumns = [
      {
        id: "no",
        header: () => <div className="text-center font-medium">No</div>,
        cell: ({ row }: any) => (
          <div className="text-center">{row.index + 1}</div>
        ),
      },
      {
        accessorKey: "kodeKppn",
        header: () => <div className="text-center font-medium">Kode KPPN</div>,
        cell: ({ row }: any) => (
          <div className="text-center">{row.getValue("kodeKppn")}</div>
        ),
      },
      {
        accessorKey: "namaKppn",
        header: () => <div className="text-center font-medium">Nama KPPN</div>,
        cell: ({ row }: any) => (
          <div
            className="text-left max-w-[150px] truncate"
            title={row.getValue("namaKppn")}
          >
            {row.getValue("namaKppn")}
          </div>
        ),
      },
      {
        accessorKey: "kodeBA",
        header: () => <div className="text-center font-medium">Kode BA</div>,
        cell: ({ row }: any) => (
          <div className="text-center">{row.getValue("kodeBA")}</div>
        ),
      },
      {
        accessorKey: "kodeSatker",
        header: () => (
          <div className="text-center font-medium">Kode Satker</div>
        ),
        cell: ({ row }: any) => (
          <div
            className="text-center cursor-pointer text-blue-600 hover:underline font-medium"
            onClick={() => {
              setSatkerDetailTarget({
                kdsatker: row.original.kodeSatker,
                namaSatker: row.original.namaSatker,
              });
              setIsSatkerDetailModalOpen(true);
            }}
            title="Lihat detail satker"
          >
            {row.getValue("kodeSatker")}
          </div>
        ),
      },
      {
        accessorKey: "namaSatker",
        header: () => (
          <div className="text-center font-medium">Nama Satker</div>
        ),
        cell: ({ row }: any) => (
          <div
            className="text-left max-w-[200px] truncate"
            title={row.getValue("namaSatker")}
          >
            {row.getValue("namaSatker")}
          </div>
        ),
      },
      {
        accessorKey: "upKkpPerBulan",
        header: () => (
          <div className="text-center font-medium">UP KKP Per Bulan (Rp)</div>
        ),
        cell: ({ row }: any) => (
          <div className="text-right font-mono tabular-nums pr-2">
            {formatRupiah(row.getValue("upKkpPerBulan"))}
          </div>
        ),
      },
      {
        accessorKey: "porsiUpKkp",
        header: () => (
          <div className="text-center font-medium">
            Porsi UP KKP dari Total UP
          </div>
        ),
        cell: ({ row }: any) => (
          <div className="text-center">
            {formatPercent(row.getValue("porsiUpKkp"))}
          </div>
        ),
      },
      {
        accessorKey: "bankPenerbit",
        header: () => (
          <div className="text-center font-medium">Bank Penerbit KKP</div>
        ),
        cell: ({ row }: any) => (
          <div className="text-center">{row.getValue("bankPenerbit")}</div>
        ),
      },
      {
        accessorKey: "jumlahKartu",
        header: () => (
          <div className="text-center font-medium">Jumlah Kartu</div>
        ),
        cell: ({ row }: any) => (
          <div
            className="text-center cursor-pointer text-blue-600 hover:underline"
            onClick={() => {
              setKartuTarget({
                kdsatker: row.original.kodeSatker,
                namaSatker: row.original.namaSatker,
              });
              setIsKartuModalOpen(true);
            }}
            title="Lihat detail kartu"
          >
            {row.getValue("jumlahKartu")}
          </div>
        ),
      },
      {
        accessorKey: "nilaiTagihan",
        header: () => (
          <div className="text-center font-medium">Nilai Tagihan (Rp)</div>
        ),
        cell: ({ row }: any) => (
          <div
            className="text-right font-mono tabular-nums pr-2 cursor-pointer text-blue-600 hover:underline"
            onClick={() => {
              setTagihanTarget({
                kdsatker: row.original.kodeSatker,
                namaSatker: row.original.namaSatker,
              });
              setIsTagihanModalOpen(true);
            }}
            title="Lihat detail tagihan"
          >
            {formatRupiah(row.getValue("nilaiTagihan"))}
          </div>
        ),
      },
      {
        accessorKey: "nilaiTransaksi",
        header: () => (
          <div className="text-center font-medium">
            Nilai Transaksi KKP (Rp)
          </div>
        ),
        cell: ({ row }: any) => (
          <div
            className="text-right font-mono tabular-nums pr-2 cursor-pointer text-blue-600 hover:underline"
            onClick={() => {
              setTransaksiTarget({
                kdsatker: row.original.kodeSatker,
                namaSatker: row.original.namaSatker,
              });
              setIsTransaksiModalOpen(true);
            }}
            title="Lihat detail transaksi"
          >
            {formatRupiah(row.getValue("nilaiTransaksi"))}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => (
          <div className="text-center font-medium">Kendala dan Hambatan</div>
        ),
        cell: ({ row }: any) => (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 cursor-pointer"
              onClick={() => handleEditKendala(row.original)}
              title={
                statusLaporan === "sent"
                  ? "Laporan sudah dikirim, tidak dapat mengedit"
                  : "Edit Kendala/Hambatan"
              }
              disabled={statusLaporan === "sent"}
            >
              <Pencil className="h-4 w-4 text-blue-600" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 cursor-pointer"
              onClick={() => handleViewKendala(row.original)}
              title="Lihat Kendala/Hambatan"
            >
              <Eye className="h-4 w-4 text-amber-600" />
            </Button>
          </div>
        ),
      },
    ];

    // Columns for Monitoring KPPN
    const monitoringColumns = [
      {
        id: "no",
        header: () => <div className="text-center font-medium">No</div>,
        cell: ({ row }: any) => (
          <div className="text-center">{row.index + 1}</div>
        ),
      },
      {
        accessorKey: "kdkppn",
        header: () => <div className="text-center font-medium">Kode KPPN</div>,
        cell: ({ row }: any) => (
          <div className="text-center">{row.getValue("kdkppn")}</div>
        ),
      },
      {
        accessorKey: "nmkppn",
        header: () => <div className="text-center font-medium">Nama KPPN</div>,
        cell: ({ row }: any) => (
          <div
            className="text-left max-w-[200px] truncate"
            title={row.getValue("nmkppn")}
          >
            {row.getValue("nmkppn")}
          </div>
        ),
      },
      {
        accessorKey: "jumlah_satker_up_kkp",
        header: () => (
          <div className="text-center font-medium">
            Jumlah Satker dengan UP KKP
          </div>
        ),
        cell: ({ row }: any) => (
          <div className="text-center">
            {row.getValue("jumlah_satker_up_kkp")}
          </div>
        ),
      },
      {
        accessorKey: "jumlah_satker_transaksi",
        header: () => (
          <div className="text-center font-medium">
            Jumlah Satker (Transaksi)
          </div>
        ),
        cell: ({ row }: any) => (
          <div className="text-center">
            {row.getValue("jumlah_satker_transaksi")}
          </div>
        ),
      },
      {
        accessorKey: "nilai_transaksi",
        header: () => (
          <div className="text-center font-medium">Nilai Transaksi</div>
        ),
        cell: ({ row }: any) => (
          <div className="text-right font-mono tabular-nums pr-2">
            {formatRupiah(row.getValue("nilai_transaksi"))}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center font-medium">Status</div>,
        cell: ({ row }: any) => {
          const status = row.getValue("status");
          return (
            <div className="flex justify-center">
              <Badge variant={status === "sent" ? "success" : "destructive"}>
                {status === "sent" ? "Sudah Kirim" : "Belum Kirim"}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "tanggalKirim",
        header: () => (
          <div className="text-center font-medium">Tanggal Kirim Laporan</div>
        ),
        cell: ({ row }: any) => (
          <div className="text-center">
            {formatDate(row.getValue("tanggalKirim"))}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => (
          <div className="text-center font-medium">Ringkasan Laporan</div>
        ),
        cell: ({ row }: any) => (
          <div className="flex items-center justify-center">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 cursor-pointer"
              onClick={() => handleViewRingkasan(row.original)}
              title="Lihat Ringkasan Laporan"
              disabled={row.original.status !== "sent"}
            >
              <Eye className="h-4 w-4 text-amber-600" />
            </Button>
          </div>
        ),
      },
    ];

    return (
      <div className="space-y-6">
        {/* Filter Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filter Data</CardTitle>
              <ResetButton onReset={handleReset} />
            </div>
          </CardHeader>
          <CardContent>
            {/* Kanwil Info from Auth */}
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Informasi Kanwil</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between md:flex-col md:gap-0.5">
                  <span className="text-muted-foreground">Kode Kanwil:</span>
                  <span className="font-medium">{user?.kdkanwil || "-"}</span>
                </div>
                <div className="flex justify-between md:flex-col md:gap-0.5">
                  <span className="text-muted-foreground">Nama Kanwil:</span>
                  <span className="font-medium">
                    {user?.nmkanwil || user?.kdkanwil || "-"}
                  </span>
                </div>
                <div className="flex justify-between md:flex-col md:gap-0.5">
                  <span className="text-muted-foreground">Role:</span>
                  <Badge variant="outline">{user?.role || "-"}</Badge>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tahun</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">KPPN</label>
                <SearchableSelect
                  options={kppnList}
                  value={selectedKppn}
                  onValueChange={setSelectedKppn}
                  placeholder={
                    isLoadingKppnRef && kppnRefList.length === 0
                      ? "Memuat KPPN..."
                      : "Pilih KPPN"
                  }
                  searchPlaceholder="Cari kode atau nama KPPN..."
                  emptyMessage="KPPN tidak ditemukan."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Periode (Akumulatif)</label>
                <Select
                  value={selectedPeriode}
                  onValueChange={setSelectedPeriode}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periodes.map((periode) => (
                      <SelectItem key={periode.value} value={periode.value}>
                        {periode.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {contentType === "ringkasan"
                  ? "Ringkasan Laporan Kanwil"
                  : "Monitoring Laporan KPPN"}
              </CardTitle>
              {contentType === "ringkasan" && (
                <Badge
                  variant={
                    statusLaporan === "sent"
                      ? "success"
                      : kppnCompletionStatus === "complete"
                        ? "success"
                        : "destructive"
                  }
                >
                  {statusLaporan === "sent"
                    ? "Sudah Dikirim"
                    : kppnCompletionStatus === "complete"
                      ? "Sudah Lengkap"
                      : "Belum Lengkap"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={10} />
            ) : contentType === "ringkasan" ? (
              <DataTable
                columns={ringkasanColumns}
                data={ringkasanData}
                initialPageSize={25}
              />
            ) : (
              <DataTable
                columns={monitoringColumns}
                data={monitoringData}
                initialPageSize={25}
              />
            )}
          </CardContent>
        </Card>

        {/* Ringkasan Modal */}
        <RingkasanLaporanModal
          open={isRingkasanModalOpen}
          onOpenChange={setIsRingkasanModalOpen}
          data={selectedItem}
          periode={selectedPeriode}
          isLoading={isModalLoading}
        />

        {/* Kendala Modals */}
        <KendalaHambatanModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          data={selectedItem}
          onSaved={fetchRingkasanData}
          tahun={selectedYear}
          triwulan={selectedPeriode.replace("Q", "")}
        />
        <LihatKendalaModal
          open={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
          data={selectedItem}
          tahun={selectedYear}
          triwulan={selectedPeriode.replace("Q", "")}
        />

        {/* Transaksi KKP Modal */}
        <TransaksiKkpModal
          open={isTransaksiModalOpen}
          onOpenChange={setIsTransaksiModalOpen}
          kdsatker={transaksiTarget?.kdsatker ?? ""}
          {...(transaksiTarget?.namaSatker
            ? { namaSatker: transaksiTarget.namaSatker }
            : {})}
          tahun={selectedYear}
          triwulan={selectedPeriode.replace("Q", "")}
        />

        {/* Tagihan KKP Modal */}
        <TagihanKkpModal
          open={isTagihanModalOpen}
          onOpenChange={setIsTagihanModalOpen}
          kdsatker={tagihanTarget?.kdsatker ?? ""}
          {...(tagihanTarget?.namaSatker
            ? { namaSatker: tagihanTarget.namaSatker }
            : {})}
          tahun={selectedYear}
          triwulan={selectedPeriode.replace("Q", "")}
        />

        {/* Kartu KKP Modal */}
        <KartuKkpModal
          open={isKartuModalOpen}
          onOpenChange={setIsKartuModalOpen}
          kdsatker={kartuTarget?.kdsatker ?? ""}
          {...(kartuTarget?.namaSatker
            ? { namaSatker: kartuTarget.namaSatker }
            : {})}
          tahun={selectedYear}
        />

        {/* Satker Detail Modal */}
        <SatkerDetailModal
          open={isSatkerDetailModalOpen}
          onOpenChange={setIsSatkerDetailModalOpen}
          kdsatker={satkerDetailTarget?.kdsatker ?? ""}
          namaSatker={satkerDetailTarget?.namaSatker ?? ""}
          tahun={selectedYear}
          onSaved={fetchRingkasanData}
        />
      </div>
    );
  },
);
