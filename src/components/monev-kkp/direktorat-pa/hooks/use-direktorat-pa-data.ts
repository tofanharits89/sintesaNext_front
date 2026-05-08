import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { apiPath } from "@/lib/config/base-path";
import {
  RingkasanData,
  MonitoringKanwilData,
  MonitoringKppnData,
  TransaksiData,
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
  const [transaksiData, setTransaksiData] = useState<TransaksiData[]>([]);
  const [transaksiPagination, setTransaksiPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalTransaksi, setTotalTransaksi] = useState(0);
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

  const [ringkasanPagination, setRingkasanPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalRingkasan, setTotalRingkasan] = useState(0);
  const [grandTotals, setGrandTotals] = useState<any>(null);

  const fetchRingkasanData = useCallback(async () => {
    setIsLoading(true);
    try {
      const triwulan = selectedPeriode.replace("Q", "");
      let kppnParam = "";
      let kanwilParam = "";
      if (contentType === "ringkasan-kppn" && selectedKppn !== "all") {
        kppnParam = selectedKppn;
      }
      if (
        (contentType === "ringkasan-kanwil" ||
          contentType === "ringkasan-kppn") &&
        selectedKanwil !== "all"
      ) {
        kanwilParam = selectedKanwil;
      }

      const page = ringkasanPagination.pageIndex + 1;
      const limit = ringkasanPagination.pageSize;

      const { getKkpKppnData } = await import("@/features/monev-kkp/api/services");
      const result = await getKkpKppnData(
        selectedYear,
        triwulan,
        page,
        limit,
        kanwilParam || undefined,
        kppnParam || undefined
      );

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
      setTotalRingkasan(result.total);
      setGrandTotals(result.totals);
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
    ringkasanPagination,
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

  const fetchTransaksiData = useCallback(async () => {
    setIsLoading(true);
    try {
      const triwulan = selectedPeriode.replace("Q", "");
      let kppnParam = "";
      let kanwilParam = "";
      if (selectedKppn !== "all") {
        kppnParam = `&kdkppn=${selectedKppn}`;
      }
      if (selectedKanwil !== "all") {
        kanwilParam = `&kdkanwil=${selectedKanwil}`;
      }
      
      const page = transaksiPagination.pageIndex + 1;
      const limit = transaksiPagination.pageSize;
      
      const apiUrl = apiPath(
        `/monev-kkp/direktorat/data-transaksi?tahun=${selectedYear}&triwulan=${triwulan}${kanwilParam}${kppnParam}&page=${page}&limit=${limit}`,
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
  }, [selectedPeriode, selectedYear, selectedKanwil, selectedKppn, transaksiPagination]);

  const exportTransaksiToExcel = useCallback(async () => {
    try {
      const triwulan = selectedPeriode.replace("Q", "");
      let kppnParam = "";
      let kanwilParam = "";
      if (selectedKppn !== "all") {
        kppnParam = `&kdkppn=${selectedKppn}`;
      }
      if (selectedKanwil !== "all") {
        kanwilParam = `&kdkanwil=${selectedKanwil}`;
      }
      
      // Fetch a large amount to get "all" data
      const apiUrl = apiPath(
        `/monev-kkp/direktorat/data-transaksi?tahun=${selectedYear}&triwulan=${triwulan}${kanwilParam}${kppnParam}&page=1&limit=100000`,
      );

      toast.info("Sedang menyiapkan data Excel, harap tunggu...");
      const response = await fetch(apiUrl, { credentials: "include" });
      if (!response.ok) throw new Error("Gagal mengambil data untuk export");
      const result = await response.json();
      const data = result.data || [];

      if (data.length === 0) {
        toast.error("Tidak ada data untuk diunduh");
        return;
      }

      // Dynamic import XLSX for better bundle size
      const XLSX = await import("xlsx");
      
      const excelData = data.map((item: any, index: number) => ({
        "No": index + 1,
        "Nama Kanwil": item.nmlokasi,
        "Nama KPPN": item.nmkppn,
        "Kode Satker": item.kdsatker,
        "Nama Satker": item.nmsatker,
        "Jumlah Transaksi (BAST)": item.jml_transaksi || 0,
        "Tanggal SPM": item.tg_spm ? new Date(item.tg_spm).toLocaleDateString('id-ID') : '-',
        "Nomor SPM": item.no_spm || '-',
        "Tanggal SP2D": item.tg_sp2d ? new Date(item.tg_sp2d).toLocaleDateString('id-ID') : '',
        "Nomor SP2D": item.no_sp2d,
        "Nilai Transaksi KKP (Rp)": Math.round(Number(item.nilai_transaksi || 0)),
        "Total Transaksi KKP (Rp)": Math.round(Number(item.nilai_transaksi || 0)),
        "Jenis SPM/SP2D": item.jns_kkp_prinsipal,
        "Program/Kegiatan/Output/Akun": `${item.kdprogram || 'XX'}.${item.kdgiat || 'XXXX'}.${item.kdoutput || 'XXX'}.${item.kdakun}`,
        "Kode Akun": item.kdakun,
        "Nama Akun": item.nmakun
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Apply accounting number format to Nilai and Total columns (Indices 10 and 11)
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const cellK = worksheet[XLSX.utils.encode_cell({ r: R, c: 10 })];
        if (cellK) {
          cellK.t = 'n';
          cellK.z = '#,##0';
        }
        
        const cellL = worksheet[XLSX.utils.encode_cell({ r: R, c: 11 })];
        if (cellL) {
          cellL.t = 'n';
          cellL.z = '#,##0';
        }
      }

      // Set column widths for better readability
      worksheet['!cols'] = [
        { wch: 6 },   // No
        { wch: 25 },  // Nama Kanwil
        { wch: 25 },  // Nama KPPN
        { wch: 12 },  // Kode Satker
        { wch: 35 },  // Nama Satker
        { wch: 22 },  // Jumlah Transaksi (BAST)
        { wch: 15 },  // Tanggal SPM
        { wch: 20 },  // Nomor SPM
        { wch: 15 },  // Tanggal SP2D
        { wch: 20 },  // Nomor SP2D
        { wch: 25 },  // Nilai Transaksi KKP (Rp)
        { wch: 25 },  // Total Transaksi KKP (Rp)
        { wch: 20 },  // Jenis SPM/SP2D
        { wch: 30 },  // Program/Kegiatan/Output/Akun
        { wch: 12 },  // Kode Akun
        { wch: 30 }   // Nama Akun
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Transaksi KKP");
      
      const fileName = `Data_Transaksi_KKP_${selectedYear}_${selectedPeriode}_${new Date().getTime()}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success("Data berhasil diunduh");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengunduh data Excel");
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
    } else if (contentType === "data-transaksi") {
      fetchTransaksiData();
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
    fetchTransaksiData,
  ]);

  useEffect(() => {
    setTransaksiPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setRingkasanPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [selectedYear, selectedPeriode, selectedKanwil, selectedKppn]);

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
    transaksiData,
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
    fetchTransaksiData,
    exportTransaksiToExcel,
    transaksiPagination,
    setTransaksiPagination,
    totalTransaksi,
    ringkasanPagination,
    setRingkasanPagination,
    totalRingkasan,
    grandTotals,
  };
};
