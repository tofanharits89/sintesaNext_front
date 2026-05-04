"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { SearchableSelect } from "@/components/ui/searchable-select";

// Interface for select options
interface SelectOption {
  label: string;
  value: string;
}

// Interface for table data
interface DakFisikData {
  thang: string;
  kdlokasi: string;
  pemda: string;
  kdkanwil: string;
  kdkppn: string;
  nmkppn: string;
  kdakun: string;
  jenis_dana: string;
  kdbidang: string;
  nmbidang: string;
  kdsubidang: string;
  nmsubidang: string;
  pagu: number;
  total_penyaluran: number;
  sisa_pagu: number;
  prosentase: number;
  Jan: number;
  Feb: number;
  Mar: number;
  Apr: number;
  Mei: number;
  Jun: number;
  Jul: number;
  Ags: number;
  Sep: number;
  Okt: number;
  Nov: number;
  Des: number;
  [key: string]: any;
}

// Configure SweetAlert2 default settings with isolated classes
const SwalConfig = Swal.mixin({
  customClass: {
    container: "dak-fisik-swal-container",
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
    document.body.classList.add("dak-fisik-swal");
  },
  didClose: () => {
    document.body.classList.remove("dak-fisik-swal");
  },
});

// No custom Section/Field components needed, using Shadcn directly

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

