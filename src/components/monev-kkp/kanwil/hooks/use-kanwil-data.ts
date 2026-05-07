import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { apiPath } from "@/lib/config/base-path";
import { useAuth } from "@/hooks/useAuth";
import { addCsrfToHeaders } from "@/utils/csrf-utils";
import { RingkasanKanwilData, MonitoringKppnData, TransaksiData } from "../types";

const normalizeStatus = (status: unknown) =>
  String(status || "").trim() === "1" ? "sent" : "not_sent";

const mapMonitoringRows = (rows: any[]): MonitoringKppnData[] =>
  rows.map((item: any) => ({
    id: item.kdkppn,
    kdkppn: item.kdkppn,
    kdkanwil: item.kdkanwil,
    nmkppn: item.nmkppn,
    jumlah_satker_up_kkp: Number(item.jumlah_satker_up_kkp || 0),
    jumlah_satker_transaksi: Number(item.jumlah_satker_transaksi || 0),
    nilai_transaksi: Number(item.nilai_transaksi || 0),
    status: normalizeStatus(item.sts_kirim_kppn ?? item.status),
    tanggalKirim: item.tgkirim_kppn ?? item.tanggalKirim ?? null,
  }));

const buildMonitoringFallbackFromRingkasan = (rows: any[]): MonitoringKppnData[] => {
  const grouped = new Map<
    string,
    {
      kdkppn: string;
      kdkanwil?: string;
      nmkppn: string;
      jumlah_satker_up_kkp: number;
      jumlah_satker_transaksi: number;
      nilai_transaksi: number;
    }
  >();

  for (const item of rows) {
    const kdkppn = String(item.kdkppn || "").trim();
    if (!kdkppn) continue;

    const current = grouped.get(kdkppn) || {
      kdkppn,
      kdkanwil: item.kdkanwil,
      nmkppn: item.nmkppn || kdkppn,
      jumlah_satker_up_kkp: 0,
      jumlah_satker_transaksi: 0,
      nilai_transaksi: 0,
    };

    current.jumlah_satker_up_kkp += 1;

    const nilaiTransaksi = Number(item.nilai_trans_sp2d || 0);
    if (nilaiTransaksi > 0) {
      current.jumlah_satker_transaksi += 1;
    }
    current.nilai_transaksi += nilaiTransaksi;

    grouped.set(kdkppn, current);
  }

  return Array.from(grouped.values())
    .sort((a, b) => a.kdkppn.localeCompare(b.kdkppn, "id"))
    .map((item) => ({
      ...item,
      id: item.kdkppn,
      status: "not_sent",
      tanggalKirim: null,
    }));
};

