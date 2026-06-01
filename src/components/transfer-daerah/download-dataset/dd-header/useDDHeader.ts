import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { http } from "@/lib/api/httpClient";
import * as xlsx from "xlsx";
import { DDHeaderData, SelectOption } from "./types";
import { 
  generateSQLQuery, 
  convertTableDataToCSV, 
  handleDownloadPDF as handleDownloadPDFAction
} from "./utils";

export const useDDHeader = () => {
  const { user } = useAuth();
  const role = user?.role === "kppn" ? "3" : user?.role === "kanwil_djpb" ? "2" : "0";
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
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const API_BASE = process.env.NEXT_PUBLIC_DAKFISIK_DNF_DATA || "/api/v1/transfer-daerah/dataset/query?sql=";

  const fetchYearData = async () => {
    try {
      const query = "SELECT DISTINCT thang FROM tkd.dd_header ORDER BY thang DESC";
      const encodedQuery = encodeURIComponent(query);
      const response = await http.get(`${API_BASE}${encodedQuery}`);
      const years = response.data.result || [];
      setYearOptions(years.map((y: any) => ({ label: String(y.thang), value: String(y.thang) })));
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
      let query = "SELECT kdkanwil, MIN(nmkanwil) AS nmkanwil FROM dbref.t_kanwil_2025 WHERE kdkanwil IS NOT NULL GROUP BY kdkanwil ORDER BY kdkanwil ASC";
      if ((role === "2" || role === "3") && kdkanwil) {
        query = `SELECT kdkanwil, MIN(nmkanwil) AS nmkanwil FROM dbref.t_kanwil_2025 WHERE kdkanwil = '${kdkanwil}' GROUP BY kdkanwil`;
      }
      const encodedQuery = encodeURIComponent(query);
      const response = await http.get(`${API_BASE}${encodedQuery}`);
      const kanwil = response.data.result || [];
      setKanwilOptions(kanwil.map((k: any) => ({ label: `${k.kdkanwil} - ${k.nmkanwil}`, value: String(k.kdkanwil) })));
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
        query = "SELECT kdkppn, MIN(nmkppn) AS nmkppn FROM dbref.t_kppn_2026 WHERE kdkppn IS NOT NULL GROUP BY kdkppn ORDER BY kdkppn ASC";
      }
      const encodedQuery = encodeURIComponent(query);
      const response = await http.get(`${API_BASE}${encodedQuery}`);
      const kppn = response.data.result || [];
      setKppnOptions(kppn.map((k: any) => ({ label: `${k.kdkppn} - ${k.nmkppn || "N/A"}`, value: String(k.kdkppn) })));
      if (role === "3" && kdkppn) {
        setSelectedkppn(kdkppn);
      } else {
        setSelectedkppn("");
      }
    } catch (error) {
      console.error("Error fetching kppn:", error);
    }
  };

  const fetchLokasiData = async (year?: string) => {
    try {
      const resolvedYear = year || selectedYear || String(new Date().getFullYear());
      const kabkotaTable = `dbref.t_kabkota_${resolvedYear}`;
      const query = `SELECT a.kdlokasi, MIN(b.nmkabkota) AS nmkabkota FROM tkd.dd_header a LEFT JOIN ${kabkotaTable} b ON a.kdlokasi = b.kdlokasi || b.kdkabkota GROUP BY a.kdlokasi ORDER BY a.kdlokasi ASC`;
      const encodedQuery = encodeURIComponent(query);
      const response = await http.get(`${API_BASE}${encodedQuery}`);
      const lokasi = response.data.result || [];
      setLokasiOptions(lokasi.map((l: any) => ({ label: `${l.kdlokasi} - ${l.nmkabkota || "N/A"}`, value: String(l.kdlokasi) })));
    } catch (error) {
      console.error("Error fetching lokasi:", error);
    }
  };

  const handleTayang = async () => {
    if (!selectedYear) {
      toast.warning("Silakan pilih tahun terlebih dahulu");
      return;
    }
    setLoadingResults(true);
    try {
      const query = generateSQLQuery(selectedYear, selectedkanwil, selectedkppn, selectedLokasi, startMonth, endMonth, role, kdkanwil, kdkppn);
      const encodedQuery = encodeURIComponent(query);
      const response = await http.get(`${API_BASE}${encodedQuery}`);
      const data = response.data.result || [];
      setTableData(data);
      setCurrentPage(1);
      setShowResults(true);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error(error.response?.data?.message || "Gagal mengambil data");
    } finally {
      setLoadingResults(false);
    }
  };

  const handleShowSQL = () => {
    const query = generateSQLQuery(selectedYear, selectedkanwil, selectedkppn, selectedLokasi, startMonth, endMonth, role, kdkanwil, kdkppn);
    setSqlQuery(query);
    setShowModalSQL(true);
  };

  const handleCloseSQL = () => setShowModalSQL(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlQuery);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };


  const handleDownloadCSV = () => {
    const csv = convertTableDataToCSV(tableData);
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv));
    element.setAttribute("download", `dana_desa_${selectedYear}.csv`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadExcel = () => {
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
    ws["!cols"] = [
      { wch: 5 }, { wch: 6 }, { wch: 10 }, { wch: 25 }, { wch: 10 }, 
      { wch: 20 }, { wch: 10 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }
    ];
    xlsx.writeFile(wb, `dana_desa_${selectedYear}.xlsx`);
  };

  const handleDownloadPDF = () => {
    handleDownloadPDFAction(tableData, selectedYear);
  };

  useEffect(() => {
    fetchYearData();
    fetchKanwilData();
    fetchkppnData();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchLokasiData(selectedYear);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchkppnData(selectedkanwil);
  }, [selectedkanwil]);

  const handleReset = () => {
    if (yearOptions.length > 0) {
      setSelectedYear(yearOptions[0]?.value ?? "");
    } else {

      setSelectedYear(String(year));
    }

    if (role === "0") {
      setSelectedkanwil("");
      setSelectedkppn("");
    } else if (role === "2") {
      setSelectedkanwil(kdkanwil);
      setSelectedkppn("");
    } else if (role === "3") {
      setSelectedkanwil(kdkanwil);
      setSelectedkppn(kdkppn);
    }

    setSelectedLokasi("");
    setStartMonth("1");
    setEndMonth("12");
    setTableData([]);
    setShowResults(false);
  };

  return {
    user,
    role,
    selectedYear, setSelectedYear,
    selectedkanwil, setSelectedkanwil,
    selectedkppn, setSelectedkppn,
    selectedLokasi, setSelectedLokasi,
    startMonth, setStartMonth,
    endMonth, setEndMonth,
    yearOptions, kanwilOptions, kppnOptions, lokasiOptions,
    tableData, showResults, loadingResults,
    currentPage, setCurrentPage, itemsPerPage, setItemsPerPage,
    showModalSQL, sqlQuery, isCopied,
    handleTayang, handleShowSQL, handleCloseSQL, handleCopy,
    handleDownloadCSV, handleDownloadExcel, handleDownloadPDF,
    handleReset,
  };
};

