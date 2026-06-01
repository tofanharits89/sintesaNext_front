import { useState, useEffect } from "react";
import { toast } from "sonner";
import { http } from "@/lib/api/httpClient";
import { useAuth } from "@/hooks/useAuth";
import { DakFisikData, SelectOption } from "./types";
import { generateSQLQuery } from "./utils";

export const useDakFisik = () => {
  const { user } = useAuth();
  const role = user?.role === "kppn" ? "3" : user?.role === "kanwil_djpb" ? "2" : "0";
  const kdkanwil = user?.kdkanwil ?? "";
  const kdkppn = user?.kdkppn ?? "";
  const currentYear = new Date().getFullYear();

  // State for filters
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedkanwil, setSelectedkanwil] = useState<string>("");
  const [kanwilOptions, setKanwilOptions] = useState<SelectOption[]>([]);
  const [selectedkppn, setSelectedkppn] = useState<string>("");
  const [kppnOptions, setKppnOptions] = useState<SelectOption[]>([]);
  const [yearOptions, setYearOptions] = useState<SelectOption[]>([]);
  const [selectedLokasi, setSelectedLokasi] = useState<string>("");
  const [lokasiOptions, setLokasiOptions] = useState<SelectOption[]>([]);
  const [selectedJenisDana, setSelectedJenisDana] = useState<string>("");
  const [jenisDanaOptions, setJenisDanaOptions] = useState<SelectOption[]>([]);
  const [selectedBidang, setSelectedBidang] = useState<string>("");
  const [bidangOptions, setBidangOptions] = useState<SelectOption[]>([]);
  const [selectedSubBidang, setSelectedSubBidang] = useState<string>("");
  const [subBidangOptions, setSubBidangOptions] = useState<SelectOption[]>([]);

  // Month Filters
  const [startMonth, setStartMonth] = useState<string>("1");
  const [endMonth, setEndMonth] = useState<string>("12");

  // State for Results
  const [showResults, setShowResults] = useState<boolean>(false);
  const [tableData, setTableData] = useState<DakFisikData[]>([]);
  const [loadingResults, setLoadingResults] = useState<boolean>(false);

  // State for SQL Modal
  const [showModalSQL, setShowModalSQL] = useState<boolean>(false);
  const [sqlQuery, setSqlQuery] = useState<string>("");

  // State for Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const API_BASE = process.env.NEXT_PUBLIC_DAKFISIK_DNF_DATA || "/api/v1/transfer-daerah/dataset/query?sql=";

  const fetchYearData = async () => {
    try {
      const query = "SELECT DISTINCT thang FROM tkd.dak_fisik ORDER BY thang DESC";
      const response = await http.get(`${API_BASE}${encodeURIComponent(query)}`);
      const years = response.data.result || [];
      setYearOptions(years.map((y: any) => ({ label: String(y.thang), value: String(y.thang) })));
      if (years.length > 0) {
        setSelectedYear(String(years[0].thang));
      } else {
        setSelectedYear(String(currentYear));
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
      const response = await http.get(`${API_BASE}${encodeURIComponent(query)}`);
      const kanwil = response.data.result || [];
      setKanwilOptions(kanwil.map((k: any) => ({
        label: `${k.kdkanwil} - ${k.nmkanwil}`,
        value: String(k.kdkanwil),
      })));
      if ((role === "2" || role === "3") && kdkanwil) {
        setSelectedkanwil(kdkanwil);
      }
    } catch (error) {
      console.error("Error fetching kanwil:", error);
    }
  };

  const fetchkppnData = async (kanwilCode = "") => {
    try {
      let query = "";
      if (role === "3" && kdkppn) {
        query = `SELECT kdkppn, MIN(nmkppn) AS nmkppn FROM dbref.t_kppn_2026 WHERE kdkppn = '${kdkppn}' GROUP BY kdkppn ORDER BY kdkppn ASC`;
      } else if (role === "2" && kdkanwil) {
        query = `SELECT kdkppn, MIN(nmkppn) AS nmkppn FROM dbref.t_kppn_2026 WHERE kdkanwil = '${kdkanwil}' GROUP BY kdkppn ORDER BY kdkppn ASC`;
      } else if (kanwilCode) {
        query = `SELECT kdkppn, MIN(nmkppn) AS nmkppn FROM dbref.t_kppn_2026 WHERE kdkanwil = '${kanwilCode}' GROUP BY kdkppn ORDER BY kdkppn ASC`;
      } else {
        query = "SELECT kdkppn, MIN(nmkppn) AS nmkppn FROM dbref.t_kppn_2026 WHERE kdkppn IS NOT NULL GROUP BY kdkppn ORDER BY kdkppn ASC";
      }
      const response = await http.get(`${API_BASE}${encodeURIComponent(query)}`);
      const kppn = response.data.result || [];
      setKppnOptions(kppn.map((k: any) => ({
        label: `${k.kdkppn} - ${k.nmkppn || "N/A"}`,
        value: String(k.kdkppn),
      })));
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
      const query = "SELECT kdlokasi, MIN(nmlokasi) AS nmlokasi FROM tkd.dak_fisik GROUP BY kdlokasi ORDER BY nmlokasi";
      const response = await http.get(`${API_BASE}${encodeURIComponent(query)}`);
      const lokasi = response.data.result || [];
      setLokasiOptions(lokasi.map((l: any) => ({
        label: `${l.kdlokasi} - ${l.nmlokasi}`,
        value: String(l.kdlokasi),
      })));
    } catch (error) {
      console.error("Error fetching lokasi:", error);
    }
  };

  const fetchJenisDanaData = async () => {
    try {
      const query = "SELECT DISTINCT jenis_dana FROM tkd.dak_fisik WHERE jenis_dana IS NOT NULL ORDER BY jenis_dana";
      const response = await http.get(`${API_BASE}${encodeURIComponent(query)}`);
      const jenisDana = response.data.result || [];
      setJenisDanaOptions(jenisDana.map((j: any) => ({
        label: j.jenis_dana,
        value: j.jenis_dana,
      })));
    } catch (error) {
      console.error("Error fetching jenis dana:", error);
    }
  };

  const fetchBidangData = async () => {
    try {
      const query = "SELECT kdbidang, MIN(nmbidang) AS nmbidang FROM tkd.dak_fisik GROUP BY kdbidang ORDER BY nmbidang";
      const response = await http.get(`${API_BASE}${encodeURIComponent(query)}`);
      const bidang = response.data.result || [];
      setBidangOptions(bidang.map((b: any) => ({
        label: `${b.kdbidang} - ${b.nmbidang}`,
        value: String(b.kdbidang),
      })));
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
      const response = await http.get(`${API_BASE}${encodeURIComponent(query)}`);
      const subBidang = response.data.result || [];
      setSubBidangOptions(subBidang.map((sb: any) => ({
        label: `${sb.kdsubidang} - ${sb.nmsubidang}`,
        value: String(sb.kdsubidang),
      })));
    } catch (error) {
      console.error("Error fetching sub-bidang:", error);
    }
  };

  const handleTayang = async () => {
    if (!selectedYear) {
      toast.warning("Silakan pilih tahun terlebih dahulu");
      return;
    }

    setLoadingResults(true);
    try {
      const query = generateSQLQuery({
        selectedYear,
        selectedkanwil,
        selectedkppn,
        selectedLokasi,
        startMonth,
        endMonth,
        selectedJenisDana,
        selectedBidang,
        selectedSubBidang,
        role,
        kdkanwil,
        kdkppn,
      });
      const response = await http.get(`${API_BASE}${encodeURIComponent(query)}`);
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
    const query = generateSQLQuery({
      selectedYear,
      selectedkanwil,
      selectedkppn,
      selectedLokasi,
      startMonth,
      endMonth,
      selectedJenisDana,
      selectedBidang,
      selectedSubBidang,
      role,
      kdkanwil,
      kdkppn,
    });
    setSqlQuery(query);
    setShowModalSQL(true);
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

  const handleReset = () => {
    if (yearOptions.length > 0) {
      setSelectedYear(yearOptions[0]?.value ?? "");
    } else {

      setSelectedYear(String(currentYear));
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
    setSelectedJenisDana("all");
    setSelectedBidang("all");
    setSelectedSubBidang("all");
    setStartMonth("1");
    setEndMonth("12");
    setTableData([]);
    setShowResults(false);
  };

  return {
    role,
    user,
    filters: {
      selectedYear, setSelectedYear, yearOptions,
      selectedkanwil, setSelectedkanwil, kanwilOptions,
      selectedkppn, setSelectedkppn, kppnOptions,
      selectedLokasi, setSelectedLokasi, lokasiOptions,
      selectedJenisDana, setSelectedJenisDana, jenisDanaOptions,
      selectedBidang, setSelectedBidang, bidangOptions,
      selectedSubBidang, setSelectedSubBidang, subBidangOptions,
      startMonth, setStartMonth,
      endMonth, setEndMonth,
    },
    results: {
      showResults, setShowResults,
      tableData, setTableData,
      loadingResults, setLoadingResults,
      currentPage, setCurrentPage,
      itemsPerPage, setItemsPerPage,
    },
    sql: {
      showModalSQL, setShowModalSQL,
      sqlQuery, setSqlQuery,
    },
    actions: {
      handleTayang,
      handleShowSQL,
      handleReset,
    }
  };
};


