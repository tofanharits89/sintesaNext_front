import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { apiPath } from "@/lib/config/base-path";
import { apiClient } from "@/lib/api/httpClient";
import { useAuth } from "@/hooks/useAuth";
import { addCsrfToHeaders } from "@/utils/csrf-utils";
import { KkpData } from "../../kppn-content";
import { TransaksiData } from "../../kanwil/types";

export const useKppnData = (
  contentType: "ringkasan" | "transaksi",
  onPeriodeChange?: (year: string, periode: string) => void
) => {
  const { user } = useAuth();
  
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

  const [ringkasanData, setRingkasanData] = useState<KkpData[]>([]);
  const [transaksiData, setTransaksiData] = useState<TransaksiData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(String(prevYear));
  const [selectedPeriode, setSelectedPeriode] = useState(`Q${prevQ}`);

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
      const ts = new Date().getTime();
      
      const page = ringkasanPagination.pageIndex + 1;
      const limit = ringkasanPagination.pageSize;

      const kdkppnParam = user.kdkppn || "all";
      const url = `/monev-kkp/kppn?tahun=${selectedYear}&triwulan=${triwulan}&kdkppn=${kdkppnParam}&page=${page}&limit=${limit}&_t=${ts}`;

      const result = await apiClient.get(url);
      
      if (!result) throw new Error("Gagal mengambil data ringkasan");

      const mappedData: KkpData[] = (result.data || []).map((item: any, index: number) => ({
        id: `${item.kdsatker}-${index}`,
        kodeBA: item.kddept,
        kodeSatker: item.kdsatker,
        namaSatker: item.nmsatker,
        kdkppn: item.kdkppn,
        nmkppn: item.nmkppn,
        kdkanwil: item.kdkanwil,
        nmkanwil: item.nmkanwil,
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

      setRingkasanData(mappedData);
      setTotalRingkasan(result.total || mappedData.length);
      setGrandTotals(result.totals || null);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data ringkasan");
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedYear, selectedPeriode, ringkasanPagination]);

  const fetchTransaksiData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const triwulan = selectedPeriode.replace("Q", "");
      const page = transaksiPagination.pageIndex + 1;
      const limit = transaksiPagination.pageSize;
      const ts = new Date().getTime();

      const url = `/monev-kkp/direktorat/data-transaksi?tahun=${selectedYear}&triwulan=${triwulan}&kdkppn=${user.kdkppn || "all"}&page=${page}&limit=${limit}&_t=${ts}`;

      const result = await apiClient.get(url);
      
      if (!result) throw new Error("Gagal mengambil data transaksi");

      setTransaksiData(result.data || []);
      setTotalTransaksi(result.total || 0);
      setGrandTotals(result.totals || null);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data transaksi");
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedYear, selectedPeriode, transaksiPagination]);

  useEffect(() => {
    if (contentType === "ringkasan") {
      fetchRingkasanData();
    } else {
      fetchTransaksiData();
    }
  }, [contentType, fetchRingkasanData, fetchTransaksiData]);

  const lastNotified = useRef("");
  useEffect(() => {
    const key = `${selectedYear}-${selectedPeriode}`;
    if (onPeriodeChange && lastNotified.current !== key) {
      lastNotified.current = key;
      onPeriodeChange(selectedYear, selectedPeriode);
    }
  }, [selectedYear, selectedPeriode, onPeriodeChange]);

  const handleReset = useCallback(() => {
    setSelectedYear(String(prevYear));
    setSelectedPeriode(`Q${prevQ}`);
    setRingkasanPagination({ pageIndex: 0, pageSize: 10 });
    setTransaksiPagination({ pageIndex: 0, pageSize: 10 });
  }, [prevYear, prevQ]);

  return {
    ringkasanData,
    transaksiData,
    isLoading,
    selectedYear,
    setSelectedYear,
    selectedPeriode,
    setSelectedPeriode,
    handleReset,
    fetchRingkasanData,
    fetchTransaksiData,
    ringkasanPagination,
    setRingkasanPagination,
    totalRingkasan,
    transaksiPagination,
    setTransaksiPagination,
    totalTransaksi,
    grandTotals,
  };
};