const DakFisik: React.FC = () => {
  const { user } = useAuth();
  const role =
    user?.role === "kppn" ? "3" : user?.role === "kanwil_djpb" ? "2" : "0";
  const kdkanwil = user?.kdkanwil ?? "";
  const kdkppn = user?.kdkppn ?? "";
  const year = new Date().getFullYear();

  // State untuk filter
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedkppn, setSelectedkppn] = useState<string>("");
  const [kppnOptions, setKppnOptions] = useState<SelectOption[]>([]);
  const [selectedkanwil, setSelectedkanwil] = useState<string>("");
  const [kanwilOptions, setKanwilOptions] = useState<SelectOption[]>([]);
  const [yearOptions, setYearOptions] = useState<SelectOption[]>([]);
  const [selectedLokasi, setSelectedLokasi] = useState<string>("");
  const [lokasiOptions, setLokasiOptions] = useState<SelectOption[]>([]);
  const [selectedJenisDana, setSelectedJenisDana] = useState<string>("");
  const [jenisDanaOptions, setJenisDanaOptions] = useState<SelectOption[]>([]);
  const [selectedBidang, setSelectedBidang] = useState<string>("");
  const [bidangOptions, setBidangOptions] = useState<SelectOption[]>([]);
  const [selectedSubBidang, setSelectedSubBidang] = useState<string>("");
  const [subBidangOptions, setSubBidangOptions] = useState<SelectOption[]>([]);

  // Month Filters (Bulan SP2D)
  const [startMonth, setStartMonth] = useState<string>("1");
  const [endMonth, setEndMonth] = useState<string>("12");

  // State untuk hasil Tayang
  const [showResults, setShowResults] = useState<boolean>(false);
  const [tableData, setTableData] = useState<DakFisikData[]>([]);
  const [loadingResults, setLoadingResults] = useState<boolean>(false);

  // State untuk SQL Modal
  const [showModalSQL, setShowModalSQL] = useState<boolean>(false);
  const [sqlQuery, setSqlQuery] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // State untuk Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  // Fetch tahun data
  const fetchYearData = async () => {
    try {
      const query =
        "SELECT DISTINCT thang FROM tkd.dak_fisik ORDER BY thang DESC";
      const encodedQuery = encodeURIComponent(query);
      const API_BASE = process.env.NEXT_PUBLIC_DAKFISIK_DNF_DATA || "/api/v1/transfer-daerah/dataset/query?sql=";
      const response = await http.get(
        `${API_BASE}${encodedQuery}`,
      );
      const years = response.data.result || [];
      setYearOptions(
        years.map((y: any) => ({ label: String(y.thang), value: String(y.thang) })),
      );
      if (years.length > 0) {
        setSelectedYear(String(years[0].thang));
      } else {
        setSelectedYear(String(year));
      }
    } catch (error) {
      console.error("Error fetching years:", error);
    }
  };

  const fetchKanwilData = async () => {
    try {
      let query =
        "SELECT kdkanwil, MIN(nmkanwil) AS nmkanwil FROM dbref.t_kanwil_2025 WHERE kdkanwil IS NOT NULL GROUP BY kdkanwil ORDER BY kdkanwil ASC";

      if ((role === "2" || role === "3") && kdkanwil) {
        query = `SELECT kdkanwil, MIN(nmkanwil) AS nmkanwil FROM dbref.t_kanwil_2025 WHERE kdkanwil = '${kdkanwil}' GROUP BY kdkanwil`;
      }

      const encodedQuery = encodeURIComponent(query);
      const API_BASE = process.env.NEXT_PUBLIC_DAKFISIK_DNF_DATA || "/api/v1/transfer-daerah/dataset/query?sql=";
      const response = await http.get(
        `${API_BASE}${encodedQuery}`,
      );
      const kanwil = response.data.result || [];
      setKanwilOptions(
        kanwil.map((k: any) => ({
          label: `${k.kdkanwil} - ${k.nmkanwil}`,
          value: String(k.kdkanwil),
        })),
      );

      if ((role === "2" || role === "3") && kdkanwil) {
        setSelectedkanwil(kdkanwil);
      } else {
        setSelectedkanwil("");
      }
    } catch (error) {
      console.error("Error fetching kanwil:", error);
    }
  };

  const fetchkppnData = async (selectedKanwil = "") => {
    try {
      let query = "";

      if (role === "3" && kdkppn) {
        query = `SELECT kdkppn, MIN(nmkppn) AS nmkppn FROM dbref.t_kppn_2026 WHERE kdkppn = '${kdkppn}' GROUP BY kdkppn ORDER BY kdkppn ASC`;
      } else if (role === "2" && kdkanwil) {
        query = `SELECT kdkppn, MIN(nmkppn) AS nmkppn FROM dbref.t_kppn_2026 WHERE kdkanwil = '${kdkanwil}' GROUP BY kdkppn ORDER BY kdkppn ASC`;
      } else if (selectedKanwil) {
        query = `SELECT kdkppn, MIN(nmkppn) AS nmkppn FROM dbref.t_kppn_2026 WHERE kdkanwil = '${selectedKanwil}' GROUP BY kdkppn ORDER BY kdkppn ASC`;
      } else {
        query =
          "SELECT kdkppn, MIN(nmkppn) AS nmkppn FROM dbref.t_kppn_2026 WHERE kdkppn IS NOT NULL GROUP BY kdkppn ORDER BY kdkppn ASC";
      }

      const encodedQuery = encodeURIComponent(query);
      const API_BASE = process.env.NEXT_PUBLIC_DAKFISIK_DNF_DATA || "/api/v1/transfer-daerah/dataset/query?sql=";
      const response = await http.get(
        `${API_BASE}${encodedQuery}`,
      );
      const kppn = response.data.result || [];
      setKppnOptions(
        kppn.map((k: any) => ({
          label: `${k.kdkppn} - ${k.nmkppn || "N/A"}`,
          value: String(k.kdkppn),
        })),
      );

      if (role === "3" && kdkppn) {
        setSelectedkppn(kdkppn);
      } else {
        setSelectedkppn("");
      }
    } catch (error) {
      console.error("Error fetching kppn:", error);
    }
  };

  const fetchLokasiData = async () => {
    try {
      const query =
        "SELECT kdlokasi, MIN(nmlokasi) AS nmlokasi FROM tkd.dak_fisik GROUP BY kdlokasi ORDER BY nmlokasi";
      const encodedQuery = encodeURIComponent(query);
      const API_BASE = process.env.NEXT_PUBLIC_DAKFISIK_DNF_DATA || "/api/v1/transfer-daerah/dataset/query?sql=";
      const response = await http.get(
        `${API_BASE}${encodedQuery}`,
      );
      const lokasi = response.data.result || [];
      setLokasiOptions(
        lokasi.map((l: any) => ({
          label: `${l.kdlokasi} - ${l.nmlokasi}`,
          value: String(l.kdlokasi),
        })),
      );
    } catch (error) {
      console.error("Error fetching lokasi:", error);
    }
  };

  const fetchJenisDanaData = async () => {
    try {
      const query =
        "SELECT DISTINCT jenis_dana FROM tkd.dak_fisik WHERE jenis_dana IS NOT NULL ORDER BY jenis_dana";
      const encodedQuery = encodeURIComponent(query);
      const API_BASE = process.env.NEXT_PUBLIC_DAKFISIK_DNF_DATA || "/api/v1/transfer-daerah/dataset/query?sql=";
      const response = await http.get(
        `${API_BASE}${encodedQuery}`,
      );
      const jenisDana = response.data.result || [];
      setJenisDanaOptions(
        jenisDana.map((j: any) => ({
          label: j.jenis_dana,
          value: j.jenis_dana,
        })),
      );
    } catch (error) {
      console.error("Error fetching jenis dana:", error);
    }
  };

  const fetchBidangData = async () => {
    try {
      const query =
        "SELECT kdbidang, MIN(nmbidang) AS nmbidang FROM tkd.dak_fisik GROUP BY kdbidang ORDER BY nmbidang";
      const encodedQuery = encodeURIComponent(query);
      const API_BASE = process.env.NEXT_PUBLIC_DAKFISIK_DNF_DATA || "/api/v1/transfer-daerah/dataset/query?sql=";
      const response = await http.get(
        `${API_BASE}${encodedQuery}`,
      );
      const bidang = response.data.result || [];
      setBidangOptions(
        bidang.map((b: any) => ({
          label: `${b.kdbidang} - ${b.nmbidang}`,
          value: String(b.kdbidang),
        })),
      );
    } catch (error) {
      console.error("Error fetching bidang:", error);
    }
  };

  const fetchSubBidangData = async (kdbidang: string | null = null) => {
    try {
      let query = "SELECT kdsubidang, MIN(nmsubidang) AS nmsubidang FROM tkd.dak_fisik";
      if (kdbidang && kdbidang !== "all") {
        query += ` WHERE kdbidang = '${kdbidang}'`;
      }
      query += " GROUP BY kdsubidang ORDER BY nmsubidang";
      const encodedQuery = encodeURIComponent(query);
      const API_BASE = process.env.NEXT_PUBLIC_DAKFISIK_DNF_DATA || "/api/v1/transfer-daerah/dataset/query?sql=";
      const response = await http.get(
        `${API_BASE}${encodedQuery}`,
      );
      const subBidang = response.data.result || [];
      setSubBidangOptions(
        subBidang.map((sb: any) => ({
          label: `${sb.kdsubidang} - ${sb.nmsubidang}`,
          value: String(sb.kdsubidang),
        })),
      );
    } catch (error) {
      console.error("Error fetching sub-bidang:", error);
    }
  };

  // Generate SQL Query
  const generateSQLQuery = (): string => {
    const filterKanwil =
      selectedkanwil || (role === "2" || role === "3" ? kdkanwil : "");
    const filterKppn = selectedkppn || (role === "3" ? kdkppn : "");

    let where = "WHERE 1=1";
    if (selectedYear && selectedYear !== "all") where += ` AND a.thang = '${selectedYear}'`;
    if (filterKanwil) where += ` AND b.kdkanwil = '${filterKanwil}'`;
    if (filterKppn) where += ` AND a.kdkppn = '${filterKppn}'`;
    if (selectedLokasi) where += ` AND a.kdlokasi = '${selectedLokasi}'`;
    if (startMonth && endMonth)
      where += ` AND EXTRACT(MONTH FROM a.tgsp2d) BETWEEN ${startMonth} AND ${endMonth}`;
    if (selectedJenisDana && selectedJenisDana !== "all")
      where += ` AND a.jenis_dana = '${selectedJenisDana}'`;
    if (selectedBidang && selectedBidang !== "all") where += ` AND a.kdbidang = '${selectedBidang}'`;
    if (selectedSubBidang && selectedSubBidang !== "all")
      where += ` AND a.kdsubidang = '${selectedSubBidang}'`;

    return `
SELECT
    a.thang,
    a.kdlokasi,
    a.nmlokasi AS pemda,
    b.kdkanwil,
    a.kdkppn,
    b.nmkppn,
    a.kdakun,
    a.jenis_dana,
    a.kdbidang,
    a.nmbidang,
    a.kdsubidang,
    a.nmsubidang,
    0 AS pagu,
    SUM(a.nilai) AS total_penyaluran,
    0 AS sisa_pagu,
    0 AS prosentase,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgsp2d) = 1  THEN a.nilai ELSE 0 END) AS Jan,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgsp2d) = 2  THEN a.nilai ELSE 0 END) AS Feb,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgsp2d) = 3  THEN a.nilai ELSE 0 END) AS Mar,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgsp2d) = 4  THEN a.nilai ELSE 0 END) AS Apr,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgsp2d) = 5  THEN a.nilai ELSE 0 END) AS Mei,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgsp2d) = 6  THEN a.nilai ELSE 0 END) AS Jun,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgsp2d) = 7  THEN a.nilai ELSE 0 END) AS Jul,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgsp2d) = 8  THEN a.nilai ELSE 0 END) AS Ags,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgsp2d) = 9  THEN a.nilai ELSE 0 END) AS Sep,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgsp2d) = 10 THEN a.nilai ELSE 0 END) AS Okt,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgsp2d) = 11 THEN a.nilai ELSE 0 END) AS Nov,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgsp2d) = 12 THEN a.nilai ELSE 0 END) AS Des
FROM tkd.dak_fisik a
LEFT JOIN dbref.t_kppn_2025 b ON a.kdkppn = b.kdkppn
${where}
GROUP BY
    a.thang, a.kdlokasi, a.nmlokasi, b.kdkanwil,
    a.kdkppn, b.nmkppn, a.kdakun, a.jenis_dana,
    a.kdbidang, a.nmbidang, a.kdsubidang, a.nmsubidang
ORDER BY a.kdlokasi, a.kdsubidang, a.kdkppn`;
  };

  const handleShowSQL = async () => {
    const query = generateSQLQuery();
    setSqlQuery(query);
    setShowModalSQL(true);
  };

  const handleCloseSQL = () => {
    setShowModalSQL(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlQuery);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleDownloadCSV = async () => {
    if (tableData.length === 0) {
      SwalConfig.fire({
        icon: "warning",
        title: "Tidak ada data",
        text: "Silakan tayang data terlebih dahulu",
      });
      return;
    }

    const csv = convertTableDataToCSV(tableData);
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csv),
    );
    element.setAttribute("download", `dak_fisik_${selectedYear}.csv`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadExcel = async () => {
    if (tableData.length === 0) {
      SwalConfig.fire({
        icon: "warning",
        title: "Tidak ada data",
        text: "Silakan tayang data terlebih dahulu",
      });
      return;
    }

    const dataToExport = tableData.map((row, index) => ({
      No: index + 1,
      Tahun: row.thang,
      "Kode Lokasi": row.kdlokasi,
      Pemda: row.pemda,
      "Kode Kanwil": row.kdkanwil,
      "Kode KPPN": row.kdkppn,
      "Nama KPPN": row.nmkppn,
      Akun: row.kdakun,
      "Jenis Dana": row.jenis_dana,
      "Kode Bidang": row.kdbidang,
      "Nama Bidang": row.nmbidang,
      "Kode Sub Bidang": row.kdsubidang,
      "Nama Sub Bidang": row.nmsubidang,
      Pagu: row.pagu,
      "Total Penyaluran": row.total_penyaluran,
      "Sisa Pagu": row.sisa_pagu,
      Prosentase: row.prosentase,
      Januari: row.Jan,
      Februari: row.Feb,
      Maret: row.Mar,
      April: row.Apr,
      Mei: row.Mei,
      Juni: row.Jun,
      Juli: row.Jul,
      Agustus: row.Ags,
      September: row.Sep,
      Oktober: row.Okt,
      November: row.Nov,
      Desember: row.Des,
    }));

    const ws = xlsx.utils.json_to_sheet(dataToExport);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "DAK Fisik");

    const colWidths = [
      { wch: 5 },
      { wch: 6 },
      { wch: 10 },
      { wch: 30 },
      { wch: 10 },
      { wch: 10 },
      { wch: 20 },
      { wch: 8 },
      { wch: 12 },
      { wch: 8 },
      { wch: 25 },
      { wch: 8 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
    ];
    ws["!cols"] = colWidths;

    xlsx.writeFile(wb, `dak_fisik_${selectedYear}.xlsx`);
  };

  const handleDownloadPDF = async () => {
    if (tableData.length === 0) {
      SwalConfig.fire({
        icon: "warning",
        title: "Tidak ada data",
        text: "Silakan tayang data terlebih dahulu",
      });
      return;
    }

    const html = convertTableDataToPDF(tableData);
    const element = document.createElement("div");
    element.innerHTML = html;
    element.style.display = "none";
    document.body.appendChild(element);

    window.print();
    document.body.removeChild(element);
  };

  const convertTableDataToCSV = (data: DakFisikData[]): string => {
    const headers = [
      "No",
      "Tahun",
      "Kode Lokasi",
      "Pemda",
      "Kode Kanwil",
      "Kode KPPN",
      "Nama KPPN",
      "Akun",
      "Jenis Dana",
      "Kode Bidang",
      "Nama Bidang",
      "Kode Sub Bidang",
      "Nama Sub Bidang",
      "Pagu",
      "Total Penyaluran",
      "Sisa Pagu",
      "Prosentase",
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    let csv = headers.join(",") + "\n";

    data.forEach((row, index) => {
      csv += [
        index + 1,
        row.thang,
        row.kdlokasi,
        row.pemda,
        row.kdkanwil,
        row.kdkppn,
        row.nmkppn,
        row.kdakun,
        row.jenis_dana,
        row.kdbidang,
        row.nmbidang,
        row.kdsubidang,
        row.nmsubidang,
        row.pagu,
        row.total_penyaluran,
        row.sisa_pagu,
        row.prosentase,
        row.Jan,
        row.Feb,
        row.Mar,
        row.Apr,
        row.Mei,
        row.Jun,
        row.Jul,
        row.Ags,
        row.Sep,
        row.Okt,
        row.Nov,
        row.Des,
      ]
        .map((cell) => `"${cell ?? ""}"`)
        .join(",");
      csv += "\n";
    });

    return csv;
  };

  const convertTableDataToPDF = (data: DakFisikData[]): string => {
    let html = `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; font-size: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 4px; text-align: left; }
          th { background-color: #52525B; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          h2 { text-align: center; }
          .number { text-align: right; }
        </style>
      </head>
      <body>
        <h2>Laporan DAK Fisik Tahun ${selectedYear}</h2>
        <table>
          <thead>
            <tr>
              <th>No</th><th>Pemda</th><th>Kanwil</th><th>KPPN</th>
              <th>Bidang</th><th>Sub Bidang</th><th>Pagu</th><th>Real.</th>
              <th>Sisa</th><th>%</th><th>Jan</th><th>Feb</th><th>Mar</th>
              <th>Apr</th><th>Mei</th><th>Jun</th><th>Jul</th><th>Ags</th>
              <th>Sep</th><th>Okt</th><th>Nov</th><th>Des</th>
            </tr>
          </thead>
          <tbody>
    `;

    data.forEach((row, index) => {
      const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n);
      html += `
        <tr>
          <td>${index + 1}</td>
          <td>${row.pemda || row.kdlokasi}</td>
          <td>${row.kdkanwil}</td>
          <td>${row.nmkppn || row.kdkppn}</td>
          <td>${row.nmbidang}</td>
          <td>${row.nmsubidang}</td>
          <td class="number">${fmt(row.pagu)}</td>
          <td class="number">${fmt(row.total_penyaluran)}</td>
          <td class="number">${fmt(row.sisa_pagu)}</td>
          <td class="number">${row.prosentase}%</td>
          <td class="number">${fmt(row.Jan)}</td>
          <td class="number">${fmt(row.Feb)}</td>
          <td class="number">${fmt(row.Mar)}</td>
          <td class="number">${fmt(row.Apr)}</td>
          <td class="number">${fmt(row.Mei)}</td>
          <td class="number">${fmt(row.Jun)}</td>
          <td class="number">${fmt(row.Jul)}</td>
          <td class="number">${fmt(row.Ags)}</td>
          <td class="number">${fmt(row.Sep)}</td>
          <td class="number">${fmt(row.Okt)}</td>
          <td class="number">${fmt(row.Nov)}</td>
          <td class="number">${fmt(row.Des)}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;
    return html;
  };

  const handleTayang = async () => {
    if (!selectedYear) {
      SwalConfig.fire({
        icon: "warning",
        title: "Peringatan",
        text: "Silakan pilih tahun terlebih dahulu",
      });
      return;
    }

    setLoadingResults(true);
    try {
      const query = generateSQLQuery();
      const encodedQuery = encodeURIComponent(query);
      const API_BASE = process.env.NEXT_PUBLIC_DAKFISIK_DNF_DATA || "/api/v1/transfer-daerah/dataset/query?sql=";
      const response = await http.get(
        `${API_BASE}${encodedQuery}`,
      );

      const data = response.data.result || [];
      setTableData(data);
      setCurrentPage(1);
      setShowResults(true);

      SwalConfig.fire({
        icon: "success",
        title: "Berhasil",
        text: `Data berhasil ditampilkan (${data.length} baris)`,
      });
    } catch (error: any) {
      console.error("Error fetching data:", error);
      SwalConfig.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Gagal mengambil data",
      });
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    fetchYearData();
    fetchKanwilData();
    fetchkppnData();
    fetchLokasiData();
    fetchJenisDanaData();
    fetchBidangData();
    fetchSubBidangData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchkppnData(selectedkanwil);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedkanwil]);

  useEffect(() => {
    if (selectedBidang) {
      fetchSubBidangData(selectedBidang);
    } else {
      fetchSubBidangData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBidang]);

  return (
    <div className="dak-fisik-container">
      <div className="mb-4">
        <h3 className="mb-3 font-semibold text-lg">DAK Fisik</h3>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Filter Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label>Tahun</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="-- Semua --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">-- Semua --</SelectItem>
                  {yearOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[250px] space-y-2">
              <Label>Kanwil</Label>
              <SearchableSelect
                options={[
                  { label: "-- Semua --", value: "" },
                  ...kanwilOptions
                ]}
                value={selectedkanwil}
                onValueChange={setSelectedkanwil}
                disabled={role === "2" || role === "3"}
                placeholder="-- Semua --"
              />
            </div>

            <div className="flex-1 min-w-[250px] space-y-2">
              <Label>KPPN</Label>
              <SearchableSelect
                options={[
                  { label: "-- Semua --", value: "" },
                  ...kppnOptions
                ]}
                value={selectedkppn}
                onValueChange={setSelectedkppn}
                disabled={role === "3"}
                placeholder="-- Semua --"
              />
            </div>

            <div className="flex-1 min-w-[250px] space-y-2">
              <Label>Lokasi</Label>
              <SearchableSelect
                options={[
                  { label: "-- Semua --", value: "" },
                  ...lokasiOptions
                ]}
                value={selectedLokasi}
                onValueChange={setSelectedLokasi}
                placeholder="-- Semua --"
              />
            </div>

            <div className="flex-1 min-w-[200px] space-y-2">
              <Label>Jenis Dana</Label>
              <Select
                value={selectedJenisDana}
                onValueChange={setSelectedJenisDana}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="-- Semua --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">-- Semua --</SelectItem>
                  {jenisDanaOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px] space-y-2">
              <Label>Bidang</Label>
              <Select value={selectedBidang} onValueChange={setSelectedBidang}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="-- Semua --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">-- Semua --</SelectItem>
                  {bidangOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBidang && (
              <div className="flex-1 min-w-[200px] space-y-2">
                <Label>Sub Bidang</Label>
                <Select
                  value={selectedSubBidang}
                  onValueChange={setSelectedSubBidang}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="-- Semua --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">-- Semua --</SelectItem>
                    {subBidangOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex-1 min-w-[300px] space-y-2">
              <Label>Bulan SP2D</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Select value={startMonth} onValueChange={setStartMonth}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Dari" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <span className="text-sm px-1 shrink-0">s.d.</span>
                <div className="flex-1">
                  <Select value={endMonth} onValueChange={setEndMonth}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sampai" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <ButtonRow
            onTayang={handleTayang}
            onShowSQL={handleShowSQL}
            role={role}
            loadingResults={loadingResults}
            onDownloadCSV={handleDownloadCSV}
            onDownloadExcel={handleDownloadExcel}
            onDownloadPDF={handleDownloadPDF}
            onRefresh={handleRefresh}
          />
        </CardContent>
      </Card>

      {/* Results Section */}
      {showResults && (
        <div className="results-section space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">
                Hasil Data ({tableData.length.toLocaleString("id-ID")} baris)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="mb-3 flex justify-between items-center rounded-md px-4 py-2 bg-zinc-800"
              >
                <span className="text-white text-sm">
                  Halaman {currentPage} dari{" "}
                  {Math.ceil(tableData.length / itemsPerPage) || 1}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-white border-zinc-600 hover:bg-zinc-700"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ← Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-white border-zinc-600 hover:bg-zinc-700"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={
                      currentPage >= Math.ceil(tableData.length / itemsPerPage)
                    }
                  >
                    Berikutnya →
                  </Button>
                </div>
              </div>

              <div
                style={{
                  overflowX: "auto",
                  overflowY: "auto",
                  maxHeight: "600px",
                  display: "block",
                  WebkitOverflowScrolling: "touch",
                  scrollBehavior: "smooth",
                }}
                className="rounded-md border border-zinc-800"
              >
                <table
                  className="w-full border-collapse"
                  style={{
                    minWidth: "2500px",
                    marginBottom: 0,
                    wordWrap: "break-word" as const,
                    tableLayout: "auto",
                    fontSize: "0.85rem",
                    backgroundColor: "#1e293b",
                    color: "#f8fafc",
                  }}
                >
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      backgroundColor: "#1e293b",
                      color: "#f8fafc",
                      zIndex: 1,
                      boxShadow: "0 2px 2px -1px rgba(0, 0, 0, 0.4)",
                    }}
                  >
                    <tr>
                      <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "2%", minWidth: "40px" }}>
                        No
                      </th>
                      <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "4%", minWidth: "60px" }}>
                        Tahun
                      </th>
                      <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "4%", minWidth: "60px" }}>
                        Lokasi
                      </th>
                      <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "8%", minWidth: "150px" }}>
                        Pemda
                      </th>
                      <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "4%", minWidth: "60px" }}>
                        Kanwil
                      </th>
                      <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "4%", minWidth: "60px" }}>
                        KPPN
                      </th>
                      <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "8%", minWidth: "150px" }}>
                        Nama KPPN
                      </th>
                      <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "4%", minWidth: "70px" }}>
                        Akun
                      </th>
                      <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "6%", minWidth: "100px" }}>
                        Jenis Dana
                      </th>
                      <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "4%", minWidth: "60px" }}>
                        Bidang
                      </th>
                      <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "8%", minWidth: "150px" }}>
                        Nama Bidang
                      </th>
                      <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "4%", minWidth: "60px" }}>
                        Sub
                      </th>
                      <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "8%", minWidth: "150px" }}>
                        Nama Sub Bidang
                      </th>
                      <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "6%", minWidth: "120px" }}>
                        Pagu
                      </th>
                      <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "6%", minWidth: "120px" }}>
                        Penyaluran
                      </th>
                      <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "6%", minWidth: "120px" }}>
                        Sisa Pagu
                      </th>
                      <th rowSpan={2} className="border border-zinc-700 p-2 text-left" style={{ width: "3%", minWidth: "60px" }}>
                        %
                      </th>
                      <th colSpan={12} className="border border-zinc-700 p-2 text-center">
                        Realisasi Bulanan
                      </th>
                    </tr>
                    <tr>
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
                        <th key={m} className="border border-zinc-700 p-2 text-left" style={{ minWidth: "90px" }}>
                          {m}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData
                      .slice(
                        (currentPage - 1) * itemsPerPage,
                        currentPage * itemsPerPage,
                      )
                      .map((row, index) => (
                        <tr key={index} className="hover:bg-zinc-700/50">
                          <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap" }}>
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap" }}>{row.thang}</td>
                          <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap" }}>{row.kdlokasi}</td>
                          <td
                            className="border border-zinc-700 p-2"
                            style={{
                              whiteSpace: "normal",
                              wordWrap: "break-word",
                            }}
                          >
                            {row.pemda}
                          </td>
                          <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap" }}>{row.kdkanwil}</td>
                          <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap" }}>{row.kdkppn}</td>
                          <td
                            className="border border-zinc-700 p-2"
                            style={{
                              whiteSpace: "normal",
                              wordWrap: "break-word",
                            }}
                          >
                            {row.nmkppn}
                          </td>
                          <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap" }}>{row.kdakun}</td>
                          <td
                            className="border border-zinc-700 p-2"
                            style={{
                              whiteSpace: "normal",
                              wordWrap: "break-word",
                            }}
                          >
                            {row.jenis_dana}
                          </td>
                          <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap" }}>{row.kdbidang}</td>
                          <td
                            className="border border-zinc-700 p-2"
                            style={{
                              whiteSpace: "normal",
                              wordWrap: "break-word",
                            }}
                          >
                            {row.nmbidang}
                          </td>
                          <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap" }}>
                            {row.kdsubidang}
                          </td>
                          <td
                            className="border border-zinc-700 p-2"
                            style={{
                              whiteSpace: "normal",
                              wordWrap: "break-word",
                            }}
                          >
                            {row.nmsubidang}
                          </td>
                          <td
                            className="border border-zinc-700 p-2"
                            style={{ whiteSpace: "nowrap", textAlign: "right" }}
                          >
                            {new Intl.NumberFormat("id-ID").format(row.pagu)}
                          </td>
                          <td
                            className="border border-zinc-700 p-2"
                            style={{ whiteSpace: "nowrap", textAlign: "right" }}
                          >
                            {new Intl.NumberFormat("id-ID").format(
                              row.total_penyaluran,
                            )}
                          </td>
                          <td
                            className="border border-zinc-700 p-2"
                            style={{ whiteSpace: "nowrap", textAlign: "right" }}
                          >
                            {new Intl.NumberFormat("id-ID").format(row.sisa_pagu)}
                          </td>
                          <td
                            className="border border-zinc-700 p-2"
                            style={{ whiteSpace: "nowrap", textAlign: "right" }}
                          >
                            {row.prosentase}%
                          </td>
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
                            <td
                              key={m}
                              className="border border-zinc-700 p-2"
                              style={{ whiteSpace: "nowrap", textAlign: "right" }}
                            >
                              {new Intl.NumberFormat("id-ID").format(row[m])}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SQL Modal */}
      {showModalSQL && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-xl w-full max-w-3xl mx-4 shadow-2xl overflow-hidden">
            <div
              className="flex justify-between items-center px-6 py-4"
              style={{ backgroundColor: "#334155" }}
            >
              <h5 className="text-white font-semibold m-0">SQL Query</h5>
              <button
                onClick={handleCloseSQL}
                className="text-white hover:text-zinc-300 text-xl leading-none bg-transparent border-0"
              >
                ✕
              </button>
            </div>
            <div className="p-6" style={{ backgroundColor: "#1e293b" }}>
              <button
                className="btn btn-secondary btn-sm mb-3"
                onClick={handleCopy}
              >
                {isCopied ? "Copied!" : "Copy to Clipboard"}
              </button>
              <pre
                className="rounded-md p-4 overflow-auto text-sm"
                style={{
                  backgroundColor: "#0f172a",
                  color: "#10b981",
                  maxHeight: "300px",
                }}
              >
                {sqlQuery}
              </pre>
            </div>
            <div
              className="flex justify-end px-6 py-4"
              style={{ backgroundColor: "#334155" }}
            >
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleCloseSQL}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DakFisik;
