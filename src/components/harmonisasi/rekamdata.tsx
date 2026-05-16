"use client";

import { TableSkeleton } from "@/components/ui/skeleton-loader";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { http } from "@/lib/api/httpClient";
import { apiPath } from "@/lib/config/base-path";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Loader2,
  CheckSquare,
  Pencil,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
import * as XLSX from "xlsx";
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

const encryptHarmonisasiQuery = (query: string): string => {
  // Backend harmonisasi2 decodes with decodeURIComponent after base64 decode.
  // Encode first so raw SQL LIKE patterns (%...%) don't break URI decoding.
  return Encrypt(encodeURIComponent(query));
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (!error) return fallback;

  if (typeof error === "string") return error;

  if (error instanceof Error && typeof error.message === "string") {
    return error.message;
  }

  const maybeAxiosError = error as {
    message?: unknown;
    response?: {
      data?: {
        error?: unknown;
        message?: unknown;
      };
    };
  };

  const backendError = maybeAxiosError.response?.data?.error;
  if (typeof backendError === "string") return backendError;
  if (
    backendError &&
    typeof backendError === "object" &&
    "message" in backendError &&
    typeof (backendError as { message?: unknown }).message === "string"
  ) {
    return (backendError as { message: string }).message;
  }

  const backendMessage = maybeAxiosError.response?.data?.message;
  if (typeof backendMessage === "string") return backendMessage;

  if (typeof maybeAxiosError.message === "string")
    return maybeAxiosError.message;

  return fallback;
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
  const [limit, setLimit] = useState(10);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);

  // State for Rekam Modal
  const [idCluster, setId] = useState<string | number | null>(null);
  const [jenisCluster, setJenisCluster] = useState<number | null>(null);
  const [selectedRow, setSelectedRow] = useState<any>(null);
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
  const [kdDept, setKdDept] = useState("00");
  const [klList, setKlList] = useState<{ kddept: string; nmdept: string }[]>(
    [],
  );
  const [bidangList, setBidangList] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [sql, setSql] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [export2, setExport2] = useState(false);
  const latestRequestRef = useRef(0);

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
    // Fetch Bidang DAK list for filter dropdown
    const fetchBidangList = async () => {
      const bidangQuery = `SELECT DISTINCT bidang_dak FROM monev2026.pagu_output_2026_new_harmonis ORDER BY bidang_dak`;
      const encoded = encodeURIComponent(bidangQuery);
      const cleaned = decodeURIComponent(encoded)
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const encrypted = encryptHarmonisasiQuery(cleaned);
      try {
        const url = apiPath(
          `/harmonisasi/view?queryParams=${encodeURIComponent(encrypted)}&limit=1000&page=0&user=${encodeURIComponent(username || "")}`,
        );
        const res: any = await http.get(url);
        const bidangData: string[] = (res.data?.result || [])
          .map((row: any) => row.bidang_dak)
          .filter(Boolean);
        setBidangList(bidangData);
      } catch {
        // ignore
      }
    };
    if (username) fetchBidangList();
  }, [username]);

  useEffect(() => {
    // Fetch K/L list for filter dropdown (from 2026 table)
    const fetchKlList = async () => {
      const klQuery = `SELECT a.kddept, MIN(b.nmdept) AS nmdept FROM monev2026.pagu_output_2026_new_harmonis a LEFT JOIN dbref.t_dept_2026 b ON a.kddept = b.kddept GROUP BY a.kddept ORDER BY a.kddept`;
      const encoded = encodeURIComponent(klQuery);
      const cleaned = decodeURIComponent(encoded)
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const encrypted = encryptHarmonisasiQuery(cleaned);
      try {
        const url = apiPath(
          `/harmonisasi/view?queryParams=${encodeURIComponent(encrypted)}&limit=1000&page=0&user=${encodeURIComponent(username || "")}`,
        );
        const res: any = await http.get(url);
        setKlList(res.data?.result || []);
      } catch {
        // ignore
      }
    };
    if (username) fetchKlList();
  }, [username]);

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    kanwil,
    namaBidang,
    kdDept,
    debouncedSearchQuery,
    username,
    role,
    userKdkanwil,
  ]);

  // Debounced search could be implemented here, but keeping it simple for now as requested

  const getSqlQuery = (searchValue: string = debouncedSearchQuery) => {
    const safeSearchQuery = searchValue.trim().replace(/'/g, "''");
    const normalizedSearchQuery = safeSearchQuery.toLowerCase();
    const kanwilFilter = kanwil === "00" ? "" : `a.kdkanwil = '${kanwil}'`;
    const bidangFilter =
      namaBidang === "00" ? "" : `a.bidang_dak = '${namaBidang}'`;
    const deptFilter = kdDept !== "00" ? `a.kddept = '${kdDept}'` : "";
    const searchFilter = safeSearchQuery
      ? `(LOWER(a.kdsatker) LIKE '%${normalizedSearchQuery}%' or LOWER(a.nmsatker) LIKE '%${normalizedSearchQuery}%' or LOWER(a.kdkabkota) LIKE '%${normalizedSearchQuery}%' or LOWER(c.nmkabkota) LIKE '%${normalizedSearchQuery}%' or LOWER(a.ursoutput) LIKE '%${normalizedSearchQuery}%' or LOWER(a.jenis_tkd) LIKE '%${normalizedSearchQuery}%' or LOWER(a.bidang_dak) LIKE '%${normalizedSearchQuery}%' or LOWER(CONCAT(a.kdprogram,'.',a.kdgiat,'.',a.kdoutput,'.',a.kdsoutput)) LIKE '%${normalizedSearchQuery}%')`
      : "";
    const whereClause = [
      kanwilFilter,
      bidangFilter,
      deptFilter,
      searchFilter,
      ...(role === "kanwil_djpb" ? [`a.kdkanwil = '${userKdkanwil}'`] : []),
    ]
      .filter(Boolean)
      .join(" AND ");

    const query = `SELECT a.id, a.thang, a.kdkanwil, a.kddept, a.kdsatker, a.nmsatker, a.bidang_dak, a.jenis_tkd, a.kdkabkota, c.nmkabkota, a.kdlokasi, a.kdprogram,
      a.kdgiat, a.kdoutput, a.kdsoutput, a.ursoutput, a.sat, a.vol, a.pagu, a.real1,
      a.real2, a.real3, a.real4, a.real5, a.real6, a.real7, a.real8, a.real9, a.real10, a.real11, a.real12,
      a.realfisik1, a.realfisik2, a.realfisik3, a.realfisik4, a.realfisik5, a.realfisik6, a.realfisik7, a.realfisik8, a.realfisik9, a.realfisik10, a.realfisik11, a.realfisik12,
      CONCAT(a.kdprogram,'.',a.kdgiat,'.',a.kdoutput,'.',a.kdsoutput) AS coa,
      a.revisi_anggaran_s1, a.blokir_anggaran_s1, a.automatic_adjustment_s1, a.halaman_3_dipa_s1, a.sdana_sbsn_s1, a.lainnya_anggaran_s1,
      a.proses_lelang_s1, a.lelang_dini_s1, a.gagal_lelang_s1, a.keterbatasan_penyedia_s1, a.tkdn_s1, a.ecatalog_s1, a.lainnya_pbj_s1,
      a.kekurangan_prasyarat_s1, a.prasyarat_lahan_s1, a.faktor_cuaca_s1, a.kesiapan_pedum_s1, a.penerimaan_bantuan_s1, a.pembagian_bantuan_s1, a.kenaikan_harga_s1, a.lainnya_eksekusi_s1,
      a.regulasi_kemenkeu_s1, a.regulasi_kl_s1, a.regulasi_pemda_s1, a.lainnya_regulasi_s1,
      a.pergantian_pejabat_s1, a.kekurangan_sdm_s1, a.pemahaman_aplikasi_s1, a.lainnya_sdm_s1,
      a.revisi_anggaran_s2, a.blokir_anggaran_s2, a.automatic_adjustment_s2, a.halaman_3_dipa_s2, a.sdana_sbsn_s2, a.lainnya_anggaran_s2,
      a.proses_lelang_s2, a.lelang_dini_s2, a.gagal_lelang_s2, a.keterbatasan_penyedia_s2, a.tkdn_s2, a.ecatalog_s2, a.lainnya_pbj_s2,
      a.kekurangan_prasyarat_s2, a.prasyarat_lahan_s2, a.faktor_cuaca_s2, a.kesiapan_pedum_s2, a.penerimaan_bantuan_s2, a.pembagian_bantuan_s2, a.kenaikan_harga_s2, a.lainnya_eksekusi_s2,
      a.regulasi_kemenkeu_s2, a.regulasi_kl_s2, a.regulasi_pemda_s2, a.lainnya_regulasi_s2,
      a.pergantian_pejabat_s2, a.kekurangan_sdm_s2, a.pemahaman_aplikasi_s2, a.lainnya_sdm_s2
      FROM monev2026.pagu_output_2026_new_harmonis a
      LEFT JOIN dbref.t_lokasi_2026 b ON a.kdlokasi=b.kdlokasi
      LEFT JOIN dbref.t_kabkota_2026 c ON a.kdlokasi=c.kdlokasi AND a.kdkabkota=c.kdkabkota
      ${whereClause ? `WHERE ${whereClause}` : ""}
      ORDER BY a.bidang_dak, a.kdlokasi ASC, a.pagu DESC`;
    return query;
  };

  const getData = async () => {
    const requestId = Date.now();
    latestRequestRef.current = requestId;
    setLoading(true);
    const query = getSqlQuery(debouncedSearchQuery);
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

    const encryptedQuery = encryptHarmonisasiQuery(cleanedQuery);

    try {
      // Try bigger payload first, then fallback to smaller limit on connection reset.
      const fetchLimits = [100000, 50000, 20000];
      let resultData: any[] = [];
      let usedFallbackLimit = false;
      let lastError: unknown = null;

      for (let i = 0; i < fetchLimits.length; i += 1) {
        const fetchLimit = fetchLimits[i];
        const url = apiPath(
          `/harmonisasi/view?queryParams=${encodeURIComponent(encryptedQuery)}&limit=${fetchLimit}&page=0&user=${encodeURIComponent(username || "")}`,
        );

        try {
          const response: any = await http.get(url);
          resultData = response.data.result || [];
          usedFallbackLimit = i > 0;
          break;
        } catch (err) {
          lastError = err;
          const errMsg = getErrorMessage(err, "").toLowerCase();
          const isConnReset =
            errMsg.includes("econnreset") ||
            errMsg.includes("socket hang up") ||
            errMsg.includes("network error");

          if (!isConnReset || i === fetchLimits.length - 1) {
            throw err;
          }
        }
      }

      if (latestRequestRef.current !== requestId) {
        return;
      }

      if (lastError && resultData.length === 0) {
        throw lastError;
      }

      // Client-side pagination logic
      const totalCount = resultData.length;
      const totalPages = Math.ceil(totalCount / limit);

      setData(resultData);
      setPages(totalPages);
      setRows(totalCount);

      if (usedFallbackLimit) {
        toast.warning(
          "Koneksi backend tidak stabil. Data ditampilkan dengan batas lebih kecil, gunakan filter/pencarian untuk mempersempit data.",
        );
      }

      setLoading(false);
    } catch (error: any) {
      if (latestRequestRef.current !== requestId) {
        return;
      }
      setLoading(false);
      const message = getErrorMessage(
        error,
        "Terjadi Permasalahan Koneksi atau Server Backend",
      );
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
    const encryptedQuery = encryptHarmonisasiQuery(cleanedQuery);

    try {
      // High limit to fetch all
      const url = apiPath(
        `/harmonisasi/view?queryParams=${encodeURIComponent(encryptedQuery)}&limit=1000000&page=0&user=${encodeURIComponent(username || "")}`,
      );

      const response: any = await http.get(url);
      const resultData = response.data.result;

      if (!resultData || resultData.length === 0) {
        toast.warning("Tidak ada data untuk diekspor");
        setLoadingStatus(false);
        return;
      }

      // Convert to XLSX
      const worksheet = XLSX.utils.json_to_sheet(resultData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Harmonisasi");

      const filename = `harmonisasi_2026_${moment().format("YYYYMMDD_HHmmss")}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (error: any) {
      console.error(error);
      const message = getErrorMessage(error, "Gagal mengunduh data");
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
    setSelectedRow(row);
    setId(row.id);
    setJenisCluster(jenis);

    // 2026: cluster columns use _s1/_s2 suffix; modal handles semester selection internally
    const suffix = "_s1";
    setRevisi_anggaran(row[`revisi_anggaran${suffix}`] || "");
    setBlokir_anggaran(row[`blokir_anggaran${suffix}`] || "");
    setAutomatic_adjustment(row[`automatic_adjustment${suffix}`] || "");
    setHalaman_3_dipa(row[`halaman_3_dipa${suffix}`] || "");
    setSdana_sbsn(row[`sdana_sbsn${suffix}`] || "");
    setLainnya_anggaran(row[`lainnya_anggaran${suffix}`] || "");

    setProses_lelang(row[`proses_lelang${suffix}`] || "");
    setLelang_dini(row[`lelang_dini${suffix}`] || "");
    setGagal_lelang(row[`gagal_lelang${suffix}`] || "");
    setKeterbatasan_penyedia(row[`keterbatasan_penyedia${suffix}`] || "");
    setTkdn(row[`tkdn${suffix}`] || "");
    setEcatalog(row[`ecatalog${suffix}`] || "");
    setLainnya_pbj(row[`lainnya_pbj${suffix}`] || "");

    setKekurangan_prasyarat(row[`kekurangan_prasyarat${suffix}`] || "");
    setPrasyarat_lahan(row[`prasyarat_lahan${suffix}`] || "");
    setFaktor_cuaca(row[`faktor_cuaca${suffix}`] || "");
    setKesiapan_pedum(row[`kesiapan_pedum${suffix}`] || "");
    setPenerimaan_bantuan(row[`penerimaan_bantuan${suffix}`] || "");
    setPembagian_bantuan(row[`pembagian_bantuan${suffix}`] || "");
    setKenaikan_harga(row[`kenaikan_harga${suffix}`] || "");
    setLainnya_eksekusi(row[`lainnya_eksekusi${suffix}`] || "");

    setRegulasi_kemenkeu(row[`regulasi_kemenkeu${suffix}`] || "");
    setRegulasi_kl(row[`regulasi_kl${suffix}`] || "");
    setRegulasi_pemda(row[`regulasi_pemda${suffix}`] || "");
    setLainnya_regulasi(row[`lainnya_regulasi${suffix}`] || "");

    setPergantian_pejabat(row[`pergantian_pejabat${suffix}`] || "");
    setKekurangan_sdm(row[`kekurangan_sdm${suffix}`] || "");
    setPemahaman_aplikasi(row[`pemahaman_aplikasi${suffix}`] || "");
    setLainnya_sdm(row[`lainnya_sdm${suffix}`] || "");

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
    setPage(0);
    if (query) {
      setKanwil("00");
      setNamaBidang("00");
      setKdDept("00");
    }
  };

  const clusterHeadClass =
    "text-center w-[90px] min-w-[90px] max-w-[90px] whitespace-nowrap px-1";
  const clusterCellClass =
    "text-center w-[90px] min-w-[90px] max-w-[90px] px-1";

  const getRekamStatus = (
    row: any,
    fields: string[],
  ): "full" | "partial" | "none" => {
    const s1Filled = fields.every((f) => !!row[`${f}_s1`]);
    const s2Filled = fields.every((f) => !!row[`${f}_s2`]);
    if (s1Filled && s2Filled) return "full";
    if (s1Filled || s2Filled) return "partial";
    return "none";
  };

  const StatusIcon = ({
    status,
    onClick,
  }: {
    status: "full" | "partial" | "none";
    onClick: () => void;
  }) => (
    <div className="flex justify-center">
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        className="h-8 w-8 p-0"
        title={
          status === "full"
            ? "Lengkap (S1+S2)"
            : status === "partial"
              ? "Sebagian terisi"
              : "Belum direkam"
        }
      >
        <CheckSquare
          className={cn(
            "h-4 w-4",
            status === "full"
              ? "text-green-600"
              : status === "partial"
                ? "text-amber-500"
                : "text-gray-400",
          )}
        />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Harmonisasi Belanja K/L & TKD
          </h1>
          <p className="text-sm text-muted-foreground">
            Harmonisasi Perencanaan dan Penganggaran Belanja K/L dan TKD
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">K/L</label>
                <Select value={kdDept} onValueChange={setKdDept}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua K/L" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="00">Semua K/L</SelectItem>
                    {klList.map((kl) => (
                      <SelectItem key={kl.kddept} value={kl.kddept}>
                        {kl.kddept} - {kl.nmdept}
                      </SelectItem>
                    ))}
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
                    {bidangList.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Pencarian</label>
                <Input
                  type="text"
                  aria-label="Pencarian data harmonisasi"
                  placeholder="Cari satker, RO, kabkota..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Harmonisasi 2026</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton />
            ) : (
              <div className="rounded-md border">
                <Table className="relative border-separate border-spacing-0 text-xs">
                  <TableHeader className="bg-background sticky top-0 z-10 shadow-sm">
                    <TableRow>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap w-12 min-w-[48px]"
                      >
                        No
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        Nama Satker
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        Bidang
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        Jenis TKD
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        Lokasi/Kabkota
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        COA
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        Nama RO
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        Satuan/Vol
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        Pagu
                      </TableHead>
                      <TableHead
                        colSpan={12}
                        className="text-center whitespace-nowrap"
                      >
                        Realisasi (Rupiah)
                      </TableHead>
                      <TableHead
                        colSpan={12}
                        className="text-center whitespace-nowrap"
                      >
                        RVRO (Volume)
                      </TableHead>
                      <TableHead
                        colSpan={5}
                        className="text-center whitespace-nowrap"
                      >
                        Cluster Tantangan/Hambatan
                      </TableHead>
                    </TableRow>
                    <TableRow>
                      {[
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "Mei",
                        "Jun",
                        "Jul",
                        "Ags",
                        "Sep",
                        "Okt",
                        "Nov",
                        "Des",
                      ].map((m) => (
                        <TableHead
                          key={`real-${m}`}
                          className="text-center whitespace-nowrap"
                        >
                          {m}
                        </TableHead>
                      ))}
                      {[
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "Mei",
                        "Jun",
                        "Jul",
                        "Ags",
                        "Sep",
                        "Okt",
                        "Nov",
                        "Des",
                      ].map((m) => (
                        <TableHead
                          key={`phy-${m}`}
                          className="text-center whitespace-nowrap"
                        >
                          {m}
                        </TableHead>
                      ))}
                      <TableHead className={clusterHeadClass}>
                        Penganggaran
                      </TableHead>
                      <TableHead className={clusterHeadClass}>PBJ</TableHead>
                      <TableHead className={clusterHeadClass}>
                        Eksekusi
                      </TableHead>
                      <TableHead className={clusterHeadClass}>
                        Regulasi
                      </TableHead>
                      <TableHead className={clusterHeadClass}>SDM</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.slice(page * limit, (page + 1) * limit).length > 0 ? (
                      data
                        .slice(page * limit, (page + 1) * limit)
                        .map((row: any, index: number) => (
                          <TableRow key={row.id}>
                            <TableCell className="text-center whitespace-nowrap">
                              {index + 1 + page * limit}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {row.nmsatker} ({row.kddept}.{row.kdsatker})
                            </TableCell>
                            <TableCell className="text-center whitespace-nowrap">
                              {row.bidang_dak}
                            </TableCell>
                            <TableCell className="text-center whitespace-nowrap">
                              {row.jenis_tkd}
                            </TableCell>
                            <TableCell className="text-center whitespace-nowrap">
                              {row.kdlokasi} - {row.nmkabkota}
                            </TableCell>
                            <TableCell className="text-center select-none">
                              {row.coa}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {row.ursoutput}
                            </TableCell>
                            <TableCell className="text-center whitespace-nowrap">
                              {row.sat} - {numeral(row.vol).format("0,0")}
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums whitespace-nowrap">
                              {numeral(row.pagu).format("0,0")}
                            </TableCell>

                            {/* Realisation Rupiah 1-12 */}
                            {(
                              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const
                            ).map((n) => (
                              <TableCell
                                key={`r${n}`}
                                className="text-right font-mono tabular-nums whitespace-nowrap"
                              >
                                {numeral(row[`real${n}`]).format("0,0")}
                              </TableCell>
                            ))}

                            {/* Realisation Fisik 1-12 */}
                            {(
                              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const
                            ).map((n) => (
                              <TableCell
                                key={`rf${n}`}
                                className="text-right font-mono tabular-nums whitespace-nowrap"
                              >
                                {numeral(row[`realfisik${n}`]).format("0,0")}
                              </TableCell>
                            ))}

                            {/* Clusters */}
                            <TableCell className={clusterCellClass}>
                              <StatusIcon
                                status={getRekamStatus(row, [
                                  "revisi_anggaran",
                                  "blokir_anggaran",
                                  "automatic_adjustment",
                                  "halaman_3_dipa",
                                  "sdana_sbsn",
                                  "lainnya_anggaran",
                                ])}
                                onClick={() => handleOpenRekam(row, 1)}
                              />
                            </TableCell>
                            <TableCell className={clusterCellClass}>
                              <StatusIcon
                                status={getRekamStatus(row, [
                                  "proses_lelang",
                                  "lelang_dini",
                                  "gagal_lelang",
                                  "keterbatasan_penyedia",
                                  "tkdn",
                                  "ecatalog",
                                  "lainnya_pbj",
                                ])}
                                onClick={() => handleOpenRekam(row, 2)}
                              />
                            </TableCell>
                            <TableCell className={clusterCellClass}>
                              <StatusIcon
                                status={getRekamStatus(row, [
                                  "kekurangan_prasyarat",
                                  "prasyarat_lahan",
                                  "faktor_cuaca",
                                  "kesiapan_pedum",
                                  "penerimaan_bantuan",
                                  "pembagian_bantuan",
                                  "kenaikan_harga",
                                  "lainnya_eksekusi",
                                ])}
                                onClick={() => handleOpenRekam(row, 3)}
                              />
                            </TableCell>
                            <TableCell className={clusterCellClass}>
                              <StatusIcon
                                status={getRekamStatus(row, [
                                  "regulasi_kemenkeu",
                                  "regulasi_kl",
                                  "regulasi_pemda",
                                  "lainnya_regulasi",
                                ])}
                                onClick={() => handleOpenRekam(row, 4)}
                              />
                            </TableCell>
                            <TableCell className={clusterCellClass}>
                              <StatusIcon
                                status={getRekamStatus(row, [
                                  "pergantian_pejabat",
                                  "kekurangan_sdm",
                                  "pemahaman_aplikasi",
                                  "lainnya_sdm",
                                ])}
                                onClick={() => handleOpenRekam(row, 5)}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={38}
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
              <div className="flex flex-col md:grid md:grid-cols-3 items-center justify-between gap-4 py-4">
                {/* Left: Rows per page */}
                <div className="flex items-center space-x-2 order-2 md:order-1">
                  <p className="text-sm font-medium">Rows per page</p>
                  <Select
                    value={`${limit}`}
                    onValueChange={(value) => {
                      setLimit(Number(value));
                      setPage(0);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[80px]">
                      <SelectValue placeholder={limit} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 25, 50, 100].map((pageSize) => (
                        <SelectItem key={pageSize} value={`${pageSize}`}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Center: Numbered Pagination */}
                <div className="flex items-center justify-center order-1 md:order-2 w-full md:w-auto">
                  <Pagination className="mx-auto justify-center">
                    <div className="flex items-center justify-between w-full sm:min-w-[400px] gap-2">
                      <PaginationPrevious
                        onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(0, p - 1)); }}
                        className={cn("cursor-pointer select-none", page === 0 && "pointer-events-none opacity-50")}
                      />
                      <PaginationContent className="flex-1 justify-center gap-1 overflow-x-auto no-scrollbar">
                        {(() => {
                          const totalPage = pages;
                          const currentPage = page + 1;
                          const items = [];
                          if (totalPage <= 7) {
                            for (let i = 1; i <= totalPage; i++) {
                              items.push(
                                <PaginationItem key={i}>
                                  <PaginationLink isActive={currentPage === i} onClick={(e) => { e.preventDefault(); setPage(i - 1); }} className="cursor-pointer select-none">{i}</PaginationLink>
                                </PaginationItem>
                              );
                            }
                          } else {
                            items.push(
                              <PaginationItem key={1}>
                                <PaginationLink isActive={currentPage === 1} onClick={(e) => { e.preventDefault(); setPage(0); }} className="cursor-pointer select-none">1</PaginationLink>
                              </PaginationItem>
                            );
                            if (currentPage > 3) items.push(<PaginationEllipsis key="left-ellipsis" />);
                            const start = Math.max(2, currentPage - 1);
                            const end = Math.min(totalPage - 1, currentPage + 1);
                            for (let i = start; i <= end; i++) {
                              items.push(
                                <PaginationItem key={i}>
                                  <PaginationLink isActive={currentPage === i} onClick={(e) => { e.preventDefault(); setPage(i - 1); }} className="cursor-pointer select-none">{i}</PaginationLink>
                                </PaginationItem>
                              );
                            }
                            if (currentPage < totalPage - 2) items.push(<PaginationEllipsis key="right-ellipsis" />);
                            items.push(
                              <PaginationItem key={totalPage}>
                                <PaginationLink isActive={currentPage === totalPage} onClick={(e) => { e.preventDefault(); setPage(totalPage - 1); }} className="cursor-pointer select-none">{totalPage}</PaginationLink>
                              </PaginationItem>
                            );
                          }
                          return items;
                        })()}
                      </PaginationContent>
                      <PaginationNext
                        onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(pages - 1, p + 1)); }}
                        className={cn("cursor-pointer select-none", page >= pages - 1 && "pointer-events-none opacity-50")}
                      />
                    </div>
                  </Pagination>
                </div>

                {/* Right: Showing entries */}
                <div className="text-sm text-muted-foreground whitespace-nowrap order-3 md:text-right">
                  Showing {rows === 0 ? 0 : page * limit + 1}–{Math.min((page + 1) * limit, rows)} of {numeral(rows).format("0,0")} entries
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Modals */}
      <RekamUpaya show={showModalUpaya} onHide={handleCloseModalUpaya} />

      <Rekam
        show={showModal}
        onHide={handleCloseModal}
        id={idCluster}
        jenis={jenisCluster}
        thang="2026"
        semester="1"
        row={selectedRow}
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
        tableName="monev2026.pagu_output_2026_new_harmonis"
        kdsatker={selectedRow?.kdsatker}
        kdprogram={selectedRow?.kdprogram}
        kdgiat={selectedRow?.kdgiat}
        kdoutput={selectedRow?.kdoutput}
        kdsoutput={selectedRow?.kdsoutput}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  );
}