export const useKanwilData = (
  contentType: "ringkasan" | "monitoring" | "transaksi",
  onPeriodeChange?: (year: string, periode: string) => void
) => {
  const { user, filterDataByRole } = useAuth();
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const currentQ = Math.ceil(currentMonth / 3);
  
  let prevQ = currentQ - 1;
  let prevYear = currentYear;
  
  if (prevQ === 0) {
    prevQ = 4;
    prevYear = currentYear - 1;
  }

  const [ringkasanData, setRingkasanData] = useState<RingkasanKanwilData[]>([]);
  const [monitoringData, setMonitoringData] = useState<MonitoringKppnData[]>([]);
  const [transaksiData, setTransaksiData] = useState<TransaksiData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(String(prevYear));
  const [selectedKppn, setSelectedKppn] = useState("all");
  const [selectedPeriode, setSelectedPeriode] = useState(`Q${prevQ}`);
  const [kppnRefList, setKppnRefList] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingKppnRef, setIsLoadingKppnRef] = useState(false);

  // Pagination state
  const [ringkasanPagination, setRingkasanPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalRingkasan, setTotalRingkasan] = useState(0);

  const [transaksiPagination, setTransaksiPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalTransaksi, setTotalTransaksi] = useState(0);
  const [grandTotals, setGrandTotals] = useState<any>(null);

  const fetchRingkasanData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const triwulan = selectedPeriode.replace("Q", "");
      const kppnParam = selectedKppn !== "all" ? `&kdkppn=${selectedKppn}` : "";
      let regionalParams = "";
      if (user?.role === "kanwil_djpb" && user.kdkanwil) {
        regionalParams = `&kdkanwil=${user.kdkanwil}`;
      } else if (user?.role === "kppn" && user.kdkppn) {
        regionalParams = `&kdkppn=${user.kdkppn}`;
      }
      const ts = new Date().getTime();

      const page = ringkasanPagination.pageIndex + 1;
      const limit = ringkasanPagination.pageSize;

      const apiUrl = apiPath(
        `/monev-kkp/kppn?tahun=${selectedYear}&triwulan=${triwulan}${kppnParam}${regionalParams}&page=${page}&limit=${limit}&_t=${ts}`
      );

      const response = await fetch(apiUrl, {
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      });

      if (!response.ok) throw new Error("Gagal mengambil data ringkasan");
      const result = await response.json();

      const mappedData = (result.data || []).map((item: any, index: number) => ({
        id: `${item.kdsatker}-${index}`,
        kodeKppn: item.kdkppn,
        kdkppn: item.kdkppn, // For RBAC filter compatibility
        kdkanwil: item.kdkanwil, // For RBAC filter compatibility
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
      }));
      
      // Apply RBAC filtering on the frontend
      const filteredData = filterDataByRole<RingkasanKanwilData>(mappedData);
      setRingkasanData(filteredData);
      setTotalRingkasan(result.total || mappedData.length);
      setGrandTotals(result.totals || null);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data ringkasan");
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedYear, selectedPeriode, selectedKppn, filterDataByRole, ringkasanPagination]);

  const fetchTransaksiData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const triwulan = selectedPeriode.replace("Q", "");
      let kppnParam = selectedKppn !== "all" ? `&kdkppn=${selectedKppn}` : "";
      
      let regionalParams = "";
      if (user?.role === "kanwil_djpb" && user.kdkanwil) {
        regionalParams = `&kdkanwil=${user.kdkanwil}`;
      } else if (user?.role === "kppn" && user.kdkppn) {
        regionalParams = `&kdkppn=${user.kdkppn}`;
      }

      const page = transaksiPagination.pageIndex + 1;
      const limit = transaksiPagination.pageSize;
      const ts = new Date().getTime();

      const apiUrl = apiPath(
        `/monev-kkp/direktorat/data-transaksi?tahun=${selectedYear}&triwulan=${triwulan}${kppnParam}${regionalParams}&page=${page}&limit=${limit}&_t=${ts}`
      );

      const response = await fetch(apiUrl, { credentials: "include" });
      if (!response.ok) throw new Error("Gagal mengambil data transaksi");
      const result = await response.json();

      setTransaksiData(result.data || []);
      setTotalTransaksi(result.total || 0);
      setGrandTotals(result.totals || null);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data transaksi");
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedYear, selectedPeriode, selectedKppn, transaksiPagination]);

  const fetchMonitoringData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const triwulan = selectedPeriode.replace("Q", "");
      const kppnParam = selectedKppn !== "all" ? `&kdkppn=${selectedKppn}` : "";
      let regionalParams = "";
      if (user?.role === "kanwil_djpb" && user.kdkanwil) {
        regionalParams = `&kdkanwil=${user.kdkanwil}`;
      } else if (user?.role === "kppn" && user.kdkppn) {
        regionalParams = `&kdkppn=${user.kdkppn}`;
      }
      const ts = new Date().getTime();
      const apiUrl = apiPath(
        `/monev-kkp/kanwil/monitoring-kppn?tahun=${selectedYear}&triwulan=${triwulan}${kppnParam}${regionalParams}&_t=${ts}`
      );
      const response = await fetch(apiUrl, { credentials: "include" });
      if (!response.ok) throw new Error("Gagal mengambil data monitoring");
      const result = await response.json();
      const mappedData = mapMonitoringRows(Array.isArray(result.data) ? result.data : []);
      const filteredData = filterDataByRole<MonitoringKppnData>(mappedData);
      setMonitoringData(filteredData);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data monitoring");
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedYear, selectedPeriode, selectedKppn, filterDataByRole]);

  const fetchKppnRefList = useCallback(async () => {
    if (!user) return;
    setIsLoadingKppnRef(true);
    try {
      const ts = new Date().getTime();
      
      // Add regional filter for KPPN reference list
      let regionalParams = "";
      if (user?.role === "kanwil_djpb" && user.kdkanwil) {
        regionalParams = `&kdkanwil=${user.kdkanwil}`;
      } else if (user?.role === "kppn" && user.kdkppn) {
        regionalParams = `&kdkppn=${user.kdkppn}`;
      }

      const response = await fetch(
        apiPath(`/monev-kkp/kanwil/ref-kppn?tahun=${selectedYear}${regionalParams}&_t=${ts}`),
        {
          credentials: "include",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
          },
        }
      );

      if (!response.ok) throw new Error("Gagal mengambil data referensi KPPN");
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
  }, [user, selectedYear]);

  useEffect(() => {
    if (contentType === "ringkasan") {
      fetchRingkasanData();
    } else if (contentType === "monitoring") {
      fetchMonitoringData();
    } else if (contentType === "transaksi") {
      fetchTransaksiData();
    }
  }, [contentType, fetchRingkasanData, fetchTransaksiData, selectedYear, selectedPeriode, selectedKppn, user, filterDataByRole]);

  useEffect(() => {
    fetchKppnRefList();
  }, [fetchKppnRefList]);

  const lastNotified = useRef("");
  useEffect(() => {
    const key = `${selectedYear}-${selectedPeriode}`;
    if (onPeriodeChange && lastNotified.current !== key) {
      lastNotified.current = key;
      onPeriodeChange(selectedYear, selectedPeriode);
    }
  }, [selectedYear, selectedPeriode, onPeriodeChange]);

  useEffect(() => {
    if (user?.id) {
      setSelectedKppn("all");
    }
  }, [user?.id]);

  const handleReset = useCallback(() => {
    setSelectedYear(String(prevYear));
    setSelectedKppn("all");
    setSelectedPeriode(`Q${prevQ}`);
    setRingkasanPagination({ pageIndex: 0, pageSize: 10 });
    setTransaksiPagination({ pageIndex: 0, pageSize: 10 });
  }, [prevYear, prevQ]);

  const resetLaporanKppn = useCallback(async (kdkppn: string, tahun: string, triwulan: string) => {
    try {
      const response = await fetch(apiPath("/monev-kkp/reset-laporan-kppn"), {
        method: "POST",
        credentials: "include",
        headers: {
          ...addCsrfToHeaders({}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kdkppn,
          tahun,
          triwulan: triwulan.replace("Q", ""),
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Gagal mengembalikan status laporan");
      }

      toast.success("Laporan berhasil dikembalikan");
      fetchMonitoringData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal mengembalikan status laporan");
    }
  }, [fetchMonitoringData]);

  return {
    ringkasanData,
    monitoringData,
    transaksiData,
    isLoading,
    selectedYear,
    setSelectedYear,
    selectedKppn,
    setSelectedKppn,
    selectedPeriode,
    setSelectedPeriode,
    kppnRefList,
    isLoadingKppnRef,
    handleReset,
    fetchRingkasanData,
    fetchTransaksiData,
    resetLaporanKppn,
    ringkasanPagination,
    setRingkasanPagination,
    totalRingkasan,
    transaksiPagination,
    setTransaksiPagination,
    totalTransaksi,
    grandTotals,
  };
};
