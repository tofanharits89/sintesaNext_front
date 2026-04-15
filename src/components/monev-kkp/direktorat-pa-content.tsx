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
import { Eye, Building2 } from "lucide-react";
import { RingkasanLaporanModal } from "./modals/ringkasan-laporan-modal";
import { LihatKendalaModal } from "./modals/lihat-kendala-modal";
import { TransaksiKkpModal } from "./modals/transaksi-kkp-modal";
import { TagihanKkpModal } from "./modals/tagihan-kkp-modal";
import { KartuKkpModal } from "./modals/kartu-kkp-modal";
import { SatkerDetailModal } from "./modals/satker-detail-modal";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { apiPath } from "@/lib/config/base-path";

// Type for the Ringkasan data (for both Kanwil and KPPN aggregation)
export interface RingkasanData {
  id: string | number;
  kodeKanwil?: string;
  namaLokasi?: string;
  kodeKppn?: string;
  namaKppn?: string;
  kodeBA: string;
  kodeSatker: string;
  namaSatker: string;
  upKkpPerBulan: number;
  porsiUpKkp: number;
  bankPenerbit: string;
  jmlKartuUsul: number | null;
  jumlahKartu: number;
  jmlKartuOpr: number;
  limitOpr: number;
  jmlKartuPd: number;
  limitPd: number;
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

// Type for Monitoring Kanwil data
interface MonitoringKanwilData {
  id: string | number;
  kdkanwil: string;
  nmlokasi: string;
  jumlah_kppn: number;
  jumlah_satker_up_kkp: number;
  jumlah_satker_transaksi: number;
  nilai_transaksi: number;
  status?: string;
  tanggalKirim?: string | null;
}

// Type for Monitoring KPPN data
interface MonitoringKppnData {
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
export interface DirektoratPaContentRef {
  getData: () => RingkasanData[];
  getFilters: () => {
    selectedYear: string;
    selectedPeriode: string;
    selectedKanwil: string;
    selectedKppn: string;
    kanwilLabel: string;
    kppnLabel: string;
  };
}

interface DirektoratPaContentProps {
  contentType?:
    | "ringkasan-kanwil"
    | "ringkasan-kppn"
    | "monitoring-kanwil"
    | "monitoring-kppn";
}

export const DirektoratPaContent = forwardRef<
  DirektoratPaContentRef,
  DirektoratPaContentProps
>(function DirektoratPaContent({ contentType = "ringkasan-kanwil" }, ref) {
  const { user } = useAuth();

  const now = new Date();
  const defaultYear = "2026";
  const defaultPeriode = `Q${Math.ceil((now.getMonth() + 1) / 3)}`;

  // State for data
  const [ringkasanData, setRingkasanData] = useState<RingkasanData[]>([]);
  const [monitoringKanwilData, setMonitoringKanwilData] = useState<
    MonitoringKanwilData[]
  >([]);
  const [monitoringKppnData, setMonitoringKppnData] = useState<
    MonitoringKppnData[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter state
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedKanwil, setSelectedKanwil] = useState("all");
  const [selectedKppn, setSelectedKppn] = useState("all");
  const [selectedPeriode, setSelectedPeriode] = useState(defaultPeriode);
  const [kppnRefList, setKppnRefList] = useState<
    { value: string; label: string }[]
  >([]);
  const [isLoadingKppnRef, setIsLoadingKppnRef] = useState(false);
  const [kanwilRefList, setKanwilRefList] = useState<
    { value: string; label: string }[]
  >([]);
  const [isLoadingKanwilRef, setIsLoadingKanwilRef] = useState(false);

  // Modal state
  const [isRingkasanModalOpen, setIsRingkasanModalOpen] = useState(false);
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
    namaSatker: string;
  } | null>(null);
  const [isKartuModalOpen, setIsKartuModalOpen] = useState(false);
  const [kartuTarget, setKartuTarget] = useState<{
    kdsatker: string;
    namaSatker: string;
  } | null>(null);
  const [isSatkerDetailModalOpen, setIsSatkerDetailModalOpen] = useState(false);
  const [satkerDetailTarget, setSatkerDetailTarget] = useState<{
    kdsatker: string;
    namaSatker?: string;
  } | null>(null);

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    getData: () => ringkasanData,
    getFilters: () => ({
      selectedYear,
      selectedPeriode,
      selectedKanwil,
      selectedKppn,
      kanwilLabel: kanwilRefList.find(k => k.value === selectedKanwil)?.label || selectedKanwil,
      kppnLabel: kppnRefList.find(k => k.value === selectedKppn)?.label || selectedKppn,
    }),
  }));

  // ─── Data Fetching ─────────────────────────────────────

  const fetchRingkasanData = async () => {
    setIsLoading(true);
    try {
      const triwulan = selectedPeriode.replace("Q", "");
      let kppnParam = "";
      let kanwilParam = "";
      if (contentType === "ringkasan-kppn" && selectedKppn !== "all") {
        kppnParam = `&kdkppn=${selectedKppn}`;
      }
      if (
        (contentType === "ringkasan-kanwil" ||
          contentType === "ringkasan-kppn") &&
        selectedKanwil !== "all"
      ) {
        kanwilParam = `&kdkanwil=${selectedKanwil}`;
      }
      const apiUrl = apiPath(
        `/monev-kkp/kppn?tahun=${selectedYear}&triwulan=${triwulan}${kanwilParam}${kppnParam}`,
      );

      const response = await fetch(apiUrl, { credentials: "include" });
      if (!response.ok) throw new Error("Gagal mengambil data ringkasan");
      const result = await response.json();

      const mappedData: RingkasanData[] = result.data.map(
        (item: any, index: number) => ({
          id: `${item.kdsatker}-${index}`,
          kodeKanwil: item.kdkanwil,
          namaLokasi: item.nmlokasi || item.kdkanwil || "-",
          kodeKppn: item.kdkppn,
          namaKppn: item.nmkppn || item.kdkppn || "-",
          kodeBA: item.kddept,
          kodeSatker: item.kdsatker,
          namaSatker: item.nmsatker,
          upKkpPerBulan: Number(item.nilai_up_kkp || 0),
          porsiUpKkp: Number(item.porsi_up_kkp_dari_total_up || 0),
          bankPenerbit: item.bank_penerbit,
          jmlKartuUsul: item.jml_kartu_usul !== undefined && item.jml_kartu_usul !== null ? Number(item.jml_kartu_usul) : null,
          jumlahKartu: Number(item.jumlah_kartu || 0),
          jmlKartuOpr: Number(item.jml_kartu_opr || 0),
          limitOpr: Number(item.limit_opr || 0),
          jmlKartuPd: Number(item.jml_kartu_pd || 0),
          limitPd: Number(item.limit_pd || 0),
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
        }),
      );
      setRingkasanData(mappedData);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data ringkasan");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMonitoringKanwilData = async () => {
    setIsLoading(true);
    try {
      const triwulan = selectedPeriode.replace("Q", "");
      const kanwilParam =
        selectedKanwil !== "all" ? `&kdkanwil=${selectedKanwil}` : "";
      const apiUrl = apiPath(
        `/monev-kkp/direktorat/monitoring-kanwil?tahun=${selectedYear}&triwulan=${triwulan}${kanwilParam}`,
      );

      const response = await fetch(apiUrl, { credentials: "include" });
      if (!response.ok)
        throw new Error("Gagal mengambil data monitoring kanwil");
      const result = await response.json();

      const mappedData: MonitoringKanwilData[] = result.data.map(
        (item: any) => ({
          id: item.kdkanwil,
          kdkanwil: item.kdkanwil,
          nmlokasi: item.nmlokasi,
          jumlah_kppn: Number(item.jumlah_kppn || 0),
          jumlah_satker_up_kkp: Number(item.jumlah_satker_up_kkp || 0),
          jumlah_satker_transaksi: Number(item.jumlah_satker_transaksi || 0),
          nilai_transaksi: Number(item.nilai_transaksi || 0),
          status:
            String(item.sts_kirim_kanwil || "").trim() === "1"
              ? "sent"
              : "not_sent",
          tanggalKirim: item.tgkirim_kanwil || null,
        }),
      );
      setMonitoringKanwilData(mappedData);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data monitoring kanwil");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMonitoringKppnData = async () => {
    setIsLoading(true);
    try {
      const triwulan = selectedPeriode.replace("Q", "");
      const kppnParam =
        selectedKppn !== "all" ? `&kdkppn=${selectedKppn}` : "";
      const kanwilParam =
        selectedKanwil !== "all" ? `&kdkanwil=${selectedKanwil}` : "";
      const apiUrl = apiPath(
        `/monev-kkp/kanwil/monitoring-kppn?tahun=${selectedYear}&triwulan=${triwulan}${kppnParam}${kanwilParam}`,
      );

      const response = await fetch(apiUrl, { credentials: "include" });
      if (!response.ok) throw new Error("Gagal mengambil data monitoring KPPN");
      const result = await response.json();

      const mappedData: MonitoringKppnData[] = result.data.map((item: any) => ({
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
      setMonitoringKppnData(mappedData);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data monitoring KPPN");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKppnRefList = async (kdkanwil?: string) => {
    setIsLoadingKppnRef(true);
    try {
      const kanwilParam =
        kdkanwil && kdkanwil !== "all" ? `?kdkanwil=${kdkanwil}` : "";
      const response = await fetch(
        apiPath(`/monev-kkp/kanwil/ref-kppn${kanwilParam}`),
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Gagal mengambil data referensi KPPN");
      }

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

  const fetchKanwilRefList = async (tahun?: string) => {
    setIsLoadingKanwilRef(true);
    try {
      const yearParam = tahun ? `?tahun=${tahun}` : "";
      const response = await fetch(
        apiPath(`/monev-kkp/kanwil/ref-kanwil${yearParam}`),
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Gagal mengambil data referensi Kanwil");
      }

      const result = await response.json();
      const mappedList = result.data.map((item: any) => ({
        value: item.kdkanwil,
        label: `${item.kdkanwil} - ${item.nmlokasi}`,
      }));

      setKanwilRefList(mappedList);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data referensi Kanwil");
    } finally {
      setIsLoadingKanwilRef(false);
    }
  };

  // Fetch on mount and when filters change
  useEffect(() => {
    if (!user) return;
    if (
      contentType === "ringkasan-kanwil" ||
      contentType === "ringkasan-kppn"
    ) {
      fetchRingkasanData();
    } else if (contentType === "monitoring-kanwil") {
      fetchMonitoringKanwilData();
    } else if (contentType === "monitoring-kppn") {
      fetchMonitoringKppnData();
    }
  }, [
    user,
    contentType,
    selectedYear,
    selectedPeriode,
    selectedKanwil,
    selectedKppn,
  ]);

  useEffect(() => {
    if (!user) return;
    fetchKanwilRefList(selectedYear);
    fetchKppnRefList(selectedKanwil);
  }, [user, selectedYear]);

  // Handle hierarchical filter change
  const handleKanwilChange = (value: string) => {
    setSelectedKanwil(value);
    setSelectedKppn("all");
    fetchKppnRefList(value);
  };

  // ─── Dynamic filter lists ──────────────────────────────

  const kanwilList: { value: string; label: string }[] = [
    { value: "all", label: "Semua Kanwil" },
  ];
  const uniqueKanwilsMap = new Map<string, string>();
  ringkasanData.forEach((d) => {
    if (d.kodeKanwil && !uniqueKanwilsMap.has(d.kodeKanwil)) {
      uniqueKanwilsMap.set(d.kodeKanwil, d.namaLokasi || d.kodeKanwil);
    }
  });
  uniqueKanwilsMap.forEach((label, value) => {
    kanwilList.push({ value, label });
  });

  const kppnList: { value: string; label: string }[] = [
    { value: "all", label: "Semua KPPN" },
  ];
  const uniqueKppnsMap = new Map<string, string>();
  ringkasanData.forEach((d) => {
    if (d.kodeKppn && !uniqueKppnsMap.has(d.kodeKppn)) {
      uniqueKppnsMap.set(
        d.kodeKppn,
        `${d.kodeKppn} - ${d.namaKppn || d.kodeKppn}`,
      );
    }
  });
  uniqueKppnsMap.forEach((label, value) => {
    kppnList.push({ value, label });
  });

  const monitoringKanwilList: { value: string; label: string }[] = [
    { value: "all", label: "Semua Kanwil" },
  ];
  const uniqueMonKanwilsMap = new Map<string, string>();
  monitoringKanwilData.forEach((d) => {
    if (d.kdkanwil && !uniqueMonKanwilsMap.has(d.kdkanwil)) {
      uniqueMonKanwilsMap.set(d.kdkanwil, d.nmlokasi || d.kdkanwil);
    }
  });
  uniqueMonKanwilsMap.forEach((label, value) => {
    monitoringKanwilList.push({ value, label });
  });

  const monitoringKppnList: { value: string; label: string }[] = [
    { value: "all", label: "Semua KPPN" },
  ];
  const uniqueMonKppnsMap = new Map<string, string>();
  monitoringKppnData.forEach((d) => {
    if (d.kdkppn && !uniqueMonKppnsMap.has(d.kdkppn)) {
      uniqueMonKppnsMap.set(
        d.kdkppn,
        `${d.kdkppn} - ${d.nmkppn || d.kdkppn}`,
      );
    }
  });
  uniqueMonKppnsMap.forEach((label, value) => {
    monitoringKppnList.push({ value, label });
  });

  // ─── Helpers ───────────────────────────────────────────

  const years = ["2026", "2025", "2024", "2023"];

  const periodes = [
    { value: "Q1", label: "Triwulan 1 (Jan - Mar)" },
    { value: "Q2", label: "Triwulan 2 (Jan - Jun)" },
    { value: "Q3", label: "Triwulan 3 (Jan - Sep)" },
    { value: "Q4", label: "Triwulan 4 (Jan - Des)" },
  ];

  const handleReset = () => {
    setSelectedYear(defaultYear);
    setSelectedKanwil("all");
    setSelectedKppn("all");
    setSelectedPeriode(defaultPeriode);
  };

  const handleViewRingkasan = async (item: any) => {
    if (item.satkerData) {
      setSelectedItem(item);
      setIsRingkasanModalOpen(true);
      return;
    }

    const initialItem = {
      kodeKppn: item.kdkppn || item.kdkanwil,
      namaKppn: item.nmkppn || item.nmlokasi,
      satkerData: [],
    };
    setSelectedItem(initialItem);
    setIsRingkasanModalOpen(true);
    setIsModalLoading(true);

    try {
      const triwulan = selectedPeriode.replace("Q", "");
      let apiUrl = "";
      let combinedItem: any = {};

      if (item.kdkppn) {
        apiUrl = apiPath(
          `/monev-kkp/kppn?tahun=${selectedYear}&triwulan=${triwulan}&kdkppn=${item.kdkppn}`,
        );
        const response = await fetch(apiUrl, { credentials: "include" });
        if (!response.ok) throw new Error("Gagal mengambil data satker");
        const result = await response.json();
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
        combinedItem = { kodeKppn: item.kdkppn, namaKppn: item.nmkppn, satkerData: satkerData };
      } else if (item.kdkanwil) {
        apiUrl = apiPath(
          `/monev-kkp/kppn?tahun=${selectedYear}&triwulan=${triwulan}&kdkanwil=${item.kdkanwil}`,
        );
        const response = await fetch(apiUrl, { credentials: "include" });
        if (!response.ok) throw new Error("Gagal mengambil data satker");
        const result = await response.json();
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
        combinedItem = { kodeKppn: item.kdkanwil, namaKppn: item.nmlokasi, satkerData: satkerData };
      } else if (item.kodeSatker) {
        combinedItem = { kodeKppn: item.kodeKppn, namaKppn: item.namaKppn, satkerData: [item] };
      }
      setSelectedItem(combinedItem);
    } catch (error) {
      console.error("Error fetching satker data:", error);
      toast.error("Gagal mengambil data detail satker");
    } finally {
      setIsModalLoading(false);
    }
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

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ─── Column Definitions ────────────────────────────────

  const ringkasanKanwilColumns = [
    {
      id: "no",
      header: () => <div className="text-center font-medium">No</div>,
      cell: ({ row }: any) => <div className="text-center">{row.index + 1}</div>,
    },
    {
      accessorKey: "kodeKanwil",
      header: () => <div className="text-center font-medium">Kode Kanwil</div>,
      cell: ({ row }: any) => <div className="text-center">{row.getValue("kodeKanwil")}</div>,
    },
    {
      accessorKey: "namaLokasi",
      header: () => <div className="text-center font-medium">Nama Kanwil</div>,
      cell: ({ row }: any) => (
        <div className="text-left max-w-[200px] truncate" title={row.getValue("namaLokasi")}>
          {row.getValue("namaLokasi")}
        </div>
      ),
    },
    {
      accessorKey: "kodeBA",
      header: () => <div className="text-center font-medium">Kode BA</div>,
      cell: ({ row }: any) => <div className="text-center">{row.getValue("kodeBA")}</div>,
    },
    {
      accessorKey: "kodeSatker",
      header: () => <div className="text-center font-medium">Kode Satker</div>,
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
      header: () => <div className="text-center font-medium">Nama Satker</div>,
      cell: ({ row }: any) => (
        <div className="text-left max-w-[200px] truncate" title={row.getValue("namaSatker")}>
          {row.getValue("namaSatker")}
        </div>
      ),
    },
    {
      accessorKey: "upKkpPerBulan",
      header: () => <div className="text-center font-medium">UP KKP Per Bulan (Rp)</div>,
      cell: ({ row }: any) => (
        <div className="text-right font-mono tabular-nums pr-2">
          {formatRupiah(row.getValue("upKkpPerBulan"))}
        </div>
      ),
    },
    {
      accessorKey: "porsiUpKkp",
      header: () => <div className="text-center font-medium">Porsi UP KKP dari Total UP</div>,
      cell: ({ row }: any) => <div className="text-center">{formatPercent(row.getValue("porsiUpKkp"))}</div>,
    },
    {
      accessorKey: "bankPenerbit",
      header: () => <div className="text-center font-medium">Bank Penerbit KKP</div>,
      cell: ({ row }: any) => <div className="text-center">{row.getValue("bankPenerbit")}</div>,
    },
    {
      accessorKey: "jumlahKartu",
      header: () => <div className="text-center font-medium">Jumlah Kartu</div>,
      cell: ({ row }: any) => (
        <div
          className="text-center cursor-pointer text-blue-600 hover:underline"
          onClick={() => {
            setKartuTarget({ kdsatker: row.original.kodeSatker, namaSatker: row.original.namaSatker });
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
      header: () => <div className="text-center font-medium">Nilai Tagihan (Rp)</div>,
      cell: ({ row }: any) => (
        <div
          className="text-right font-mono tabular-nums pr-2 cursor-pointer text-blue-600 hover:underline"
          onClick={() => {
            setTagihanTarget({ kdsatker: row.original.kodeSatker, namaSatker: row.original.namaSatker });
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
      header: () => <div className="text-center font-medium">Nilai Transaksi KKP (Rp)</div>,
      cell: ({ row }: any) => (
        <div
          className="text-right font-mono tabular-nums pr-2 cursor-pointer text-blue-600 hover:underline"
          onClick={() => {
            setTransaksiTarget({ kdsatker: row.original.kodeSatker, namaSatker: row.original.namaSatker });
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
      header: () => <div className="text-center font-medium">Kendala dan Hambatan</div>,
      cell: ({ row }: any) => (
        <div className="flex items-center justify-center gap-2">
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

  const ringkasanKppnColumns = [
    {
      id: "no",
      header: () => <div className="text-center font-medium">No</div>,
      cell: ({ row }: any) => <div className="text-center">{row.index + 1}</div>,
    },
    {
      accessorKey: "kodeKppn",
      header: () => <div className="text-center font-medium">Kode KPPN</div>,
      cell: ({ row }: any) => <div className="text-center">{row.getValue("kodeKppn")}</div>,
    },
    {
      accessorKey: "namaKppn",
      header: () => <div className="text-center font-medium">Nama KPPN</div>,
      cell: ({ row }: any) => (
        <div className="text-left max-w-[150px] truncate" title={row.getValue("namaKppn")}>
          {row.getValue("namaKppn")}
        </div>
      ),
    },
    {
      accessorKey: "kodeBA",
      header: () => <div className="text-center font-medium">Kode BA</div>,
      cell: ({ row }: any) => <div className="text-center">{row.getValue("kodeBA")}</div>,
    },
    {
      accessorKey: "kodeSatker",
      header: () => <div className="text-center font-medium">Kode Satker</div>,
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
      header: () => <div className="text-center font-medium">Nama Satker</div>,
      cell: ({ row }: any) => (
        <div className="text-left max-w-[200px] truncate" title={row.getValue("namaSatker")}>
          {row.getValue("namaSatker")}
        </div>
      ),
    },
    {
      accessorKey: "upKkpPerBulan",
      header: () => <div className="text-center font-medium">UP KKP Per Bulan (Rp)</div>,
      cell: ({ row }: any) => (
        <div className="text-right font-mono tabular-nums pr-2">
          {formatRupiah(row.getValue("upKkpPerBulan"))}
        </div>
      ),
    },
    {
      accessorKey: "porsiUpKkp",
      header: () => <div className="text-center font-medium">Porsi UP KKP dari Total UP</div>,
      cell: ({ row }: any) => <div className="text-center">{formatPercent(row.getValue("porsiUpKkp"))}</div>,
    },
    {
      accessorKey: "bankPenerbit",
      header: () => <div className="text-center font-medium">Bank Penerbit KKP</div>,
      cell: ({ row }: any) => <div className="text-center">{row.getValue("bankPenerbit")}</div>,
    },
    {
      accessorKey: "jumlahKartu",
      header: () => <div className="text-center font-medium">Jumlah Kartu</div>,
      cell: ({ row }: any) => (
        <div
          className="text-center cursor-pointer text-blue-600 hover:underline"
          onClick={() => {
            setKartuTarget({ kdsatker: row.original.kodeSatker, namaSatker: row.original.namaSatker });
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
      header: () => <div className="text-center font-medium">Nilai Tagihan (Rp)</div>,
      cell: ({ row }: any) => (
        <div
          className="text-right font-mono tabular-nums pr-2 cursor-pointer text-blue-600 hover:underline"
          onClick={() => {
            setTagihanTarget({ kdsatker: row.original.kodeSatker, namaSatker: row.original.namaSatker });
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
      header: () => <div className="text-center font-medium">Nilai Transaksi KKP (Rp)</div>,
      cell: ({ row }: any) => (
        <div
          className="text-right font-mono tabular-nums pr-2 cursor-pointer text-blue-600 hover:underline"
          onClick={() => {
            setTransaksiTarget({ kdsatker: row.original.kodeSatker, namaSatker: row.original.namaSatker });
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
      header: () => <div className="text-center font-medium">Kendala dan Hambatan</div>,
      cell: ({ row }: any) => (
        <div className="flex items-center justify-center gap-2">
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

  const monitoringKanwilColumns = [
    {
      id: "no",
      header: () => <div className="text-center font-medium">No</div>,
      cell: ({ row }: any) => <div className="text-center">{row.index + 1}</div>,
    },
    {
      accessorKey: "kdkanwil",
      header: () => <div className="text-center font-medium">Kode Kanwil</div>,
      cell: ({ row }: any) => <div className="text-center">{row.getValue("kdkanwil")}</div>,
    },
    {
      accessorKey: "nmlokasi",
      header: () => <div className="text-center font-medium">Nama Kanwil</div>,
      cell: ({ row }: any) => (
        <div className="text-left max-w-[200px] truncate" title={row.getValue("nmlokasi")}>
          {row.getValue("nmlokasi")}
        </div>
      ),
    },
    {
      accessorKey: "jumlah_kppn",
      header: () => <div className="text-center font-medium">Jumlah KPPN</div>,
      cell: ({ row }: any) => <div className="text-center">{row.getValue("jumlah_kppn")}</div>,
    },
    {
      accessorKey: "jumlah_satker_up_kkp",
      header: () => <div className="text-center font-medium">Total Satker UP KKP</div>,
      cell: ({ row }: any) => <div className="text-center">{row.getValue("jumlah_satker_up_kkp")}</div>,
    },
    {
      accessorKey: "jumlah_satker_transaksi",
      header: () => <div className="text-center font-medium">Satker (Transaksi)</div>,
      cell: ({ row }: any) => <div className="text-center">{row.getValue("jumlah_satker_transaksi")}</div>,
    },
    {
      accessorKey: "nilai_transaksi",
      header: () => <div className="text-center font-medium">Total Nilai Transaksi</div>,
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
      header: () => <div className="text-center font-medium">Tanggal Kirim Laporan</div>,
      cell: ({ row }: any) => <div className="text-center">{formatDate(row.getValue("tanggalKirim"))}</div>,
    },
    {
      id: "actions",
      header: () => <div className="text-center font-medium">Ringkasan Laporan</div>,
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

  const monitoringKppnColumns = [
    {
      id: "no",
      header: () => <div className="text-center font-medium">No</div>,
      cell: ({ row }: any) => <div className="text-center">{row.index + 1}</div>,
    },
    {
      accessorKey: "kdkppn",
      header: () => <div className="text-center font-medium">Kode KPPN</div>,
      cell: ({ row }: any) => <div className="text-center">{row.getValue("kdkppn")}</div>,
    },
    {
      accessorKey: "nmkppn",
      header: () => <div className="text-center font-medium">Nama KPPN</div>,
      cell: ({ row }: any) => (
        <div className="text-left max-w-[200px] truncate" title={row.getValue("nmkppn")}>
          {row.getValue("nmkppn")}
        </div>
      ),
    },
    {
      accessorKey: "jumlah_satker_up_kkp",
      header: () => <div className="text-center font-medium">Jumlah Satker dengan UP KKP</div>,
      cell: ({ row }: any) => <div className="text-center">{row.getValue("jumlah_satker_up_kkp")}</div>,
    },
    {
      accessorKey: "jumlah_satker_transaksi",
      header: () => <div className="text-center font-medium">Jumlah Satker (Transaksi)</div>,
      cell: ({ row }: any) => <div className="text-center">{row.getValue("jumlah_satker_transaksi")}</div>,
    },
    {
      accessorKey: "nilai_transaksi",
      header: () => <div className="text-center font-medium">Nilai Transaksi</div>,
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
      header: () => <div className="text-center font-medium">Tanggal Kirim Laporan</div>,
      cell: ({ row }: any) => <div className="text-center">{formatDate(row.getValue("tanggalKirim"))}</div>,
    },
    {
      id: "actions",
      header: () => <div className="text-center font-medium">Ringkasan Laporan</div>,
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

  const getColumnsAndData = (): { columns: any[]; data: any[] } => {
    switch (contentType) {
      case "ringkasan-kanwil": return { columns: ringkasanKanwilColumns, data: ringkasanData };
      case "ringkasan-kppn": return { columns: ringkasanKppnColumns, data: ringkasanData };
      case "monitoring-kanwil": return { columns: monitoringKanwilColumns, data: monitoringKanwilData };
      case "monitoring-kppn": return { columns: monitoringKppnColumns, data: monitoringKppnData };
      default: return { columns: ringkasanKanwilColumns, data: ringkasanData };
    }
  };

  const { columns, data } = getColumnsAndData();

  const getTitle = () => {
    switch (contentType) {
      case "ringkasan-kanwil": return "Ringkasan Laporan per Kanwil";
      case "ringkasan-kppn": return "Ringkasan Laporan per KPPN";
      case "monitoring-kanwil": return "Monitoring Laporan Kanwil";
      case "monitoring-kppn": return "Monitoring Laporan KPPN";
      default: return "Ringkasan Laporan per Kanwil";
    }
  };

  const activeKanwilList =
    kanwilRefList.length > 0
      ? [{ value: "all", label: "Semua Kanwil" }, ...kanwilRefList]
      : contentType === "monitoring-kanwil"
        ? monitoringKanwilList
        : kanwilList;
  const activeKppnList =
    kppnRefList.length > 0
      ? [{ value: "all", label: "Semua KPPN" }, ...kppnRefList]
      : contentType === "monitoring-kppn"
        ? monitoringKppnList
        : kppnList;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="shrink-0">Filter Data</CardTitle>
            {/* Direktorat info inline — desktop only */}
            <div className="hidden md:flex items-center gap-x-2 flex-1 text-sm px-3 py-1.5">
              <Building2 className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium">Direktorat Pelaksanaan Anggaran</span>
              <span className="text-muted-foreground">— Menampilkan data agregat dari seluruh Kanwil dan KPPN</span>
            </div>
            <ResetButton onReset={handleReset} />
          </div>
        </CardHeader>
        <CardContent>
          {/* Direktorat info — mobile only (on desktop it lives in the CardHeader) */}
          <div className="flex md:hidden mb-4 p-3 bg-muted rounded-lg items-center gap-x-3 gap-y-1 flex-wrap text-sm">
            <Building2 className="h-4 w-4 text-primary shrink-0" />
            <span className="font-medium">Direktorat Pelaksanaan Anggaran</span>
            <span className="text-muted-foreground text-xs">Menampilkan data agregat dari seluruh Kanwil dan KPPN</span>
          </div>
          <div className={`grid grid-cols-1 ${
            contentType === "ringkasan-kppn" || contentType === "monitoring-kppn"
              ? "md:grid-cols-4"
              : "md:grid-cols-3"
          } gap-4`}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tahun</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{years.map((year) => (<SelectItem key={year} value={year}>{year}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            {(contentType === "ringkasan-kanwil" ||
              contentType === "monitoring-kanwil" ||
              contentType === "monitoring-kppn" ||
              contentType === "ringkasan-kppn") && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Kanwil</label>
                <Select
                  value={selectedKanwil}
                  onValueChange={handleKanwilChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        isLoadingKanwilRef && kanwilRefList.length === 0
                          ? "Memuat Kanwil..."
                          : "Pilih Kanwil"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {activeKanwilList.map((kanwil) => (
                      <SelectItem key={kanwil.value} value={kanwil.value}>
                        {kanwil.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {(contentType === "ringkasan-kppn" || contentType === "monitoring-kppn") && (
              <div className="space-y-2">
                <label className="text-sm font-medium">KPPN</label>
                <SearchableSelect
                  options={activeKppnList}
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
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Periode (Akumulatif)</label>
              <Select value={selectedPeriode} onValueChange={setSelectedPeriode}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{periodes.map((periode) => (<SelectItem key={periode.value} value={periode.value}>{periode.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{getTitle()}</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <TableSkeleton rows={10} /> : <DataTable columns={columns} data={data} initialPageSize={25} />}
        </CardContent>
      </Card>

      <RingkasanLaporanModal open={isRingkasanModalOpen} onOpenChange={setIsRingkasanModalOpen} data={selectedItem} periode={selectedPeriode} isLoading={isModalLoading} />
      <LihatKendalaModal 
        open={isViewModalOpen} 
        onOpenChange={setIsViewModalOpen} 
        data={selectedItem} 
        tahun={selectedYear}
        triwulan={selectedPeriode.replace("Q", "")}
      />
      <TransaksiKkpModal open={isTransaksiModalOpen} onOpenChange={setIsTransaksiModalOpen} kdsatker={transaksiTarget?.kdsatker ?? ""} {...(transaksiTarget?.namaSatker ? { namaSatker: transaksiTarget.namaSatker } : {})} tahun={selectedYear} triwulan={selectedPeriode.replace("Q", "")} />
      <TagihanKkpModal open={isTagihanModalOpen} onOpenChange={setIsTagihanModalOpen} kdsatker={tagihanTarget?.kdsatker ?? ""} {...(tagihanTarget?.namaSatker ? { namaSatker: tagihanTarget.namaSatker } : {})} tahun={selectedYear} triwulan={selectedPeriode.replace("Q", "")} />
      <KartuKkpModal open={isKartuModalOpen} onOpenChange={setIsKartuModalOpen} kdsatker={kartuTarget?.kdsatker ?? ""} {...(kartuTarget?.namaSatker ? { namaSatker: kartuTarget.namaSatker } : {})} tahun={selectedYear} />
      <SatkerDetailModal open={isSatkerDetailModalOpen} onOpenChange={setIsSatkerDetailModalOpen} kdsatker={satkerDetailTarget?.kdsatker ?? ""} namaSatker={satkerDetailTarget?.namaSatker ?? ""} tahun={selectedYear} onSaved={fetchRingkasanData} />
    </div>
  );
});
