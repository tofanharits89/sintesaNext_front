import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { apiPath } from "@/lib/config/base-path";
import { useAuth } from "@/hooks/useAuth";
import { RingkasanKanwilData, MonitoringKppnData } from "../types";

export const useKanwilData = (
  contentType: "ringkasan" | "monitoring",
  onPeriodeChange?: (year: string, periode: string) => void
) => {
  const { user } = useAuth();
  
  const now = new Date();
  const defaultYear = "2026";
  const defaultPeriode = `Q${Math.ceil((now.getMonth() + 1) / 3)}`;

  const [ringkasanData, setRingkasanData] = useState<RingkasanKanwilData[]>([]);
  const [monitoringData, setMonitoringData] = useState<MonitoringKppnData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedKppn, setSelectedKppn] = useState("all");
  const [selectedPeriode, setSelectedPeriode] = useState(defaultPeriode);
  const [kppnRefList, setKppnRefList] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingKppnRef, setIsLoadingKppnRef] = useState(false);

  const fetchRingkasanData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const triwulan = selectedPeriode.replace("Q", "");
      const kppnParam = selectedKppn !== "all" ? `&kdkppn=${selectedKppn}` : "";
      const ts = new Date().getTime();
      const apiUrl = apiPath(
        `/monev-kkp/kppn?tahun=${selectedYear}&triwulan=${triwulan}${kppnParam}&_t=${ts}`
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
      setRingkasanData(mappedData);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data ringkasan");
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedYear, selectedPeriode, selectedKppn]);

  const fetchMonitoringData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const triwulan = selectedPeriode.replace("Q", "");
      const kppnParam = selectedKppn !== "all" ? `&kdkppn=${selectedKppn}` : "";
      const ts = new Date().getTime();
      const apiUrl = apiPath(
        `/monev-kkp/kanwil/monitoring-kppn?tahun=${selectedYear}&triwulan=${triwulan}${kppnParam}&_t=${ts}`
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
        nmkppn: item.nmkppn,
        jumlah_satker_up_kkp: Number(item.jumlah_satker_up_kkp || 0),
        jumlah_satker_transaksi: Number(item.jumlah_satker_transaksi || 0),
        nilai_transaksi: Number(item.nilai_transaksi || 0),
        status: String(item.sts_kirim_kppn || "").trim() === "1" ? "sent" : "not_sent",
        tanggalKirim: item.tgkirim_kppn || null,
      }));
      setMonitoringData(mappedData);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data monitoring");
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedYear, selectedPeriode, selectedKppn]);

  const fetchKppnRefList = useCallback(async () => {
    if (!user) return;
    setIsLoadingKppnRef(true);
    try {
      const ts = new Date().getTime();
      const response = await fetch(
        apiPath(`/monev-kkp/kanwil/ref-kppn?tahun=${selectedYear}&_t=${ts}`),
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
    setSelectedYear(defaultYear);
    setSelectedKppn("all");
    setSelectedPeriode(defaultPeriode);
  }, [defaultYear, defaultPeriode]);

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
  };
};
