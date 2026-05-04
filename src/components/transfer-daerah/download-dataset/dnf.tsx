"use client";

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useAuth } from "@/hooks/useAuth";
import { http } from "@/lib/api/httpClient";
import * as xlsx from "xlsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Download, RotateCcw, Play, Database, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface SelectOption {
  label: string;
  value: string;
}

interface TpgData {
  thang: string;
  nm_periode: string;
  kode_kanwil: string;
  nm_kanwil: string;
  kppn: string;
  nm_kppn: string;
  nm_lokasi: string;
  jenis_tkd: string;
  Januari?: number;
  Februari?: number;
  Maret?: number;
  April?: number;
  Mei?: number;
  Juni?: number;
  Juli?: number;
  Agustus?: number;
  September?: number;
  Oktober?: number;
  November?: number;
  Desember?: number;
  total_setahun?: number;
  [key: string]: any;
}

interface BosBopData {
  thang: string;
  kdkanwil: string;
  nmkanwil: string;
  kdkppn: string;
  nmkabkota_kppn: string;
  nmprogram: string;
  jenjang: string;
  status_sekolah: string;
  jenis_bos: string;
  kdlokasi_kedudukan: string;
  nmkabkota_sekolah: string;
  Januari?: number;
  Februari?: number;
  Maret?: number;
  April?: number;
  Mei?: number;
  Juni?: number;
  Juli?: number;
  Agustus?: number;
  September?: number;
  Oktober?: number;
  November?: number;
  Desember?: number;
  total_nilai?: number;
  total_siswa?: number;
  [key: string]: any;
}

const SwalConfig = Swal.mixin({
  customClass: {
    container: "dnf-swal-container",
    popup: "swal-wide",
    title: "swal-title",
    htmlContainer: "swal-content",
    confirmButton: "btn btn-primary",
    cancelButton: "btn btn-secondary",
  },
  buttonsStyling: false,
  allowOutsideClick: false,
  allowEscapeKey: false,
  didOpen: () => {
    document.body.classList.add("dnf-swal");
  },
  didClose: () => {
    document.body.classList.remove("dnf-swal");
  },
});

interface ButtonRowProps {
  onTayang: () => void;
  onShowSQL: () => void;
  role: string;
  loadingResults: boolean;
  onDownloadCSV: () => void;
  onDownloadExcel: () => void;
  onDownloadPDF: () => void;
  onRefresh: () => void;
}

