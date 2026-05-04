import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useAuth } from "@/hooks/useAuth";
import { http } from "@/lib/api/httpClient";
import { 
  SelectOption, 
  TpgData, 
  BosBopData 
} from "./dnf-types";
import { 
  generateTpgSQLQuery, 
  generateBosBopSQLQuery,
  convertTableDataToCSV,
  exportToExcel,
  generatePDFHtml
} from "./dnf-utils";

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

export const useDNF = () => {
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
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
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

  const handleShowSQL = () => {
    const query = activeTab === "tpg" 
      ? generateTpgSQLQuery({
          selectedYear: tpgSelectedYear,
          selectedkanwil: tpgSelectedkanwil,
          selectedkppn: tpgSelectedkppn,
          startMonth: tpgStartMonth,
          endMonth: tpgEndMonth,
          selectedPeriode: tpgSelectedPeriode,
          selectedGelombang: tpgSelectedGelombang,
          selectedJenisTkd: tpgSelectedJenisTkd,
          role,
          kdkanwil,
          kdkppn
        })
      : generateBosBopSQLQuery({
          selectedYear: bosBopSelectedYear,
          startMonth: bosBopStartMonth,
          endMonth: bosBopEndMonth,
          selectedProgram: bosBopSelectedProgram,
          selectedJenisBos: bosBopSelectedJenisBos,
          selectedJenjang: bosBopSelectedJenjang,
          selectedKanwil: bosBopSelectedKanwil,
          selectedKppn: bosBopSelectedKppn,
          role,
          kdkanwil,
          kdkppn
        });
    setSqlQuery(query);
    setShowModalSQL(true);
  };

  const handleCloseSQL = () => setShowModalSQL(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(sqlQuery);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };


  // ===== DOWNLOAD =====
  const handleDownloadCSV = () => {
    const data = activeTab === "tpg" ? tpgTableData : bosBopTableData;
    const year = activeTab === "tpg" ? tpgSelectedYear : bosBopSelectedYear;
    if (data.length === 0) {
      SwalConfig.fire({ icon: "warning", title: "Tidak ada data", text: "Silakan tayang data terlebih dahulu" });
      return;
    }
    const csv = convertTableDataToCSV(data, activeTab);
    const el = document.createElement("a");
    el.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv));
    el.setAttribute("download", activeTab === "tpg" ? `tpg_${year || "semua_tahun"}.csv` : `bos_bop_${year || "semua_tahun"}.csv`);
    el.style.display = "none";
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  };

  const handleDownloadExcel = () => {
    const data = activeTab === "tpg" ? tpgTableData : bosBopTableData;
    const year = activeTab === "tpg" ? tpgSelectedYear : bosBopSelectedYear;
    if (data.length === 0) {
      SwalConfig.fire({ icon: "warning", title: "Tidak ada data", text: "Silakan tayang data terlebih dahulu" });
      return;
    }
    exportToExcel(data, activeTab, year);
  };

  const handleDownloadPDF = () => {
    const data = activeTab === "tpg" ? tpgTableData : bosBopTableData;
    const year = activeTab === "tpg" ? tpgSelectedYear : bosBopSelectedYear;
    if (data.length === 0) {
      SwalConfig.fire({ icon: "warning", title: "Tidak ada data", text: "Silakan tayang data terlebih dahulu" });
      return;
    }
    const html = generatePDFHtml(data, activeTab, year);
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
      const query = generateTpgSQLQuery({
        selectedYear: tpgSelectedYear,
        selectedkanwil: tpgSelectedkanwil,
        selectedkppn: tpgSelectedkppn,
        startMonth: tpgStartMonth,
        endMonth: tpgEndMonth,
        selectedPeriode: tpgSelectedPeriode,
        selectedGelombang: tpgSelectedGelombang,
        selectedJenisTkd: tpgSelectedJenisTkd,
        role,
        kdkanwil,
        kdkppn
      });
      const data = await fetchData(query);
      setTpgTableData(data);
      setTpgCurrentPage(1);
      setTpgShowResults(true);
    } catch (error: any) {
      console.error(error);
      SwalConfig.fire({ icon: "error", title: "Error", text: error.response?.data?.message || "Gagal mengambil data" });
    } finally { setTpgLoading(false); }
  };

  const handleTayangBosBop = async () => {
    setBosBopLoading(true);
    try {
      const query = generateBosBopSQLQuery({
        selectedYear: bosBopSelectedYear,
        startMonth: bosBopStartMonth,
        endMonth: bosBopEndMonth,
        selectedProgram: bosBopSelectedProgram,
        selectedJenisBos: bosBopSelectedJenisBos,
        selectedJenjang: bosBopSelectedJenjang,
        selectedKanwil: bosBopSelectedKanwil,
        selectedKppn: bosBopSelectedKppn,
        role,
        kdkanwil,
        kdkppn
      });
      const data = await fetchData(query);
      setBosBopTableData(data);
      setBosBopCurrentPage(1);
      setBosBopShowResults(true);
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

  const handleResetTpg = () => {
    if (tpgYearOptions.length > 0) setTpgSelectedYear(tpgYearOptions[0]?.value ?? "");
    setTpgStartMonth("1");
    setTpgEndMonth("12");
    if (role === "0") { 
      setTpgSelectedkanwil(""); 
      setTpgSelectedkppn(""); 
    } else if (role === "2") { 
      setTpgSelectedkanwil(kdkanwil); 
      setTpgSelectedkppn(""); 
    } else if (role === "3") { 
      setTpgSelectedkanwil(kdkanwil); 
      setTpgSelectedkppn(kdkppn); 
    }
    setTpgSelectedPeriode("all");
    setTpgSelectedGelombang("all");
    setTpgSelectedJenisTkd("all");
  };

  const handleResetBosBop = () => {
    if (bosBopYearOptions.length > 0) setBosBopSelectedYear(bosBopYearOptions[0]?.value ?? "");
    setBosBopStartMonth("1");
    setBosBopEndMonth("12");
    if (role === "0") { 
      setBosBopSelectedKanwil(""); 
      setBosBopSelectedKppn(""); 
    } else if (role === "2") { 
      setBosBopSelectedKanwil(kdkanwil); 
      setBosBopSelectedKppn(""); 
    } else if (role === "3") { 
      setBosBopSelectedKanwil(kdkanwil); 
      setBosBopSelectedKppn(kdkppn); 
    }
    setBosBopSelectedProgram("all");
    setBosBopSelectedJenisBos("all");
    setBosBopSelectedJenjang("all");
  };

  return {
    user,
    role,
    activeTab,
    setActiveTab,
    // TPG
    tpgSelectedYear, setTpgSelectedYear, tpgYearOptions,
    tpgStartMonth, setTpgStartMonth,
    tpgEndMonth, setTpgEndMonth,
    tpgSelectedkppn, setTpgSelectedkppn, tpgkppnOptions,
    tpgSelectedkanwil, setTpgSelectedkanwil, tpgkanwilOptions,
    tpgSelectedPeriode, setTpgSelectedPeriode, tpgPeriodeOptions,
    tpgSelectedGelombang, setTpgSelectedGelombang, tpgGelombangOptions,
    tpgSelectedJenisTkd, setTpgSelectedJenisTkd, tpgJenisTkdOptions,
    tpgShowResults, tpgTableData, tpgLoading, tpgCurrentPage, setTpgCurrentPage,
    handleTayangTpg,
    handleResetTpg,
    // BOS BOP
    bosBopSelectedYear, setBosBopSelectedYear, bosBopYearOptions,
    bosBopStartMonth, setBosBopStartMonth,
    bosBopEndMonth, setBosBopEndMonth,
    bosBopSelectedProgram, setBosBopSelectedProgram, bosBopProgramOptions,
    bosBopSelectedJenisBos, setBosBopSelectedJenisBos, bosBopJenisBosOptions,
    bosBopSelectedJenjang, setBosBopSelectedJenjang, bosBopJenjangOptions,
    bosBopSelectedKanwil, setBosBopSelectedKanwil, bosBopKanwilOptions,
    bosBopSelectedKppn, setBosBopSelectedKppn, bosBopKppnOptions,
    bosBopShowResults, bosBopTableData, bosBopLoading, bosBopCurrentPage, setBosBopCurrentPage,
    handleTayangBosBop,
    handleResetBosBop,
    // Shared
    itemsPerPage, setItemsPerPage,
    showModalSQL, handleShowSQL, handleCloseSQL,
    sqlQuery, isCopied, handleCopy,
    handleDownloadCSV, handleDownloadExcel, handleDownloadPDF
  };
};

