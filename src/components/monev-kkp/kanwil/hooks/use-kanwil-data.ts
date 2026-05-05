import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { apiPath } from "@/lib/config/base-path";
import { useAuth } from "@/hooks/useAuth";
import { addCsrfToHeaders } from "@/utils/csrf-utils";
import { RingkasanKanwilData, MonitoringKppnData } from "../types";

export const useKanwilData = (
  contentType: "ringkasan" | "monitoring",
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
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(String(prevYear));
  const [selectedKppn, setSelectedKppn] = useState("all");
  const [selectedPeriode, setSelectedPeriode] = useState(`Q${prevQ}`);
  const [kppnRefList, setKppnRefList] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingKppnRef, setIsLoadingKppnRef] = useState(false);

  const fetchRingkasanData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const triwulan = selectedPeriode.replace("Q", "");
      
      // Determine KPPN filter
      let kppnParam = selectedKppn !== "all" ? `&kdkppn=${selectedKppn}` : "";
      
      // Add regional filters based on user role to API call
      let regionalParams = "";
      if (user?.role === "kanwil_djpb" && user.kdkanwil) {
        regionalParams = `&kdkanwil=${user.kdkanwil}`;
      } else if (user?.role === "kppn" && user.kdkppn) {
        regionalParams = `&kdkppn=${user.kdkppn}`;
      }
      
      const ts = new Date().getTime();
      const apiUrl = apiPath(
        `/monev-kkp/kppn?tahun=${selectedYear}&triwulan=${triwulan}${kppnParam}${regionalParams}&_t=${ts}`
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

      const mappedData = result.data.map((item: any, index: number) => ({
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
      const filteredData = filterDataByRole(mappedData);
      setRingkasanData(filteredData);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data ringkasan");
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedYear, selectedPeriode, selectedKppn, filterDataByRole]);

  const fetchMonitoringData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const triwulan = selectedPeriode.replace("Q", "");
      
      // Determine KPPN filter
      let kppnParam = selectedKppn !== "all" ? `&kdkppn=${selectedKppn}` : "";
      
      // Add regional filters based on user role to API call
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

      const response = await fetch(apiUrl, {
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      });

      if (!response.ok) throw new Error("Gagal mengambil data monitoring");
      const result = await response.json();

      const mappedData = result.data.map((item: any) => ({
        id: item.kdkppn,
        kdkppn: item.kdkppn,
        kdkanwil: item.kdkanwil, // For RBAC filter compatibility
        nmkppn: item.nmkppn,
        jumlah_satker_up_kkp: Number(item.jumlah_satker_up_kkp || 0),
        jumlah_satker_transaksi: Number(item.jumlah_satker_transaksi || 0),
        nilai_transaksi: Number(item.nilai_transaksi || 0),
        status: String(item.sts_kirim_kppn || "").trim() === "1" ? "sent" : "not_sent",
        tanggalKirim: item.tgkirim_kppn || null,
      }));

      // Apply RBAC filtering on the frontend
      const filteredData = filterDataByRole(mappedData);
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
    } else {
      fetchMonitoringData();
    }
  }, [contentType, fetchRingkasanData, fetchMonitoringData]);

  useEffect(() => {
    fetchKppnRefList();
  }, [fetchKppnRefList]);

  useEffect(() => {
    if (onPeriodeChange) {
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
    fetchMonitoringData,
    resetLaporanKppn,
  };
};