const ButtonRow: React.FC<ButtonRowProps> = ({
  onTayang,
  onShowSQL,
  role,
  loadingResults,
  onDownloadCSV,
  onDownloadExcel,
  onDownloadPDF,
  onRefresh,
}) => {
  return (
    <div className="flex flex-wrap gap-2 items-center py-1">
      <Button
        variant="success"
        size="sm"
        onClick={onTayang}
        disabled={loadingResults}
        className="gap-2"
      >
        {loadingResults ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Tayang
          </>
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="info" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Download
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={onDownloadCSV}>CSV</DropdownMenuItem>
          <DropdownMenuItem onClick={onDownloadExcel}>EXCEL</DropdownMenuItem>
          <DropdownMenuItem onClick={onDownloadPDF}>PDF</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="secondary"
        size="sm"
        onClick={onRefresh}
        className="gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Refresh
      </Button>

      {role === "X" && (
        <Button
          variant="warning"
          size="sm"
          onClick={onShowSQL}
          className="gap-2"
        >
          <Database className="h-4 w-4" />
          SQL
        </Button>
      )}
    </div>
  );
};

const MONTHS = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

const DNF: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role === "kppn" ? "3" : user?.role === "kanwil_djpb" ? "2" : "0";
  const kdkanwil = user?.kdkanwil ?? "";
  const kdkppn = user?.kdkppn ?? "";
  const [activeTab, setActiveTab] = useState<string>("tpg");
  const API_BASE = process.env.NEXT_PUBLIC_DAKFISIK_DNF_DATA || "/api/v1/transfer-daerah/dataset/query?sql=";

  // ===== TPG STATE =====
  const [tpgSelectedYear, setTpgSelectedYear] = useState<string>("");
  const [tpgYearOptions, setTpgYearOptions] = useState<SelectOption[]>([]);
  const [tpgStartMonth, setTpgStartMonth] = useState<string>("1");
  const [tpgEndMonth, setTpgEndMonth] = useState<string>("12");
  const [tpgSelectedkppn, setTpgSelectedkppn] = useState<string>("");
  const [tpgkppnOptions, setTpgkppnOptions] = useState<SelectOption[]>([]);
  const [tpgSelectedkanwil, setTpgSelectedkanwil] = useState<string>("");
  const [tpgkanwilOptions, setTpgkanwilOptions] = useState<SelectOption[]>([]);
  const [tpgSelectedPeriode, setTpgSelectedPeriode] = useState<string>("");
  const [tpgPeriodeOptions, setTpgPeriodeOptions] = useState<SelectOption[]>([]);
  const [tpgSelectedGelombang, setTpgSelectedGelombang] = useState<string>("");
  const [tpgGelombangOptions, setTpgGelombangOptions] = useState<SelectOption[]>([]);
  const [tpgSelectedJenisTkd, setTpgSelectedJenisTkd] = useState<string>("");
  const [tpgJenisTkdOptions, setTpgJenisTkdOptions] = useState<SelectOption[]>([]);
  const [tpgShowResults, setTpgShowResults] = useState<boolean>(false);
  const [tpgTableData, setTpgTableData] = useState<TpgData[]>([]);
  const [tpgLoading, setTpgLoading] = useState<boolean>(false);

  // ===== BOS_BOP STATE =====
  const [bosBopSelectedYear, setBosBopSelectedYear] = useState<string>("");
  const [bosBopYearOptions, setBosBopYearOptions] = useState<SelectOption[]>([]);
  const [bosBopStartMonth, setBosBopStartMonth] = useState<string>("1");
  const [bosBopEndMonth, setBosBopEndMonth] = useState<string>("12");
  const [bosBopSelectedProgram, setBosBopSelectedProgram] = useState<string>("");
  const [bosBopProgramOptions, setBosBopProgramOptions] = useState<SelectOption[]>([]);
  const [bosBopSelectedJenisBos, setBosBopSelectedJenisBos] = useState<string>("");
  const [bosBopJenisBosOptions, setBosBopJenisBosOptions] = useState<SelectOption[]>([]);
  const [bosBopSelectedJenjang, setBosBopSelectedJenjang] = useState<string>("");
  const [bosBopJenjangOptions, setBosBopJenjangOptions] = useState<SelectOption[]>([]);
  const [bosBopSelectedKanwil, setBosBopSelectedKanwil] = useState<string>("");
  const [bosBopKanwilOptions, setBosBopKanwilOptions] = useState<SelectOption[]>([]);
  const [bosBopSelectedKppn, setBosBopSelectedKppn] = useState<string>("");
  const [bosBopKppnOptions, setBosBopKppnOptions] = useState<SelectOption[]>([]);
  const [bosBopShowResults, setBosBopShowResults] = useState<boolean>(false);
  const [bosBopTableData, setBosBopTableData] = useState<BosBopData[]>([]);
  const [bosBopLoading, setBosBopLoading] = useState<boolean>(false);

  // Pagination & SQL Modal
  const [tpgCurrentPage, setTpgCurrentPage] = useState<number>(1);
  const [bosBopCurrentPage, setBosBopCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;
  const [showModalSQL, setShowModalSQL] = useState<boolean>(false);
  const [sqlQuery, setSqlQuery] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Helper to fetch
  const fetchData = async (query: string) => {
    const response = await http.get(`${API_BASE}${encodeURIComponent(query)}`);
    return response.data.result || [];
  };

  // ===== TPG FETCH =====
  const fetchTpgYears = async () => {
    try {
      const d = await fetchData("SELECT DISTINCT thang FROM tkd.tpg ORDER BY thang DESC");
      setTpgYearOptions(d.map((y: any) => ({ label: String(y.thang), value: String(y.thang) })));
      if (d.length > 0) setTpgSelectedYear(String(d[0].thang));
    } catch (e) {
      console.error("Error fetching TPG years:", e);
    }
  };

  const fetchTpgKppn = async (selectedKanwil = "") => {
    try {
      let query = "";
      if (role === "3" && kdkppn)
        query = `SELECT kdkppn, MIN(nmkppn) AS nmkppn FROM dbref.t_kppn_2025 WHERE kdkppn = '${kdkppn}' GROUP BY kdkppn ORDER BY kdkppn ASC`;
      else if (role === "2" && kdkanwil)
        query = `SELECT kdkppn, MIN(nmkppn) AS nmkppn FROM dbref.t_kppn_2025 WHERE kdkanwil = '${kdkanwil}' GROUP BY kdkppn ORDER BY kdkppn ASC`;
      else if (selectedKanwil)
        query = `SELECT kdkppn, MIN(nmkppn) AS nmkppn FROM dbref.t_kppn_2025 WHERE kdkanwil = '${selectedKanwil}' GROUP BY kdkppn ORDER BY kdkppn ASC`;
      else
        query = "SELECT kdkppn, MIN(nmkppn) AS nmkppn FROM dbref.t_kppn_2025 WHERE kdkppn IS NOT NULL GROUP BY kdkppn ORDER BY kdkppn ASC";
      const d = await fetchData(query);
      setTpgkppnOptions(d.map((k: any) => ({ label: `${k.kdkppn} - ${k.nmkppn || "N/A"}`, value: String(k.kdkppn) })));
      if (role === "3" && kdkppn) setTpgSelectedkppn(kdkppn);
      else setTpgSelectedkppn("");
    } catch (e) {
      console.error("Error fetching TPG kppn:", e);
    }
  };

  const fetchTpgKanwil = async () => {
    try {
      let query = "SELECT kdkanwil, MIN(nmkanwil) AS nmkanwil FROM dbref.t_kanwil_2025 WHERE kdkanwil IS NOT NULL GROUP BY kdkanwil ORDER BY kdkanwil ASC";
      if ((role === "2" || role === "3") && kdkanwil)
        query = `SELECT kdkanwil, MIN(nmkanwil) AS nmkanwil FROM dbref.t_kanwil_2025 WHERE kdkanwil = '${kdkanwil}' GROUP BY kdkanwil`;
      const d = await fetchData(query);
      setTpgkanwilOptions(d.map((k: any) => ({ label: `${k.kdkanwil} - ${k.nmkanwil}`, value: String(k.kdkanwil) })));
      if ((role === "2" || role === "3") && kdkanwil) setTpgSelectedkanwil(kdkanwil);
      else setTpgSelectedkanwil("");
    } catch (e) {
      console.error("Error fetching TPG kanwil:", e);
    }
  };

  const fetchTpgPeriodes = async () => {
    try {
      const d = await fetchData("SELECT DISTINCT nm_periode FROM tkd.tpg WHERE nm_periode IS NOT NULL ORDER BY nm_periode");
      setTpgPeriodeOptions(d.map((p: any) => ({ label: p.nm_periode, value: p.nm_periode })));
    } catch (e) { console.error(e); }
  };
  const fetchTpgGelombangs = async () => {
    try {
      const d = await fetchData("SELECT DISTINCT gelombang FROM tkd.tpg WHERE gelombang IS NOT NULL ORDER BY gelombang");
      setTpgGelombangOptions(d.map((g: any) => ({ label: g.gelombang, value: g.gelombang })));
    } catch (e) { console.error(e); }
  };
  const fetchTpgJenisTkd = async () => {
    try {
      const d = await fetchData("SELECT DISTINCT nama_detail FROM tkd.tpg WHERE nama_detail IS NOT NULL ORDER BY nama_detail");
      setTpgJenisTkdOptions(d.map((j: any) => ({ label: j.nama_detail, value: j.nama_detail })));
    } catch (e) { console.error(e); }
  };

  // ===== BOS_BOP FETCH =====
  const fetchBosBopYears = async () => {
    try {
      const d = await fetchData("SELECT DISTINCT thang FROM tkd.bos_bop ORDER BY thang DESC");
      setBosBopYearOptions(d.map((y: any) => ({ label: String(y.thang), value: String(y.thang) })));
      if (d.length > 0) setBosBopSelectedYear(String(d[0].thang));
    } catch (e) { console.error(e); }
  };
  const fetchBosBopPrograms = async () => {
    try {
      const d = await fetchData("SELECT DISTINCT nmprogram FROM tkd.bos_bop WHERE nmprogram IS NOT NULL ORDER BY nmprogram");
      setBosBopProgramOptions(d.map((p: any) => ({ label: p.nmprogram, value: p.nmprogram })));
    } catch (e) { console.error(e); }
  };
  const fetchBosBopJenisBos = async () => {
    try {
      const d = await fetchData("SELECT DISTINCT jenis_bos FROM tkd.bos_bop WHERE jenis_bos IS NOT NULL ORDER BY jenis_bos");
      setBosBopJenisBosOptions(d.map((j: any) => ({ label: j.jenis_bos, value: j.jenis_bos })));
    } catch (e) { console.error(e); }
  };
  const fetchBosBopJenjang = async () => {
    try {
      const d = await fetchData("SELECT DISTINCT jenjang FROM tkd.bos_bop WHERE jenjang IS NOT NULL ORDER BY jenjang");
      setBosBopJenjangOptions(d.map((j: any) => ({ label: j.jenjang, value: j.jenjang })));
    } catch (e) { console.error(e); }
  };

  const fetchBosBopKanwil = async () => {
    try {
      let query = (role === "2" || role === "3") && kdkanwil
        ? `SELECT kdkanwil, MIN(nmkanwil) AS nmkanwil FROM dbref.t_kanwil_2025 WHERE kdkanwil = '${kdkanwil}' GROUP BY kdkanwil ORDER BY kdkanwil ASC`
        : "SELECT kdkanwil, MIN(nmkanwil) AS nmkanwil FROM dbref.t_kanwil_2025 WHERE kdkanwil IS NOT NULL GROUP BY kdkanwil ORDER BY kdkanwil ASC";
      const d = await fetchData(query);
      setBosBopKanwilOptions(d.map((k: any) => ({ label: `${k.kdkanwil} - ${k.nmkanwil || "N/A"}`, value: String(k.kdkanwil) })));
      if ((role === "2" || role === "3") && kdkanwil) setBosBopSelectedKanwil(kdkanwil);
      else setBosBopSelectedKanwil("");
    } catch (e) { console.error(e); }
  };

  const fetchBosBopKppn = async (selectedKanwil = "") => {
    try {
      let query = "";
      if (role === "3" && kdkppn)
        query = `SELECT kdkppn, MIN(nmkppn) AS nmkppn FROM dbref.t_kppn_2025 WHERE kdkppn = '${kdkppn}' GROUP BY kdkppn ORDER BY kdkppn ASC`;
      else if (role === "2" && kdkanwil)
        query = `SELECT kdkppn, MIN(nmkppn) AS nmkppn FROM dbref.t_kppn_2025 WHERE kdkanwil = '${kdkanwil}' GROUP BY kdkppn ORDER BY kdkppn ASC`;
      else if (selectedKanwil)
        query = `SELECT kdkppn, MIN(nmkppn) AS nmkppn FROM dbref.t_kppn_2025 WHERE kdkanwil = '${selectedKanwil}' GROUP BY kdkppn ORDER BY kdkppn ASC`;
      else
        query = "SELECT kdkppn, MIN(nmkppn) AS nmkppn FROM dbref.t_kppn_2025 WHERE kdkppn IS NOT NULL GROUP BY kdkppn ORDER BY kdkppn ASC";
      const d = await fetchData(query);
      setBosBopKppnOptions(d.map((k: any) => ({ label: `${k.kdkppn} - ${k.nmkppn || "N/A"}`, value: String(k.kdkppn) })));
      if (role === "3" && kdkppn) setBosBopSelectedKppn(kdkppn);
      else setBosBopSelectedKppn("");
    } catch (e) { console.error(e); }
  };

  // ===== SQL QUERIES =====
  const generateTpgSQLQuery = (): string => {
    let w = "WHERE 1=1";
    if (tpgSelectedYear && tpgSelectedYear !== "all") w += ` AND thang = '${tpgSelectedYear}'`;
    const fKanwil = tpgSelectedkanwil || ((role === "2" || role === "3") ? kdkanwil : "");
    if (fKanwil) w += ` AND kode_kanwil = '${fKanwil}'`;
    const fKppn = tpgSelectedkppn || (role === "3" ? kdkppn : "");
    if (fKppn) w += ` AND kppn = '${fKppn}'`;
    if (tpgStartMonth && tpgEndMonth) w += ` AND EXTRACT(MONTH FROM tgsp2d) BETWEEN ${tpgStartMonth} AND ${tpgEndMonth}`;
    if (tpgSelectedPeriode && tpgSelectedPeriode !== "all") w += ` AND nm_periode = '${tpgSelectedPeriode}'`;
    if (tpgSelectedGelombang && tpgSelectedGelombang !== "all") w += ` AND gelombang = '${tpgSelectedGelombang}'`;
    if (tpgSelectedJenisTkd && tpgSelectedJenisTkd !== "all") w += ` AND nama_detail = '${tpgSelectedJenisTkd}'`;
    return `SELECT thang, nm_periode, kode_kanwil, nm_kanwil, kppn, nm_kppn, nm_lokasi, nama_detail AS jenis_tkd,
    SUM(CASE WHEN EXTRACT(MONTH FROM tgsp2d) = 1 THEN rupiah ELSE 0 END) AS Januari, SUM(CASE WHEN EXTRACT(MONTH FROM tgsp2d) = 2 THEN rupiah ELSE 0 END) AS Februari,
    SUM(CASE WHEN EXTRACT(MONTH FROM tgsp2d) = 3 THEN rupiah ELSE 0 END) AS Maret, SUM(CASE WHEN EXTRACT(MONTH FROM tgsp2d) = 4 THEN rupiah ELSE 0 END) AS April,
    SUM(CASE WHEN EXTRACT(MONTH FROM tgsp2d) = 5 THEN rupiah ELSE 0 END) AS Mei, SUM(CASE WHEN EXTRACT(MONTH FROM tgsp2d) = 6 THEN rupiah ELSE 0 END) AS Juni,
    SUM(CASE WHEN EXTRACT(MONTH FROM tgsp2d) = 7 THEN rupiah ELSE 0 END) AS Juli, SUM(CASE WHEN EXTRACT(MONTH FROM tgsp2d) = 8 THEN rupiah ELSE 0 END) AS Agustus,
    SUM(CASE WHEN EXTRACT(MONTH FROM tgsp2d) = 9 THEN rupiah ELSE 0 END) AS September, SUM(CASE WHEN EXTRACT(MONTH FROM tgsp2d) = 10 THEN rupiah ELSE 0 END) AS Oktober,
    SUM(CASE WHEN EXTRACT(MONTH FROM tgsp2d) = 11 THEN rupiah ELSE 0 END) AS November, SUM(CASE WHEN EXTRACT(MONTH FROM tgsp2d) = 12 THEN rupiah ELSE 0 END) AS Desember,
    SUM(rupiah) AS total_setahun FROM tkd.tpg ${w}
    GROUP BY thang, nm_periode, kode_kanwil, nm_kanwil, kppn, nm_kppn, nm_lokasi, nama_detail ORDER BY nm_lokasi ASC, nm_periode ASC`;
  };

  const generateBosBopSQLQuery = (): string => {
    let w = "WHERE 1=1";
    if (bosBopSelectedYear && bosBopSelectedYear !== "all") w += ` AND a.thang = '${bosBopSelectedYear}'`;
    if (bosBopStartMonth && bosBopEndMonth) w += ` AND EXTRACT(MONTH FROM a.tgsp2d) BETWEEN ${bosBopStartMonth} AND ${bosBopEndMonth}`;
    if (bosBopSelectedProgram && bosBopSelectedProgram !== "all") w += ` AND a.nmprogram = '${bosBopSelectedProgram}'`;
    if (bosBopSelectedJenisBos && bosBopSelectedJenisBos !== "all") w += ` AND a.jenis_bos = '${bosBopSelectedJenisBos}'`;
    if (bosBopSelectedJenjang && bosBopSelectedJenjang !== "all") w += ` AND a.jenjang = '${bosBopSelectedJenjang}'`;
    const fKanwil = bosBopSelectedKanwil || ((role === "2" || role === "3") ? kdkanwil : "");
    if (fKanwil) w += ` AND c.kdkanwil = '${fKanwil}'`;
    const fKppn = bosBopSelectedKppn || (role === "3" ? kdkppn : "");
    if (fKppn) w += ` AND a.kdkppn = '${fKppn}'`;
    return `SELECT a.thang, c.kdkanwil, d.nmkanwil, a.kdkppn, e.nmkabkota AS nmkabkota_kppn, a.nmprogram, a.jenjang, a.status_sekolah, a.jenis_bos, a.kdlokasi_kedudukan, b.nmkabkota AS nmkabkota_sekolah,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgsp2d) = 1 THEN a.nilai ELSE 0 END) AS Januari, SUM(CASE WHEN EXTRACT(MONTH FROM a.tgsp2d) = 2 THEN a.nilai ELSE 0 END) AS Februari,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgsp2d) = 3 THEN a.nilai ELSE 0 END) AS Maret, SUM(CASE WHEN EXTRACT(MONTH FROM a.tgsp2d) = 4 THEN a.nilai ELSE 0 END) AS April,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgsp2d) = 5 THEN a.nilai ELSE 0 END) AS Mei, SUM(CASE WHEN EXTRACT(MONTH FROM a.tgsp2d) = 6 THEN a.nilai ELSE 0 END) AS Juni,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgsp2d) = 7 THEN a.nilai ELSE 0 END) AS Juli, SUM(CASE WHEN EXTRACT(MONTH FROM a.tgsp2d) = 8 THEN a.nilai ELSE 0 END) AS Agustus,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgsp2d) = 9 THEN a.nilai ELSE 0 END) AS September, SUM(CASE WHEN EXTRACT(MONTH FROM a.tgsp2d) = 10 THEN a.nilai ELSE 0 END) AS Oktober,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgsp2d) = 11 THEN a.nilai ELSE 0 END) AS November, SUM(CASE WHEN EXTRACT(MONTH FROM a.tgsp2d) = 12 THEN a.nilai ELSE 0 END) AS Desember,
    SUM(a.nilai) AS total_nilai, SUM(a.jumlah_penerima) AS total_siswa
    FROM tkd.bos_bop a LEFT JOIN dbref.t_kabkota_apbd b ON a.kdlokasi_kedudukan = REPLACE(b.kdkabkota, '.', '')
    LEFT JOIN dbref.t_kppn_2025 c ON a.kdkppn = c.kdkppn LEFT JOIN dbref.t_kanwil_2025 d ON c.kdkanwil = d.kdkanwil
    LEFT JOIN (SELECT kdkppn, MIN(nmkabkota) AS nmkabkota FROM dbref.t_kabkota_apbd GROUP BY kdkppn) e ON a.kdkppn = e.kdkppn
    ${w} GROUP BY a.thang, c.kdkanwil, d.nmkanwil, a.kdkppn, e.nmkabkota, a.nmprogram, a.jenjang, a.status_sekolah, a.jenis_bos, a.kdlokasi_kedudukan, b.nmkabkota
    ORDER BY a.nmprogram, a.jenjang, a.status_sekolah`;
  };

  const handleShowSQL = () => {
    setSqlQuery(activeTab === "tpg" ? generateTpgSQLQuery() : generateBosBopSQLQuery());
    setShowModalSQL(true);
  };
  const handleCloseSQL = () => setShowModalSQL(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(sqlQuery);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  const handleRefresh = () => window.location.reload();

  // ===== DOWNLOAD =====
  const convertTableDataToCSV = (data: any[]): string => {
    if (activeTab === "tpg") {
      const headers = ["No","Tahun","Periode","Kanwil","Nama Kanwil","KPPN","Nama KPPN","Lokasi","Jenis TKD","Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember","Total Setahun"];
      let csv = headers.join(",") + "\n";
      data.forEach((row, i) => {
        csv += [i + 1, row.thang, row.nm_periode, row.kode_kanwil, row.nm_kanwil, row.kppn, row.nm_kppn, row.nm_lokasi, row.jenis_tkd, row.Januari || 0, row.Februari || 0, row.Maret || 0, row.April || 0, row.Mei || 0, row.Juni || 0, row.Juli || 0, row.Agustus || 0, row.September || 0, row.Oktober || 0, row.November || 0, row.Desember || 0, row.total_setahun || 0].map(c => `"${c}"`).join(",") + "\n";
      });
      return csv;
    } else {
      const headers = ["No","Tahun","Kd Kanwil","Nama Kanwil","Kd KPPN","Nama KPPN (Wilayah)","Program","Jenjang","Status Sekolah","Jenis BOS","Kd Lokasi","Nama Lokasi Sekolah","Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember","Total Nilai","Total Siswa"];
      let csv = headers.join(",") + "\n";
      data.forEach((row, i) => {
        csv += [i + 1, row.thang, row.kdkanwil, row.nmkanwil, row.kdkppn, row.nmkabkota_kppn, row.nmprogram, row.jenjang, row.status_sekolah, row.jenis_bos, row.kdlokasi_kedudukan, row.nmkabkota_sekolah, row.Januari || 0, row.Februari || 0, row.Maret || 0, row.April || 0, row.Mei || 0, row.Juni || 0, row.Juli || 0, row.Agustus || 0, row.September || 0, row.Oktober || 0, row.November || 0, row.Desember || 0, row.total_nilai || 0, row.total_siswa || 0].map(c => `"${c}"`).join(",") + "\n";
      });
      return csv;
    }
  };

  const handleDownloadCSV = () => {
    const data = activeTab === "tpg" ? tpgTableData : bosBopTableData;
    if (data.length === 0) {
      SwalConfig.fire({ icon: "warning", title: "Tidak ada data", text: "Silakan tayang data terlebih dahulu" });
      return;
    }
    const csv = convertTableDataToCSV(data);
    const el = document.createElement("a");
    el.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv));
    el.setAttribute("download", activeTab === "tpg" ? `tpg_${tpgSelectedYear || "semua_tahun"}.csv` : `bos_bop_${bosBopSelectedYear || "semua_tahun"}.csv`);
    el.style.display = "none";
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  };

  const handleDownloadExcel = () => {
    const data = activeTab === "tpg" ? tpgTableData : bosBopTableData;
    if (data.length === 0) {
      SwalConfig.fire({ icon: "warning", title: "Tidak ada data", text: "Silakan tayang data terlebih dahulu" });
      return;
    }
    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    const sheetName = activeTab === "tpg" ? "TPG" : "BOS_BOP";
    xlsx.utils.book_append_sheet(wb, ws, sheetName);
    ws["!cols"] = activeTab === "tpg" ? Array(23).fill({ wch: 12 }) : Array(26).fill({ wch: 12 });
    xlsx.writeFile(wb, activeTab === "tpg" ? `tpg_${tpgSelectedYear || "semua_tahun"}.xlsx` : `bos_bop_${bosBopSelectedYear || "semua_tahun"}.xlsx`);
  };

  const handleDownloadPDF = () => {
    const data = activeTab === "tpg" ? tpgTableData : bosBopTableData;
    if (data.length === 0) {
      SwalConfig.fire({ icon: "warning", title: "Tidak ada data", text: "Silakan tayang data terlebih dahulu" });
      return;
    }
    const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n);
    let html = "";
    if (activeTab === "tpg") {
      html = `<html><head><style>body{font-family:Arial;font-size:9px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:3px}th{background:#52525B;color:white}tr:nth-child(even){background:#f2f2f2}.number{text-align:right}</style></head><body><h2>Laporan TPG ${tpgSelectedYear ? `Tahun ${tpgSelectedYear}` : "Semua Tahun"}</h2><table><thead><tr><th>No</th><th>Tahun</th><th>Periode</th><th>Kanwil</th><th>Nm Kanwil</th><th>KPPN</th><th>Nm KPPN</th><th>Lokasi</th><th>Jenis TKD</th><th>Jan</th><th>Feb</th><th>Mar</th><th>Apr</th><th>Mei</th><th>Jun</th><th>Jul</th><th>Ags</th><th>Sep</th><th>Okt</th><th>Nov</th><th>Des</th><th>Total</th></tr></thead><tbody>`;
      data.forEach((row, i) => {
        html += `<tr><td>${i + 1}</td><td>${row.thang}</td><td>${row.nm_periode}</td><td>${row.kode_kanwil}</td><td>${row.nm_kanwil}</td><td>${row.kppn}</td><td>${row.nm_kppn}</td><td>${row.nm_lokasi}</td><td>${row.jenis_tkd}</td><td class="number">${fmt(row.Januari || 0)}</td><td class="number">${fmt(row.Februari || 0)}</td><td class="number">${fmt(row.Maret || 0)}</td><td class="number">${fmt(row.April || 0)}</td><td class="number">${fmt(row.Mei || 0)}</td><td class="number">${fmt(row.Juni || 0)}</td><td class="number">${fmt(row.Juli || 0)}</td><td class="number">${fmt(row.Agustus || 0)}</td><td class="number">${fmt(row.September || 0)}</td><td class="number">${fmt(row.Oktober || 0)}</td><td class="number">${fmt(row.November || 0)}</td><td class="number">${fmt(row.Desember || 0)}</td><td class="number" style="font-weight:bold">${fmt(row.total_setahun || 0)}</td></tr>`;
      });
    } else {
      html = `<html><head><style>body{font-family:Arial;font-size:8px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:3px}th{background:#52525B;color:white;font-size:7px;text-align:center}tr:nth-child(even){background:#f2f2f2}.number{text-align:right}</style></head><body><h2>Laporan BOS BOP ${bosBopSelectedYear ? `Tahun ${bosBopSelectedYear}` : "Semua Tahun"}</h2><table><thead><tr><th rowspan="2">No</th><th rowspan="2">Tahun</th><th rowspan="2">Kd Kanwil</th><th rowspan="2">Nm Kanwil</th><th rowspan="2">Kd KPPN</th><th rowspan="2">Nm KPPN</th><th rowspan="2">Program</th><th rowspan="2">Jenjang</th><th rowspan="2">Status</th><th rowspan="2">Jenis BOS</th><th rowspan="2">Kd Lokasi</th><th rowspan="2">Nm Lokasi</th><th colspan="12">Realisasi Bulanan</th><th rowspan="2">Total Nilai</th><th rowspan="2">Total Siswa</th></tr><tr><th>Jan</th><th>Feb</th><th>Mar</th><th>Apr</th><th>Mei</th><th>Jun</th><th>Jul</th><th>Ags</th><th>Sep</th><th>Okt</th><th>Nov</th><th>Des</th></tr></thead><tbody>`;
      data.forEach((row, i) => {
        html += `<tr><td>${i + 1}</td><td>${row.thang}</td><td>${row.kdkanwil}</td><td>${row.nmkanwil}</td><td>${row.kdkppn}</td><td>${row.nmkabkota_kppn}</td><td>${row.nmprogram}</td><td>${row.jenjang}</td><td>${row.status_sekolah}</td><td>${row.jenis_bos}</td><td>${row.kdlokasi_kedudukan}</td><td>${row.nmkabkota_sekolah}</td><td class="number">${fmt(row.Januari || 0)}</td><td class="number">${fmt(row.Februari || 0)}</td><td class="number">${fmt(row.Maret || 0)}</td><td class="number">${fmt(row.April || 0)}</td><td class="number">${fmt(row.Mei || 0)}</td><td class="number">${fmt(row.Juni || 0)}</td><td class="number">${fmt(row.Juli || 0)}</td><td class="number">${fmt(row.Agustus || 0)}</td><td class="number">${fmt(row.September || 0)}</td><td class="number">${fmt(row.Oktober || 0)}</td><td class="number">${fmt(row.November || 0)}</td><td class="number">${fmt(row.Desember || 0)}</td><td class="number" style="font-weight:bold">${fmt(row.total_nilai || 0)}</td><td class="number" style="font-weight:bold">${fmt(row.total_siswa || 0)}</td></tr>`;
      });
    }
    html += `</tbody></table></body></html>`;
    const el = document.createElement("div");
    el.innerHTML = html;
    el.style.display = "none";
    document.body.appendChild(el);
    window.print();
    document.body.removeChild(el);
  };

  // ===== HANDLE TAYANG =====
  const handleTayangTpg = async () => {
    setTpgLoading(true);
    try {
      const data = await fetchData(generateTpgSQLQuery());
      setTpgTableData(data);
      setTpgCurrentPage(1);
      setTpgShowResults(true);
      SwalConfig.fire({ icon: "success", title: "Berhasil", text: `Data berhasil ditampilkan (${data.length} baris)` });
    } catch (error: any) {
      console.error(error);
      SwalConfig.fire({ icon: "error", title: "Error", text: error.response?.data?.message || "Gagal mengambil data" });
    } finally { setTpgLoading(false); }
  };

  const handleTayangBosBop = async () => {
    setBosBopLoading(true);
    try {
      const data = await fetchData(generateBosBopSQLQuery());
      setBosBopTableData(data);
      setBosBopCurrentPage(1);
      setBosBopShowResults(true);
      SwalConfig.fire({ icon: "success", title: "Berhasil", text: `Data berhasil ditampilkan (${data.length} baris)` });
    } catch (error: any) {
      console.error(error);
      SwalConfig.fire({ icon: "error", title: "Error", text: error.response?.data?.message || "Gagal mengambil data" });
    } finally { setBosBopLoading(false); }
  };

  // ===== EFFECTS =====
  useEffect(() => {
    fetchTpgYears();
    fetchTpgKanwil();
    fetchTpgKppn();
    fetchTpgPeriodes();
    fetchTpgGelombangs();
    fetchTpgJenisTkd();
    fetchBosBopYears();
    fetchBosBopKanwil();
    fetchBosBopKppn();
    fetchBosBopPrograms();
    fetchBosBopJenisBos();
    fetchBosBopJenjang();
  }, []);
  useEffect(() => { fetchTpgKppn(tpgSelectedkanwil); }, [tpgSelectedkanwil]);
  useEffect(() => { fetchBosBopKppn(bosBopSelectedKanwil); }, [bosBopSelectedKanwil]);

  return (
    <div className="dnf-container space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-800 p-1">
          <TabsTrigger value="tpg" className="text-sm">TPG (Tunjangan Profesi Guru)</TabsTrigger>
          <TabsTrigger value="bos_bop" className="text-sm">BOS / BOP (Dana Bantuan Operasional)</TabsTrigger>
        </TabsList>

        <TabsContent value="tpg" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Filter Data TPG</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] space-y-2">
                  <Label>Tahun</Label>
                  <Select value={tpgSelectedYear} onValueChange={setTpgSelectedYear}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="-- Semua --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">-- Semua --</SelectItem>
                      {tpgYearOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[250px] space-y-2">
                  <Label>Kanwil</Label>
                  <SearchableSelect
                    options={[
                      { label: "-- Semua --", value: "" },
                      ...tpgkanwilOptions
                    ]}
                    value={tpgSelectedkanwil}
                    onValueChange={setTpgSelectedkanwil}
                    disabled={role === "2" || role === "3"}
                    placeholder="-- Semua --"
                  />
                </div>

                <div className="flex-1 min-w-[250px] space-y-2">
                  <Label>KPPN</Label>
                  <SearchableSelect
                    options={[
                      { label: "-- Semua --", value: "" },
                      ...tpgkppnOptions
                    ]}
                    value={tpgSelectedkppn}
                    onValueChange={setTpgSelectedkppn}
                    disabled={role === "3"}
                    placeholder="-- Semua --"
                  />
                </div>

                <div className="flex-1 min-w-[200px] space-y-2">
                  <Label>Periode</Label>
                  <Select value={tpgSelectedPeriode} onValueChange={setTpgSelectedPeriode}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="-- Semua --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">-- Semua --</SelectItem>
                      {tpgPeriodeOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px] space-y-2">
                  <Label>Gelombang</Label>
                  <Select value={tpgSelectedGelombang} onValueChange={setTpgSelectedGelombang}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="-- Semua --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">-- Semua --</SelectItem>
                      {tpgGelombangOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px] space-y-2">
                  <Label>Jenis TKD</Label>
                  <Select value={tpgSelectedJenisTkd} onValueChange={setTpgSelectedJenisTkd}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="-- Semua --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">-- Semua --</SelectItem>
                      {tpgJenisTkdOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[300px] space-y-2">
                  <Label>Bulan SP2D</Label>
                  <div className="flex items-center gap-2">
                    <Select value={tpgStartMonth} onValueChange={setTpgStartMonth}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Dari" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm shrink-0">s.d.</span>
                    <Select value={tpgEndMonth} onValueChange={setTpgEndMonth}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sampai" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <ButtonRow
                onTayang={handleTayangTpg}
                onShowSQL={handleShowSQL}
                role={role}
                loadingResults={tpgLoading}
                onDownloadCSV={handleDownloadCSV}
                onDownloadExcel={handleDownloadExcel}
                onDownloadPDF={handleDownloadPDF}
                onRefresh={handleRefresh}
              />
            </CardContent>
          </Card>

          {tpgShowResults && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold">
                  Hasil Data TPG ({tpgTableData.length.toLocaleString("id-ID")} baris)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center rounded-md px-4 py-2 bg-zinc-800">
                  <span className="text-white text-sm">
                    Halaman {tpgCurrentPage} dari {Math.ceil(tpgTableData.length / itemsPerPage) || 1}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-white border-zinc-600 hover:bg-zinc-700"
                      onClick={() => setTpgCurrentPage(tpgCurrentPage - 1)}
                      disabled={tpgCurrentPage === 1}
                    >
                      ← Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-white border-zinc-600 hover:bg-zinc-700"
                      onClick={() => setTpgCurrentPage(tpgCurrentPage + 1)}
                      disabled={tpgCurrentPage >= Math.ceil(tpgTableData.length / itemsPerPage)}
                    >
                      Berikutnya →
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border border-zinc-800 overflow-auto max-h-[600px]">
                  <table className="w-full border-collapse text-sm" style={{ minWidth: "2200px", backgroundColor: "#1e293b", color: "#f8fafc" }}>
                    <thead className="sticky top-0 z-1 bg-[#1e293b] shadow-[0_2px_2px_-1px_rgba(0,0,0,0.4)]">
                      <tr>
                        <th className="border border-zinc-700 p-2 text-left" style={{ width: "40px" }}>No</th>
                        <th className="border border-zinc-700 p-2 text-left">Tahun</th>
                        <th className="border border-zinc-700 p-2 text-left">Periode</th>
                        <th className="border border-zinc-700 p-2 text-left">Kanwil</th>
                        <th className="border border-zinc-700 p-2 text-left">Nama Kanwil</th>
                        <th className="border border-zinc-700 p-2 text-left">KPPN</th>
                        <th className="border border-zinc-700 p-2 text-left">Nama KPPN</th>
                        <th className="border border-zinc-700 p-2 text-left">Lokasi</th>
                        <th className="border border-zinc-700 p-2 text-left">Jenis TKD</th>
                        {["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"].map((m) => (
                          <th key={m} className="border border-zinc-700 p-2 text-left" style={{ minWidth: "90px" }}>{m}</th>
                        ))}
                        <th className="border border-zinc-700 p-2 text-left" style={{ minWidth: "120px" }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tpgTableData
                        .slice((tpgCurrentPage - 1) * itemsPerPage, tpgCurrentPage * itemsPerPage)
                        .map((row, i) => (
                          <tr key={i} className="hover:bg-zinc-700/50">
                            <td className="border border-zinc-700 p-2">{(tpgCurrentPage - 1) * itemsPerPage + i + 1}</td>
                            <td className="border border-zinc-700 p-2">{row.thang}</td>
                            <td className="border border-zinc-700 p-2">{row.nm_periode}</td>
                            <td className="border border-zinc-700 p-2">{row.kode_kanwil}</td>
                            <td className="border border-zinc-700 p-2">{row.nm_kanwil}</td>
                            <td className="border border-zinc-700 p-2">{row.kppn}</td>
                            <td className="border border-zinc-700 p-2">{row.nm_kppn}</td>
                            <td className="border border-zinc-700 p-2">{row.nm_lokasi}</td>
                            <td className="border border-zinc-700 p-2">{row.jenis_tkd}</td>
                            {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m) => (
                              <td key={m} className="border border-zinc-700 p-2 text-right">
                                {new Intl.NumberFormat("id-ID").format(row[m] || 0)}
                              </td>
                            ))}
                            <td className="border border-zinc-700 p-2 text-right font-bold">
                              {new Intl.NumberFormat("id-ID").format(row.total_setahun || 0)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bos_bop" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Filter Data BOS / BOP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] space-y-2">
                  <Label>Tahun</Label>
                  <Select value={bosBopSelectedYear} onValueChange={setBosBopSelectedYear}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="-- Semua --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">-- Semua --</SelectItem>
                      {bosBopYearOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[250px] space-y-2">
                  <Label>Kanwil</Label>
                  <SearchableSelect
                    options={[
                      { label: "-- Semua --", value: "" },
                      ...bosBopKanwilOptions
                    ]}
                    value={bosBopSelectedKanwil}
                    onValueChange={setBosBopSelectedKanwil}
                    disabled={role === "2" || role === "3"}
                    placeholder="-- Semua --"
                  />
                </div>

                <div className="flex-1 min-w-[250px] space-y-2">
                  <Label>KPPN</Label>
                  <SearchableSelect
                    options={[
                      { label: "-- Semua --", value: "" },
                      ...bosBopKppnOptions
                    ]}
                    value={bosBopSelectedKppn}
                    onValueChange={setBosBopSelectedKppn}
                    disabled={role === "3"}
                    placeholder="-- Semua --"
                  />
                </div>

                <div className="flex-1 min-w-[200px] space-y-2">
                  <Label>Program</Label>
                  <Select value={bosBopSelectedProgram} onValueChange={setBosBopSelectedProgram}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="-- Semua --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">-- Semua --</SelectItem>
                      {bosBopProgramOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px] space-y-2">
                  <Label>Jenis BOS</Label>
                  <Select value={bosBopSelectedJenisBos} onValueChange={setBosBopSelectedJenisBos}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="-- Semua --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">-- Semua --</SelectItem>
                      {bosBopJenisBosOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px] space-y-2">
                  <Label>Jenjang</Label>
                  <Select value={bosBopSelectedJenjang} onValueChange={setBosBopSelectedJenjang}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="-- Semua --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">-- Semua --</SelectItem>
                      {bosBopJenjangOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[300px] space-y-2">
                  <Label>Bulan SP2D</Label>
                  <div className="flex items-center gap-2">
                    <Select value={bosBopStartMonth} onValueChange={setBosBopStartMonth}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Dari" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm shrink-0">s.d.</span>
                    <Select value={bosBopEndMonth} onValueChange={setBosBopEndMonth}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sampai" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <ButtonRow
                onTayang={handleTayangBosBop}
                onShowSQL={handleShowSQL}
                role={role}
                loadingResults={bosBopLoading}
                onDownloadCSV={handleDownloadCSV}
                onDownloadExcel={handleDownloadExcel}
                onDownloadPDF={handleDownloadPDF}
                onRefresh={handleRefresh}
              />
            </CardContent>
          </Card>

          {bosBopShowResults && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold">
                  Hasil Data BOS / BOP ({bosBopTableData.length.toLocaleString("id-ID")} baris)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center rounded-md px-4 py-2 bg-zinc-800">
                  <span className="text-white text-sm">
                    Halaman {bosBopCurrentPage} dari {Math.ceil(bosBopTableData.length / itemsPerPage) || 1}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-white border-zinc-600 hover:bg-zinc-700"
                      onClick={() => setBosBopCurrentPage(bosBopCurrentPage - 1)}
                      disabled={bosBopCurrentPage === 1}
                    >
                      ← Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-white border-zinc-600 hover:bg-zinc-700"
                      onClick={() => setBosBopCurrentPage(bosBopCurrentPage + 1)}
                      disabled={bosBopCurrentPage >= Math.ceil(bosBopTableData.length / itemsPerPage)}
                    >
                      Berikutnya →
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border border-zinc-800 overflow-auto max-h-[600px]">
                  <table className="w-full border-collapse text-sm" style={{ minWidth: "2600px", backgroundColor: "#1e293b", color: "#f8fafc" }}>
                    <thead className="sticky top-0 z-1 bg-[#1e293b] shadow-[0_2px_2px_-1px_rgba(0,0,0,0.4)]">
                      <tr>
                        <th className="border border-zinc-700 p-2 text-left" style={{ width: "40px" }}>No</th>
                        <th className="border border-zinc-700 p-2 text-left">Tahun</th>
                        <th className="border border-zinc-700 p-2 text-left">Kanwil</th>
                        <th className="border border-zinc-700 p-2 text-left">Nama Kanwil</th>
                        <th className="border border-zinc-700 p-2 text-left">KPPN</th>
                        <th className="border border-zinc-700 p-2 text-left">Nama KPPN</th>
                        <th className="border border-zinc-700 p-2 text-left">Program</th>
                        <th className="border border-zinc-700 p-2 text-left">Jenjang</th>
                        <th className="border border-zinc-700 p-2 text-left">Status</th>
                        <th className="border border-zinc-700 p-2 text-left">Jenis BOS</th>
                        <th className="border border-zinc-700 p-2 text-left">Lokasi</th>
                        {["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"].map((m) => (
                          <th key={m} className="border border-zinc-700 p-2 text-left" style={{ minWidth: "90px" }}>{m}</th>
                        ))}
                        <th className="border border-zinc-700 p-2 text-left" style={{ minWidth: "120px" }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bosBopTableData
                        .slice((bosBopCurrentPage - 1) * itemsPerPage, bosBopCurrentPage * itemsPerPage)
                        .map((row, i) => (
                          <tr key={i} className="hover:bg-zinc-700/50">
                            <td className="border border-zinc-700 p-2">{(bosBopCurrentPage - 1) * itemsPerPage + i + 1}</td>
                            <td className="border border-zinc-700 p-2">{row.thang}</td>
                            <td className="border border-zinc-700 p-2">{row.kdkanwil}</td>
                            <td className="border border-zinc-700 p-2">{row.nmkanwil}</td>
                            <td className="border border-zinc-700 p-2">{row.kdkppn}</td>
                            <td className="border border-zinc-700 p-2">{row.nmkabkota_kppn}</td>
                            <td className="border border-zinc-700 p-2">{row.nmprogram}</td>
                            <td className="border border-zinc-700 p-2">{row.jenjang}</td>
                            <td className="border border-zinc-700 p-2">{row.status_sekolah}</td>
                            <td className="border border-zinc-700 p-2">{row.jenis_bos}</td>
                            <td className="border border-zinc-700 p-2">{row.nmkabkota_sekolah}</td>
                            {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m) => (
                              <td key={m} className="border border-zinc-700 p-2 text-right">
                                {new Intl.NumberFormat("id-ID").format(row[m] || 0)}
                              </td>
                            ))}
                            <td className="border border-zinc-700 p-2 text-right font-bold">
                              {new Intl.NumberFormat("id-ID").format(row.total_nilai || 0)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {showModalSQL && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <Card className="w-full max-w-4xl bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">SQL Query</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleCloseSQL} className="text-white hover:bg-zinc-800">
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="p-4 bg-black rounded-lg overflow-auto max-h-[500px] text-green-400 text-xs whitespace-pre-wrap">
                  {sqlQuery}
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={handleCopy}
                >
                  {isCopied ? "Copied!" : "Copy SQL"}
                </Button>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={handleCloseSQL}>Close</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DNF;
