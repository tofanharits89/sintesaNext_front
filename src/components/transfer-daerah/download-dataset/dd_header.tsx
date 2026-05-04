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
interface DDHeaderData {
  thang: string;
  kdkanwil: string;
  nmkanwil: string;
  kdkppn: string;
  nmkppn: string;
  kdlokasi: string;
  nmkabkota: string;
  pagu: number;
  Januari: number;
  Februari: number;
  Maret: number;
  April: number;
  Mei: number;
  Juni: number;
  Juli: number;
  Agustus: number;
  September: number;
  Oktober: number;
  November: number;
  Desember: number;
  total_nilai: number;
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

const DD_header: React.FC = () => {
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

  // Month Filters (Bulan SP2D)
  const [startMonth, setStartMonth] = useState<string>("1");
  const [endMonth, setEndMonth] = useState<string>("12");

  // State untuk hasil Tayang
  const [showResults, setShowResults] = useState<boolean>(false);
  const [tableData, setTableData] = useState<DDHeaderData[]>([]);
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
        "SELECT DISTINCT thang FROM tkd.dd_header ORDER BY thang DESC";
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
        "SELECT a.kdlokasi, MIN(b.nmkabkota) AS nmkabkota FROM tkd.dd_header a LEFT JOIN dbref.t_kabkota_apbd b ON a.kdlokasi = REPLACE(b.kdkabkota, '.', '') GROUP BY a.kdlokasi ORDER BY a.kdlokasi ASC";
      const encodedQuery = encodeURIComponent(query);
      const API_BASE = process.env.NEXT_PUBLIC_DAKFISIK_DNF_DATA || "/api/v1/transfer-daerah/dataset/query?sql=";
      const response = await http.get(
        `${API_BASE}${encodedQuery}`,
      );
      const lokasi = response.data.result || [];
      setLokasiOptions(
        lokasi.map((l: any) => ({
          label: `${l.kdlokasi} - ${l.nmkabkota || "N/A"}`,
          value: String(l.kdlokasi),
        })),
      );
    } catch (error) {
      console.error("Error fetching lokasi:", error);
    }
  };

  // Generate SQL Query
  const generateSQLQuery = (): string => {
    const filterKanwil =
      selectedkanwil || (role === "2" || role === "3" ? kdkanwil : "");
    const filterKppn = selectedkppn || (role === "3" ? kdkppn : "");

    let whereConditions = "WHERE 1=1";
    if (selectedYear && selectedYear !== "all") whereConditions += ` AND a.thang = '${selectedYear}'`;
    if (filterKanwil) whereConditions += ` AND c.kdkanwil = '${filterKanwil}'`;
    if (filterKppn) whereConditions += ` AND a.kdkppn = '${filterKppn}'`;
    if (selectedLokasi)
      whereConditions += ` AND a.kdlokasi = '${selectedLokasi}'`;
    if (startMonth && endMonth)
      whereConditions += ` AND EXTRACT(MONTH FROM a.tgl_sp2d) BETWEEN ${startMonth} AND ${endMonth}`;

    return `
SELECT 
    a.thang,
    c.kdkanwil,
    d.nmkanwil,
    a.kdkppn,
    c.nmkppn,               
    a.kdlokasi,
    b.nmkabkota,             
    COALESCE(MAX(p.total_pagu), 0) AS pagu,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgl_sp2d) = 1 THEN a.rupiah ELSE 0 END) AS Januari,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgl_sp2d) = 2 THEN a.rupiah ELSE 0 END) AS Februari,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgl_sp2d) = 3 THEN a.rupiah ELSE 0 END) AS Maret,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgl_sp2d) = 4 THEN a.rupiah ELSE 0 END) AS April,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgl_sp2d) = 5 THEN a.rupiah ELSE 0 END) AS Mei,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgl_sp2d) = 6 THEN a.rupiah ELSE 0 END) AS Juni,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgl_sp2d) = 7 THEN a.rupiah ELSE 0 END) AS Juli,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgl_sp2d) = 8 THEN a.rupiah ELSE 0 END) AS Agustus,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgl_sp2d) = 9 THEN a.rupiah ELSE 0 END) AS September,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgl_sp2d) = 10 THEN a.rupiah ELSE 0 END) AS Oktober,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgl_sp2d) = 11 THEN a.rupiah ELSE 0 END) AS November,
    SUM(CASE WHEN EXTRACT(MONTH FROM a.tgl_sp2d) = 12 THEN a.rupiah ELSE 0 END) AS Desember,
    SUM(a.rupiah) AS total_nilai
FROM tkd.dd_header a
LEFT JOIN dbref.t_kabkota_apbd b 
    ON a.kdlokasi = REPLACE(b.kdkabkota, '.', '')
LEFT JOIN dbref.t_kppn_2025 c 
    ON a.kdkppn = c.kdkppn
LEFT JOIN dbref.t_kanwil_2025 d 
    ON c.kdkanwil = d.kdkanwil
LEFT JOIN (
    SELECT thang, kdlokasi, SUM(pagu) AS total_pagu
    FROM tkd.dd_pagu
    GROUP BY thang, kdlokasi
) p ON a.kdlokasi = p.kdlokasi 
    AND a.thang = p.thang
${whereConditions}

GROUP BY 
    a.thang, 
    c.kdkanwil, 
    d.nmkanwil, 
    a.kdkppn, 
    c.nmkppn, 
    a.kdlokasi, 
    b.nmkabkota
ORDER BY c.kdkanwil, a.kdkppn`;
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
    element.setAttribute("download", `dana_desa_${selectedYear}.csv`);
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
      "Kode Kanwil": row.kdkanwil,
      "Nama Kanwil": row.nmkanwil,
      "Kode KPPN": row.kdkppn,
      "Nama KPPN": row.nmkppn,
      "Kode Lokasi": row.kdlokasi,
      "Nama Pemda": row.nmkabkota,
      Pagu: row.pagu,
      Januari: row.Januari,
      Februari: row.Februari,
      Maret: row.Maret,
      April: row.April,
      Mei: row.Mei,
      Juni: row.Juni,
      Juli: row.Juli,
      Agustus: row.Agustus,
      September: row.September,
      Oktober: row.Oktober,
      November: row.November,
      Desember: row.Desember,
      Total: row.total_nilai,
    }));

    const ws = xlsx.utils.json_to_sheet(dataToExport);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "DAK Fisik");

    const colWidths = [
      { wch: 5 },
      { wch: 6 },
      { wch: 10 },
      { wch: 25 },
      { wch: 10 },
      { wch: 20 },
      { wch: 10 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];
    ws["!cols"] = colWidths;

    xlsx.writeFile(wb, `dana_desa_${selectedYear}.xlsx`);
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

  const convertTableDataToCSV = (data: DDHeaderData[]): string => {
    const headers = [
      "No",
      "Tahun",
      "Kode Kanwil",
      "Nama Kanwil",
      "Kode KPPN",
      "Nama KPPN",
      "Kode Lokasi",
      "Nama Pemda",
      "Pagu",
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
      "Total",
    ];

    let csv = headers.join(",") + "\n";

    data.forEach((row, index) => {
      csv += [
        index + 1,
        row.thang,
        row.kdkanwil,
        row.nmkanwil,
        row.kdkppn,
        row.nmkppn,
        row.kdlokasi,
        row.nmkabkota,
        row.pagu,
        row.Januari,
        row.Februari,
        row.Maret,
        row.April,
        row.Mei,
        row.Juni,
        row.Juli,
        row.Agustus,
        row.September,
        row.Oktober,
        row.November,
        row.Desember,
        row.total_nilai,
      ]
        .map((cell) => `"${cell ?? ""}"`)
        .join(",");
      csv += "\n";
    });

    return csv;
  };

  const convertTableDataToPDF = (data: DDHeaderData[]): string => {
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
        <h2>Laporan Dana Desa Tahun ${selectedYear}</h2>
        <table>
          <thead>
            <tr>
              <th>No</th><th>Tahun</th><th>Kanwil</th><th>KPPN</th>
              <th>Pemda</th><th>Pagu</th><th>Jan</th><th>Feb</th>
              <th>Mar</th><th>Apr</th><th>Mei</th><th>Jun</th>
              <th>Jul</th><th>Ags</th><th>Sep</th><th>Okt</th>
              <th>Nov</th><th>Des</th><th>Total</th>
            </tr>
          </thead>
          <tbody>
    `;

    data.forEach((row, index) => {
      const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n);
      html += `
        <tr>
          <td>${index + 1}</td>
          <td>${row.thang}</td>
          <td>${row.nmkanwil || row.kdkanwil}</td>
          <td>${row.nmkppn || row.kdkppn}</td>
          <td>${row.nmkabkota || row.kdlokasi}</td>
          <td class="number">${fmt(row.pagu || 0)}</td>
          <td class="number">${fmt(row.Januari || 0)}</td>
          <td class="number">${fmt(row.Februari || 0)}</td>
          <td class="number">${fmt(row.Maret || 0)}</td>
          <td class="number">${fmt(row.April || 0)}</td>
          <td class="number">${fmt(row.Mei || 0)}</td>
          <td class="number">${fmt(row.Juni || 0)}</td>
          <td class="number">${fmt(row.Juli || 0)}</td>
          <td class="number">${fmt(row.Agustus || 0)}</td>
          <td class="number">${fmt(row.September || 0)}</td>
          <td class="number">${fmt(row.Oktober || 0)}</td>
          <td class="number">${fmt(row.November || 0)}</td>
          <td class="number">${fmt(row.Desember || 0)}</td>
          <td class="number">${fmt(row.total_nilai || 0)}</td>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchkppnData(selectedkanwil);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedkanwil]);

  return (
    <div className="dak-fisik-container">
      <div className="mb-4">
        <h3 className="mb-3 font-semibold text-lg">Dana Desa</h3>
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
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleTayang} disabled={loadingResults}>
              {loadingResults ? "Memuat..." : "Tayang"}
            </Button>
            <Button variant="outline" onClick={handleShowSQL}>
              Lihat SQL
            </Button>
            <Button variant="outline" onClick={handleDownloadCSV}>
              Download CSV
            </Button>
            <Button variant="outline" onClick={handleDownloadExcel}>
              Download Excel
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              Download PDF
            </Button>
            <Button variant="ghost" onClick={handleRefresh}>
              Refresh
            </Button>
          </div>
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
                    minWidth: "2200px",
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
                      <th className="border border-zinc-700 p-2 text-left" style={{ width: "2%", minWidth: "40px" }}>No</th>
                      <th className="border border-zinc-700 p-2 text-left" style={{ width: "4%", minWidth: "60px" }}>Tahun</th>
                      <th className="border border-zinc-700 p-2 text-left" style={{ width: "4%", minWidth: "60px" }}>Kanwil</th>
                      <th className="border border-zinc-700 p-2 text-left" style={{ width: "10%", minWidth: "150px" }}>Nama Kanwil</th>
                      <th className="border border-zinc-700 p-2 text-left" style={{ width: "4%", minWidth: "60px" }}>KPPN</th>
                      <th className="border border-zinc-700 p-2 text-left" style={{ width: "10%", minWidth: "150px" }}>Nama KPPN</th>
                      <th className="border border-zinc-700 p-2 text-left" style={{ width: "4%", minWidth: "60px" }}>Lokasi</th>
                      <th className="border border-zinc-700 p-2 text-left" style={{ width: "10%", minWidth: "150px" }}>Nama Pemda</th>
                      <th className="border border-zinc-700 p-2 text-left" style={{ width: "6%", minWidth: "120px" }}>Pagu</th>
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
                        <th key={m} className="border border-zinc-700 p-2 text-left" style={{ minWidth: "90px" }}>{m}</th>
                      ))}
                      <th className="border border-zinc-700 p-2 text-left" style={{ width: "6%", minWidth: "120px" }}>Total</th>
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
                          <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap" }}>{row.kdkanwil}</td>
                          <td
                            className="border border-zinc-700 p-2"
                            style={{
                              whiteSpace: "normal",
                              wordWrap: "break-word",
                            }}
                          >
                            {row.nmkanwil}
                          </td>
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
                          <td className="border border-zinc-700 p-2" style={{ whiteSpace: "nowrap" }}>{row.kdlokasi}</td>
                          <td
                            className="border border-zinc-700 p-2"
                            style={{
                              whiteSpace: "normal",
                              wordWrap: "break-word",
                            }}
                          >
                            {row.nmkabkota}
                          </td>
                          <td
                            className="border border-zinc-700 p-2"
                            style={{ whiteSpace: "nowrap", textAlign: "right" }}
                          >
                            {new Intl.NumberFormat("id-ID").format(row.pagu || 0)}
                          </td>
                          {[
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
                          ].map((m) => (
                            <td
                              key={m}
                              className="border border-zinc-700 p-2"
                              style={{ whiteSpace: "nowrap", textAlign: "right" }}
                            >
                              {new Intl.NumberFormat("id-ID").format(row[m] || 0)}
                            </td>
                          ))}
                          <td
                            className="border border-zinc-700 p-2"
                            style={{
                              whiteSpace: "nowrap",
                              textAlign: "right",
                              fontWeight: "bold",
                            }}
                          >
                            {new Intl.NumberFormat("id-ID").format(
                              row.total_nilai || 0,
                            )}
                          </td>
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

export default DD_header;
