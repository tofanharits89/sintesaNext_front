"use client";

import { TableSkeleton } from "@/components/ui/skeleton-loader";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { http } from "@/lib/api/httpClient";
import { cn } from "@/lib/utils";
import {
  Loader2,
  CheckSquare,
  Pencil,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import numeral from "numeral";
import RekamUpaya from "./modalrekamUpaya";
import Rekam from "./modalrekam";
import kdkanwilJson from "@/data/kdkanwil.json";
import Papa from "papaparse";
import moment from "moment";
import { toast } from "sonner";

// Placeholder Encrypt function - replace with actual import if available
// This should match the backend expectation.
// If specific encryption is needed, it must be implemented here using a library like crypto-js.
const Encrypt = (text: string) => {
  if (typeof window !== "undefined") {
    return window.btoa(text); // Base64 encoding as placeholder
  }
  return text;
};

export default function Harmonisasi() {
  const { user } = useAuth();
  const role = user?.role;
  const userKdkanwil = user?.kdkanwil;
  const username = user?.username;

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showModalUpaya, setShowModalUpaya] = useState(false);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(25);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);

  // State for Rekam Modal
  const [idCluster, setId] = useState<string | number | null>(null);
  const [jenisCluster, setJenisCluster] = useState<number | null>(null);
  const [revisi_anggaran, setRevisi_anggaran] = useState("");
  const [blokir_anggaran, setBlokir_anggaran] = useState("");
  const [automatic_adjustment, setAutomatic_adjustment] = useState("");
  const [halaman_3_dipa, setHalaman_3_dipa] = useState("");
  const [sdana_sbsn, setSdana_sbsn] = useState("");
  const [lainnya_anggaran, setLainnya_anggaran] = useState("");

  const [proses_lelang, setProses_lelang] = useState("");
  const [lelang_dini, setLelang_dini] = useState("");
  const [gagal_lelang, setGagal_lelang] = useState("");
  const [keterbatasan_penyedia, setKeterbatasan_penyedia] = useState("");
  const [tkdn, setTkdn] = useState("");
  const [ecatalog, setEcatalog] = useState("");
  const [lainnya_pbj, setLainnya_pbj] = useState("");

  const [kekurangan_prasyarat, setKekurangan_prasyarat] = useState("");
  const [prasyarat_lahan, setPrasyarat_lahan] = useState("");
  const [faktor_cuaca, setFaktor_cuaca] = useState("");
  const [kesiapan_pedum, setKesiapan_pedum] = useState("");
  const [penerimaan_bantuan, setPenerimaan_bantuan] = useState("");
  const [pembagian_bantuan, setPembagian_bantuan] = useState("");
  const [kenaikan_harga, setKenaikan_harga] = useState("");
  const [lainnya_eksekusi, setLainnya_eksekusi] = useState("");

  const [regulasi_kemenkeu, setRegulasi_kemenkeu] = useState("");
  const [regulasi_kl, setRegulasi_kl] = useState("");
  const [regulasi_pemda, setRegulasi_pemda] = useState("");
  const [lainnya_regulasi, setLainnya_regulasi] = useState("");

  const [pergantian_pejabat, setPergantian_pejabat] = useState("");
  const [kekurangan_sdm, setKekurangan_sdm] = useState("");
  const [pemahaman_aplikasi, setPemahaman_aplikasi] = useState("");
  const [lainnya_sdm, setLainnya_sdm] = useState("");

  const [kanwil, setKanwil] = useState("00");
  const [namaBidang, setNamaBidang] = useState("00");
  const [namaThang, setNamaThang] = useState("2025");
  const [namaSemester, setNamaSemester] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [sql, setSql] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [export2, setExport2] = useState(false);

  // Derive unique kanwil options from JSON
  const kanwilOptions = useMemo(() => {
    // Assuming kdkanwilJson is an array of objects
    const typedJson = kdkanwilJson as { kdkanwil: string; nmkanwil: string }[];
    const uniqueKanwils = new Map();
    typedJson.forEach((item) => {
      if (!uniqueKanwils.has(item.kdkanwil)) {
        uniqueKanwils.set(item.kdkanwil, item.nmkanwil);
      }
    });
    return Array.from(uniqueKanwils.entries())
      .map(([kd, nm]) => ({
        kdkanwil: kd,
        nmkanwil: nm,
      }))
      .sort((a, b) => a.kdkanwil.localeCompare(b.kdkanwil));
  }, []);

  useEffect(() => {
    // If role is kanwil, lock the kanwil selection
    if (role === "kanwil_djpb" && userKdkanwil) {
      setKanwil(userKdkanwil);
    }
  }, [role, userKdkanwil]);

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, kanwil, namaBidang, namaThang, namaSemester, searchQuery]);

  // Debounced search could be implemented here, but keeping it simple for now as requested

  const getSqlQuery = () => {
    const kanwilFilter = kanwil === "00" ? "" : `a.kdkanwil = '${kanwil}'`;
    const bidangFilter =
      namaBidang === "00" ? "" : `a.bidang_dak = '${namaBidang}'`;
    const semesterFilter =
      namaSemester === "1" ? "a.semester='1'" : `a.semester = '2'`;
    const thangFilter =
      namaThang === "2025" ? "a.thang='2025'" : `a.thang = '2024'`;

    const whereClause = [
      kanwilFilter,
      bidangFilter,
      thangFilter,
      semesterFilter,
    ]
      .filter(Boolean)
      .concat(
        searchQuery
          ? [
            `(a.kdsatker LIKE '%${searchQuery}%'
          or a.nmsatker LIKE '%${searchQuery}%'
          or a.kdkabkota LIKE '%${searchQuery}%'
          or c.nmkabkota LIKE '%${searchQuery}%'
          or a.ursoutput LIKE '%${searchQuery}%'
          or a.jenis_tkd LIKE '%${searchQuery}%')`,
          ]
          : []
      )
      .concat(role === "kanwil_djpb" ? [`a.kdkanwil = '${userKdkanwil}'`] : [])
      .join(" AND ");

    let query = "";
    if (namaThang === "2025" && namaSemester === "1") {
      query = `SELECT a.id,a.thang,a.semester,a.kddept, a.kdsatker, a.nmsatker, a.bidang_dak, a.jenis_tkd, a.kdkabkota,
      a.kdlokasi, c.nmkabkota, a.kdprogram, a.kdgiat, a.kdoutput, a.kdsoutput, a.ursoutput, a.sat,
      a.vol, a.pagu, a.real1, a.real2, a.real3, a.real4, a.real5, a.real6, a.realfisik1, a.realfisik2, a.realfisik3, a.realfisik4, a.realfisik5, a.realfisik6,
      CONCAT(a.kdprogram,'.',a.kdgiat,'.',a.kdoutput,'.',a.kdsoutput) AS coa, a.revisi_anggaran, a.blokir_anggaran, a.automatic_adjustment, 
      a.halaman_3_dipa, a.sdana_sbsn, a.lainnya_anggaran, a.proses_lelang, a.lelang_dini, a.gagal_lelang, a.keterbatasan_penyedia, a.tkdn, a.ecatalog, a.lainnya_pbj, a.kekurangan_prasyarat,
      a.prasyarat_lahan, a.faktor_cuaca, a.kesiapan_pedum, a.penerimaan_bantuan, a.pembagian_bantuan, a.kenaikan_harga, a.lainnya_eksekusi, a.regulasi_kemenkeu, a.regulasi_kl,
      a.regulasi_pemda, a.lainnya_regulasi, a.pergantian_pejabat, a.kekurangan_sdm, a.pemahaman_aplikasi, a.lainnya_sdm
      FROM monev2025.pagu_output_2025_new_harmonis_smt1 a
      LEFT JOIN dbref.t_lokasi_2025 b ON a.kdlokasi=b.kdlokasi
      LEFT JOIN dbref.t_kabkota_2025 c ON a.kdlokasi=c.kdlokasi AND a.kdkabkota=c.kdkabkota
      ${whereClause ? `WHERE ${whereClause}` : ""}
      ORDER BY bidang_dak, kdlokasi ASC, pagu DESC, persen_real6 ASC`;
    } else if (namaThang === "2025" && namaSemester === "2") {
      query = `SELECT a.id,a.thang,a.semester,a.kddept, a.kdsatker, a.nmsatker, a.bidang_dak, a.jenis_tkd, a.kdkabkota,
      a.kdlokasi, c.nmkabkota, a.kdprogram, a.kdgiat, a.kdoutput, a.kdsoutput, a.ursoutput, a.sat,
      a.vol, a.pagu, a.real7, a.real8, a.real9, a.real10, a.real11, a.real12, a.realfisik7, a.realfisik8, a.realfisik9, a.realfisik10, a.realfisik11, a.realfisik12,
      CONCAT(a.kdprogram,'.',a.kdgiat,'.',a.kdoutput,'.',a.kdsoutput) AS coa, a.revisi_anggaran, a.blokir_anggaran, a.automatic_adjustment, 
      a.halaman_3_dipa, a.sdana_sbsn, a.lainnya_anggaran, a.proses_lelang, a.lelang_dini, a.gagal_lelang, a.keterbatasan_penyedia, a.tkdn, a.ecatalog, a.lainnya_pbj, a.kekurangan_prasyarat,
      a.prasyarat_lahan, a.faktor_cuaca, a.kesiapan_pedum, a.penerimaan_bantuan, a.pembagian_bantuan, a.kenaikan_harga, a.lainnya_eksekusi, a.regulasi_kemenkeu, a.regulasi_kl,
      a.regulasi_pemda, a.lainnya_regulasi, a.pergantian_pejabat, a.kekurangan_sdm, a.pemahaman_aplikasi, a.lainnya_sdm
      FROM monev2025.pagu_output_2025_new_harmonis_smt1 a
      LEFT JOIN dbref.t_lokasi_2025 b ON a.kdlokasi=b.kdlokasi
      LEFT JOIN dbref.t_kabkota_2025 c ON a.kdlokasi=c.kdlokasi AND a.kdkabkota=c.kdkabkota
      ${whereClause ? `WHERE ${whereClause}` : ""}
      ORDER BY bidang_dak, kdlokasi ASC, pagu DESC, persen_real9 ASC`;
    } else if (namaThang === "2026") {
      query = `SELECT a.id,a.thang,a.semester,a.kddept, a.kdsatker, a.nmsatker, a.bidang_dak, a.jenis_tkd, a.kdkabkota,
      a.kdlokasi, c.nmkabkota, a.kdprogram, a.kdgiat, a.kdoutput, a.kdsoutput, a.ursoutput, a.sat,
      a.vol, a.pagu, a.real1, a.real2, a.real3, a.real4, a.real5, a.real6, a.realfisik1, a.realfisik2, a.realfisik3, a.realfisik4, a.realfisik5, a.realfisik6,
      CONCAT(a.kdprogram,'.',a.kdgiat,'.',a.kdoutput,'.',a.kdsoutput) AS coa, a.revisi_anggaran, a.blokir_anggaran, a.automatic_adjustment, 
      a.halaman_3_dipa, a.sdana_sbsn, a.lainnya_anggaran, a.proses_lelang, a.lelang_dini, a.gagal_lelang, a.keterbatasan_penyedia, a.tkdn, a.ecatalog, a.lainnya_pbj, a.kekurangan_prasyarat,
      a.prasyarat_lahan, a.faktor_cuaca, a.kesiapan_pedum, a.penerimaan_bantuan, a.pembagian_bantuan, a.kenaikan_harga, a.lainnya_eksekusi, a.regulasi_kemenkeu, a.regulasi_kl,
      a.regulasi_pemda, a.lainnya_regulasi, a.pergantian_pejabat, a.kekurangan_sdm, a.pemahaman_aplikasi, a.lainnya_sdm
      FROM monev2025.pagu_output_2026_new_harmonis_smt1 a
      LEFT JOIN dbref.t_lokasi_2025 b ON a.kdlokasi=b.kdlokasi
      LEFT JOIN dbref.t_kabkota_2025 c ON a.kdlokasi=c.kdlokasi AND a.kdkabkota=c.kdkabkota
      ${whereClause ? `WHERE ${whereClause}` : ""}
      ORDER BY bidang_dak, kdlokasi ASC, pagu DESC, persen_real6 ASC`;
    }
    return query;
  };

  const getData = async () => {
    setLoading(true);
    const query = getSqlQuery();
    if (!query) {
      setLoading(false);
      return;
    }

    const encodedQuery = encodeURIComponent(query);
    const cleanedQuery = decodeURIComponent(encodedQuery)
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    setSql(cleanedQuery);

    const encryptedQuery = Encrypt(cleanedQuery);

    try {
      const tayangHarmonisasiUrl = process.env.NEXT_PUBLIC_TAYANG_HARMONISASI;
      // Fetch all data for client-side pagination
      const fetchLimit = 100000;
      const url = tayangHarmonisasiUrl
        ? `${tayangHarmonisasiUrl}${encodeURIComponent(encryptedQuery)}&limit=${fetchLimit}&page=0&user=${username}`
        : "";

      if (!url) {
        console.error("URL API Harmonisasi tidak ditemukan");
        setLoading(false);
        return;
      }

      const response: any = await http.get(url);
      const resultData = response.data.result || [];

      // Client-side pagination logic
      const totalCount = resultData.length;
      const totalPages = Math.ceil(totalCount / limit);

      setData(resultData);
      setPages(totalPages);
      setRows(totalCount);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      const message =
        error.response?.data?.error ||
        "Terjadi Permasalahan Koneksi atau Server Backend";
      toast.error(message);
    }
  };

  const handleExport = async () => {
    setLoadingStatus(true);
    const query = getSqlQuery();
    if (!query) {
      toast.warning("Query tidak valid");
      setLoadingStatus(false);
      return;
    }

    const encodedQuery = encodeURIComponent(query);
    const cleanedQuery = decodeURIComponent(encodedQuery)
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const encryptedQuery = Encrypt(cleanedQuery);

    try {
      const tayangHarmonisasiUrl = process.env.NEXT_PUBLIC_TAYANG_HARMONISASI;
      // High limit to fetch all
      const url = tayangHarmonisasiUrl
        ? `${tayangHarmonisasiUrl}${encodeURIComponent(encryptedQuery)}&limit=1000000&page=0&user=${username}`
        : "";

      if (!url) {
        toast.error("URL API Harmonisasi tidak ditemukan");
        setLoadingStatus(false);
        return;
      }

      const response: any = await http.get(url);
      const resultData = response.data.result;

      if (!resultData || resultData.length === 0) {
        toast.warning("Tidak ada data untuk diekspor");
        setLoadingStatus(false);
        return;
      }

      // Convert to CSV
      const csv = Papa.unparse(resultData, { delimiter: ";" });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const downloadUrl = URL.createObjectURL(blob);
      link.href = downloadUrl;
      link.download = `harmonisasi_${namaThang}_${moment().format("YYYYMMDD_HHmmss")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error: any) {
      console.error(error);
      const message =
        error.response?.data?.error || "Gagal mengunduh data";
      toast.error(message);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleRekam = (item: any) => {
    // Mapping item properties to state
    // Note: The logic here is simplified from original to just set state.
    // In original, it passes explicit object. We can simulate that.
    // Determine 'jenis' based on which bucket logic was called.
    // However, the original code had distinct onClick handlers for distinct columns passing a 'jenis' ID.
    // We will handle that in the render loop by passing the data directly.
  };

  const handleOpenRekam = (row: any, jenis: number) => {
    setId(row.id);
    setJenisCluster(jenis);

    setRevisi_anggaran(row.revisi_anggaran);
    setBlokir_anggaran(row.blokir_anggaran);
    setAutomatic_adjustment(row.automatic_adjustment);
    setHalaman_3_dipa(row.halaman_3_dipa);
    setSdana_sbsn(row.sdana_sbsn);
    setLainnya_anggaran(row.lainnya_anggaran);

    setProses_lelang(row.proses_lelang);
    setLelang_dini(row.lelang_dini);
    setGagal_lelang(row.gagal_lelang);
    setKeterbatasan_penyedia(row.keterbatasan_penyedia);
    setTkdn(row.tkdn);
    setEcatalog(row.ecatalog);
    setLainnya_pbj(row.lainnya_pbj);

    setKekurangan_prasyarat(row.kekurangan_prasyarat);
    setPrasyarat_lahan(row.prasyarat_lahan);
    setFaktor_cuaca(row.faktor_cuaca);
    setKesiapan_pedum(row.kesiapan_pedum);
    setPenerimaan_bantuan(row.penerimaan_bantuan);
    setPembagian_bantuan(row.pembagian_bantuan);
    setKenaikan_harga(row.kenaikan_harga);
    setLainnya_eksekusi(row.lainnya_eksekusi);

    setRegulasi_kemenkeu(row.regulasi_kemenkeu);
    setRegulasi_kl(row.regulasi_kl);
    setRegulasi_pemda(row.regulasi_pemda);
    setLainnya_regulasi(row.lainnya_regulasi);

    setPergantian_pejabat(row.pergantian_pejabat);
    setKekurangan_sdm(row.kekurangan_sdm);
    setPemahaman_aplikasi(row.pemahaman_aplikasi);
    setLainnya_sdm(row.lainnya_sdm);

    setShowModal(true);
  };

  const handleRekamUpaya = () => {
    setShowModalUpaya(true);
  };

  const handleCloseModalUpaya = () => {
    setShowModalUpaya(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    // getData(); // Optional: reload data? Original had it commented out then not..

    // Reset states
    setId(null);
    setJenisCluster(null);
    setRevisi_anggaran("");
    setBlokir_anggaran("");
    setAutomatic_adjustment("");
    setHalaman_3_dipa("");
    setSdana_sbsn("");
    setLainnya_anggaran("");

    // ... reset all others ...
    // To save space, assuming reset is handled effectively by overwriting on next open
  };

  const handleSaveSuccess = async () => {
    handleCloseModal();
    await getData();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      setKanwil("00");
      setNamaBidang("00");
    }
  };

  const StatusIcon = ({
    active,
    onClick,
  }: {
    active: boolean;
    onClick: () => void;
  }) => (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer flex justify-center transition-colors duration-150",
        active ? "text-green-600" : "text-yellow-500"
      )}
    >
      <CheckSquare className="h-4 w-4" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Harmonisasi Belanja K/L & TKD</h1>
          <p className="text-sm text-muted-foreground">
            Harmonisasi Perencanaan dan Penganggaran Belanja K/L dan TKD
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            className="w-32 gap-2"
            onClick={() => handleRekamUpaya()}
          >
            <Pencil className="h-4 w-4" />
            Upaya
          </Button>

          <Button
            variant="outline"
            size="icon"
            disabled={loadingStatus}
            onClick={() => {
              handleExport();
            }}
          >
            {loadingStatus ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <section className="flex flex-col gap-4">

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Tahun</label>
                <Select value={namaThang} onValueChange={setNamaThang}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Semester</label>
                <Select value={namaSemester} onValueChange={setNamaSemester}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Semester I</SelectItem>
                    <SelectItem value="2">Semester II</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Kode Kanwil</label>
                <Select
                  value={kanwil}
                  onValueChange={setKanwil}
                  disabled={role === "kanwil_djpb"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua Kanwil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="00">00 - Semua Kanwil</SelectItem>
                    {kanwilOptions.map((opt) => (
                      <SelectItem key={opt.kdkanwil} value={opt.kdkanwil}>
                        {opt.kdkanwil} - {opt.nmkanwil}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Nama Bidang</label>
                <Select value={namaBidang} onValueChange={setNamaBidang}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua Bidang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="00">Semua Bidang</SelectItem>
                    <SelectItem value="Ketahanan Pangan">
                      Ketahanan Pangan
                    </SelectItem>
                    <SelectItem value="Pendidikan">Pendidikan</SelectItem>
                    <SelectItem value="Kesehatan">Kesehatan</SelectItem>
                    <SelectItem value="Jalan">Jalan</SelectItem>
                    <SelectItem value="Sanitasi">Sanitasi</SelectItem>
                    <SelectItem value="Air Minum">Air Minum</SelectItem>
                    <SelectItem value="Irigasi">Irigasi</SelectItem>
                    <SelectItem value="Infrastruktur">Infrastruktur</SelectItem>
                    <SelectItem value="Perumahan">Perumahan</SelectItem>
                    <SelectItem value="Perlindungan Perempuan dan Anak">
                      Perlindungan Perempuan dan Anak
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Pencarian</label>
                <Input
                  type="text"
                  placeholder="Cari..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>


            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Harmonisasi</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton />
            ) : (
              <div className="rounded-md border">
                <Table className="text-xs">
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead rowSpan={2} className="text-center whitespace-nowrap">
                        No
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        Nama Satker
                      </TableHead>
                      <TableHead rowSpan={2} className="text-center whitespace-nowrap">
                        Bidang
                      </TableHead>
                      <TableHead rowSpan={2} className="text-center whitespace-nowrap">
                        Jenis TKD
                      </TableHead>
                      <TableHead rowSpan={2} className="text-center whitespace-nowrap">
                        Lokasi/Kabkota
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        COA
                      </TableHead>
                      <TableHead rowSpan={2} className="text-center whitespace-nowrap">
                        Nama RO
                      </TableHead>
                      <TableHead rowSpan={2} className="text-center whitespace-nowrap">
                        Satuan/Vol
                      </TableHead>
                      <TableHead rowSpan={2} className="text-center whitespace-nowrap">
                        Pagu
                      </TableHead>
                      <TableHead colSpan={6} className="text-center whitespace-nowrap">
                        Realisasi (Rupiah)
                      </TableHead>
                      <TableHead colSpan={6} className="text-center whitespace-nowrap">
                        RVRO (Volume)
                      </TableHead>
                      <TableHead colSpan={5} className="text-center whitespace-nowrap">
                        Cluster Tantangan/Hambatan
                      </TableHead>
                    </TableRow>
                    <TableRow>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <TableHead key={`real-${i}`} className="text-center whitespace-nowrap">
                          {namaSemester === "1"
                            ? ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun"][i]
                            : ["Jul", "Ags", "Sep", "Okt", "Nov", "Des"][i]}
                        </TableHead>
                      ))}
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <TableHead key={`phy-${i}`} className="text-center whitespace-nowrap">
                          {namaSemester === "1"
                            ? ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun"][i]
                            : ["Jul", "Ags", "Sep", "Okt", "Nov", "Des"][i]}
                        </TableHead>
                      ))}
                      <TableHead className="text-center whitespace-nowrap">Penganggaran</TableHead>
                      <TableHead className="text-center whitespace-nowrap">PBJ</TableHead>
                      <TableHead className="text-center whitespace-nowrap">Eksekusi</TableHead>
                      <TableHead className="text-center whitespace-nowrap">Regulasi</TableHead>
                      <TableHead className="text-center whitespace-nowrap">SDM</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.slice(page * limit, (page + 1) * limit).length > 0 ? (
                      data.slice(page * limit, (page + 1) * limit).map((row: any, index: number) => (
                        <TableRow key={row.id}>
                          <TableCell className="text-center whitespace-nowrap">
                            {index + 1 + page * limit}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {row.nmsatker} ({row.kddept}.{row.kdsatker})
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap">{row.bidang_dak}</TableCell>
                          <TableCell className="text-center whitespace-nowrap">{row.jenis_tkd}</TableCell>
                          <TableCell className="text-center whitespace-nowrap">
                            {row.kdlokasi} - {row.nmkabkota}
                          </TableCell>
                          <TableCell className="text-center select-none">{row.coa}</TableCell>
                          <TableCell className="whitespace-nowrap">{row.ursoutput}</TableCell>
                          <TableCell className="text-center whitespace-nowrap">
                            {row.sat} - {numeral(row.vol).format("0,0")}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">
                            {numeral(row.pagu).format("0,0")}
                          </TableCell>

                          {/* Realisation Rupiah */}
                          < TableCell className="text-right font-mono tabular-nums whitespace-nowrap" >
                            {
                              numeral(
                                namaSemester === "1" ? row.real1 : row.real7
                              ).format("0,0")}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">
                            {numeral(
                              namaSemester === "1" ? row.real2 : row.real8
                            ).format("0,0")}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">
                            {numeral(
                              namaSemester === "1" ? row.real3 : row.real9
                            ).format("0,0")}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">
                            {numeral(
                              namaSemester === "1" ? row.real4 : row.real10
                            ).format("0,0")}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">
                            {numeral(
                              namaSemester === "1" ? row.real5 : row.real11
                            ).format("0,0")}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">
                            {numeral(
                              namaSemester === "1" ? row.real6 : row.real12
                            ).format("0,0")}
                          </TableCell>

                          {/* Realisation Fisik */}
                          <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">
                            {numeral(
                              namaSemester === "1" ? row.realfisik1 : row.realfisik7
                            ).format("0,0")}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">
                            {numeral(
                              namaSemester === "1" ? row.realfisik2 : row.realfisik8
                            ).format("0,0")}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">
                            {numeral(
                              namaSemester === "1" ? row.realfisik3 : row.realfisik9
                            ).format("0,0")}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">
                            {numeral(
                              namaSemester === "1" ? row.realfisik4 : row.realfisik10
                            ).format("0,0")}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">
                            {numeral(
                              namaSemester === "1" ? row.realfisik5 : row.realfisik11
                            ).format("0,0")}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">
                            {numeral(
                              namaSemester === "1" ? row.realfisik6 : row.realfisik12
                            ).format("0,0")}
                          </TableCell>

                          {/* Clusters */}
                          <TableCell className="whitespace-nowrap">
                            <StatusIcon
                              active={
                                !!(
                                  row.revisi_anggaran &&
                                  row.blokir_anggaran &&
                                  row.automatic_adjustment &&
                                  row.halaman_3_dipa &&
                                  row.sdana_sbsn &&
                                  row.lainnya_anggaran
                                )
                              }
                              onClick={() => handleOpenRekam(row, 1)}
                            />
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <StatusIcon
                              active={
                                !!(
                                  row.proses_lelang &&
                                  row.lelang_dini &&
                                  row.gagal_lelang &&
                                  row.keterbatasan_penyedia &&
                                  row.tkdn &&
                                  row.ecatalog &&
                                  row.lainnya_pbj
                                )
                              }
                              onClick={() => handleOpenRekam(row, 2)}
                            />
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <StatusIcon
                              active={
                                !!(
                                  row.kekurangan_prasyarat &&
                                  row.prasyarat_lahan &&
                                  row.faktor_cuaca &&
                                  row.kesiapan_pedum &&
                                  row.penerimaan_bantuan &&
                                  row.pembagian_bantuan &&
                                  row.kenaikan_harga &&
                                  row.lainnya_eksekusi
                                )
                              }
                              onClick={() => handleOpenRekam(row, 3)}
                            />
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <StatusIcon
                              active={
                                !!(
                                  row.regulasi_kemenkeu &&
                                  row.regulasi_kl &&
                                  row.regulasi_pemda &&
                                  row.lainnya_regulasi
                                )
                              }
                              onClick={() => handleOpenRekam(row, 4)}
                            />
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <StatusIcon
                              active={
                                !!(
                                  row.pergantian_pejabat &&
                                  row.kekurangan_sdm &&
                                  row.pemahaman_aplikasi &&
                                  row.lainnya_sdm
                                )
                              }
                              onClick={() => handleOpenRekam(row, 5)}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={26}
                          className="h-24 text-center text-muted-foreground"
                        >
                          Tidak ada data.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination Controls */}
            {data.length > 0 && (
              <div className="flex items-center justify-between space-x-2 pt-4">
                <div className="flex-1 text-sm text-muted-foreground">
                  Total: {numeral(rows).format("0,0")} | Hal: {page + 1} dari{" "}
                  {pages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                    disabled={page >= pages - 1}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section >

      {/* Modals */}
      < RekamUpaya show={showModalUpaya} onHide={handleCloseModalUpaya} />

      <Rekam
        show={showModal}
        onHide={handleCloseModal}
        id={idCluster}
        jenis={jenisCluster}
        revisi_anggaran_isi={revisi_anggaran}
        blokir_anggaran_isi={blokir_anggaran}
        automatic_adjustment_isi={automatic_adjustment}
        halaman_3_dipa_isi={halaman_3_dipa}
        sdana_sbsn_isi={sdana_sbsn}
        lainnya_anggaran_isi={lainnya_anggaran}
        proses_lelang_isi={proses_lelang}
        lelang_dini_isi={lelang_dini}
        gagal_lelang_isi={gagal_lelang}
        keterbatasan_penyedia_isi={keterbatasan_penyedia}
        tkdn_isi={tkdn}
        ecatalog_isi={ecatalog}
        lainnya_pbj_isi={lainnya_pbj}
        kekurangan_prasyarat_isi={kekurangan_prasyarat}
        prasyarat_lahan_isi={prasyarat_lahan}
        faktor_cuaca_isi={faktor_cuaca}
        kesiapan_pedum_isi={kesiapan_pedum}
        penerimaan_bantuan_isi={penerimaan_bantuan}
        pembagian_bantuan_isi={pembagian_bantuan}
        kenaikan_harga_isi={kenaikan_harga}
        lainnya_eksekusi_isi={lainnya_eksekusi}
        regulasi_kemenkeu_isi={regulasi_kemenkeu}
        regulasi_kl_isi={regulasi_kl}
        regulasi_pemda_isi={regulasi_pemda}
        lainnya_regulasi_isi={lainnya_regulasi}
        pergantian_pejabat_isi={pergantian_pejabat}
        kekurangan_sdm_isi={kekurangan_sdm}
        pemahaman_aplikasi_isi={pemahaman_aplikasi}
        lainnya_sdm_isi={lainnya_sdm}
        onSaveSuccess={handleSaveSuccess}
      />
    </div >
  );
}
