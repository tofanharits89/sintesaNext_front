import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { apiPath } from "@/lib/config/base-path";
import {
  RingkasanData,
  MonitoringKanwilData,
  MonitoringKppnData,
} from "../types";

export const useDirektoratPaData = (contentType: string) => {
  const { user } = useAuth();

  // Get default periode selection: previous triwulan from current date
  const getInitialPeriode = () => {
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

    return {
      year: String(prevYear),
      periode: `Q${prevQ}`,
    };
  };

  const initial = getInitialPeriode();
  const defaultYear = initial.year;
  const defaultPeriode = initial.periode;

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
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [kppnRefList, setKppnRefList] = useState<
    { value: string; label: string }[]
  >([]);
  const [isLoadingKppnRef, setIsLoadingKppnRef] = useState(false);
  const [kanwilRefList, setKanwilRefList] = useState<
    { value: string; label: string }[]
  >([]);
  const [isLoadingKanwilRef, setIsLoadingKanwilRef] = useState(false);

  const fetchRingkasanData = useCallback(async () => {
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
          jmlKartuUsul:
            item.jml_kartu_usul !== undefined && item.jml_kartu_usul !== null
              ? Number(item.jml_kartu_usul)
              : null,
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
  }, [
    contentType,
    selectedPeriode,
    selectedYear,
    selectedKanwil,
    selectedKppn,
  ]);

  const fetchMonitoringKanwilData = useCallback(async () => {
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
  }, [selectedPeriode, selectedYear, selectedKanwil]);

  const fetchMonitoringKppnData = useCallback(async () => {
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
  }, [selectedPeriode, selectedYear, selectedKanwil, selectedKppn]);

  const fetchKppnRefList = useCallback(async (kdkanwil?: string) => {
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
  }, []);

  const fetchKanwilRefList = useCallback(async (tahun?: string) => {
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
  }, []);

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
    fetchRingkasanData,
    fetchMonitoringKanwilData,
    fetchMonitoringKppnData,
  ]);

  useEffect(() => {
    if (!user) return;
    fetchKanwilRefList(selectedYear);
    fetchKppnRefList(selectedKanwil);
  }, [user, selectedYear, selectedKanwil, fetchKanwilRefList, fetchKppnRefList]);

  const handleKanwilChange = (value: string) => {
    setSelectedKanwil(value);
    setSelectedKppn("all");
    fetchKppnRefList(value);
  };

  const handleReset = () => {
    setSelectedYear(defaultYear);
    setSelectedKanwil("all");
    setSelectedKppn("all");
    setSelectedPeriode(defaultPeriode);
    setSelectedStatus("all");
  };

  return {
    ringkasanData,
    monitoringKanwilData,
    monitoringKppnData,
    isLoading,
    selectedYear,
    setSelectedYear,
    selectedKanwil,
    handleKanwilChange,
    selectedKppn,
    setSelectedKppn,
    selectedPeriode,
    setSelectedPeriode,
    selectedStatus,
    setSelectedStatus,
    handleReset,
    kanwilRefList,
    isLoadingKanwilRef,
    kppnRefList,
    isLoadingKppnRef,
    fetchRingkasanData,
  };
};
