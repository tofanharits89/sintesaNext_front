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

interface SelectOption {
  label: string;
  value: string;
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

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="mb-4 rounded-xl bg-zinc-600 text-white px-3 py-3">
    {title && (
      <h5 className="text-white mb-2 font-semibold text-base">{title}</h5>
    )}
    <div>{children}</div>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="mb-3 flex flex-col sm:flex-row sm:items-center gap-2">
    <label className="form-label text-white mb-0 shrink-0 sm:w-1/6">
      {label}
    </label>
    <div className="flex-1">{children}</div>
  </div>
);

const SelectField: React.FC<{
  label: string;
  options?: SelectOption[];
  value: string;
  onChange: (v: string) => void;
  defaultLabel?: string;
  disabled?: boolean;
}> = ({
  label,
  options = [],
  value,
  onChange,
  defaultLabel = "-- Pilih --",
  disabled = false,
}) => (
  <Field label={label}>
    <select
      className="form-control"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      <option value="">{defaultLabel}</option>
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>
          {o.label ?? o}
        </option>
      ))}
    </select>
  </Field>
);

const ButtonRow: React.FC<{
  onTayang: () => void;
  onShowSQL: () => void;
  role: string;
  loadingResults: boolean;
  onDownloadCSV: () => void;
  onDownloadExcel: () => void;
  onDownloadPDF: () => void;
  onRefresh: () => void;
}> = ({
  onTayang,
  onShowSQL,
  role,
  loadingResults,
  onDownloadCSV,
  onDownloadExcel,
  onDownloadPDF,
  onRefresh,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex flex-wrap gap-2 items-center py-1">
      <button
        className="btn btn-success btn-sm"
        onClick={onTayang}
        disabled={loadingResults}
      >
        {loadingResults ? (
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Loading...
          </span>
        ) : (
          "Tayang"
        )}
      </button>

      <div className="relative" ref={menuRef}>
        <div className="flex">
          <button
            className="btn btn-sm text-white rounded-r-none"
            style={{ backgroundColor: "#0ea5e9", borderColor: "#0ea5e9" }}
            onClick={() => {
              onDownloadCSV();
              setShowMenu(false);
            }}
          >
            ↓ Download
          </button>
          <button
            className="btn btn-sm text-white rounded-l-none border-l-0 px-2"
            style={{ backgroundColor: "#0ea5e9", borderColor: "#0ea5e9" }}
            onClick={() => setShowMenu((v) => !v)}
          >
            ▾
          </button>
        </div>
        {showMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded shadow-lg z-50 min-w-[120px]">
            <button
              className="block w-full px-4 py-2 text-left text-sm text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              onClick={() => {
                onDownloadCSV();
                setShowMenu(false);
              }}
            >
              CSV
            </button>
            <button
              className="block w-full px-4 py-2 text-left text-sm text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              onClick={() => {
                onDownloadExcel();
                setShowMenu(false);
              }}
            >
              EXCEL
            </button>
            <button
              className="block w-full px-4 py-2 text-left text-sm text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              onClick={() => {
                onDownloadPDF();
                setShowMenu(false);
              }}
            >
              PDF
            </button>
          </div>
        )}
      </div>

      <button
        className="btn btn-secondary btn-sm"
        onClick={onRefresh}
        title="Refresh Halaman"
      >
        ↺ Refresh
      </button>

      {role === "X" && (
        <button
          className="btn btn-sm"
          onClick={onShowSQL}
          style={{
            backgroundColor: "#f59e0b",
            borderColor: "#f59e0b",
            color: "#000",
          }}
        >
          SQL
        </button>
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
  const role =
    user?.role === "kppn" ? "3" : user?.role === "kanwil_djpb" ? "2" : "0";
  const kdkanwil = user?.kdkanwil ?? "";
  const kdkppn = user?.kdkppn ?? "";
  const year = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState<string>("tpg");
  const API_BASE = process.env.NEXT_PUBLIC_DAKFISIK_DNF_DATA;

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
  const [tpgPeriodeOptions, setTpgPeriodeOptions] = useState<SelectOption[]>(
    [],
  );
  const [tpgSelectedGelombang, setTpgSelectedGelombang] = useState<string>("");
  const [tpgGelombangOptions, setTpgGelombangOptions] = useState<
    SelectOption[]
  >([]);
  const [tpgSelectedJenisTkd, setTpgSelectedJenisTkd] = useState<string>("");
  const [tpgJenisTkdOptions, setTpgJenisTkdOptions] = useState<SelectOption[]>(
    [],
  );
  const [tpgShowResults, setTpgShowResults] = useState<boolean>(false);
  const [tpgTableData, setTpgTableData] = useState<any[]>([]);
  const [tpgLoading, setTpgLoading] = useState<boolean>(false);

  // ===== BOS_BOP STATE =====
  const [bosBopSelectedYear, setBosBopSelectedYear] = useState<string>("");
  const [bosBopYearOptions, setBosBopYearOptions] = useState<SelectOption[]>(
    [],
  );
  const [bosBopStartMonth, setBosBopStartMonth] = useState<string>("1");
  const [bosBopEndMonth, setBosBopEndMonth] = useState<string>("12");
  const [bosBopSelectedProgram, setBosBopSelectedProgram] =
    useState<string>("");
  const [bosBopProgramOptions, setBosBopProgramOptions] = useState<
    SelectOption[]
  >([]);
  const [bosBopSelectedJenisBos, setBosBopSelectedJenisBos] =
    useState<string>("");
  const [bosBopJenisBosOptions, setBosBopJenisBosOptions] = useState<
    SelectOption[]
  >([]);
  const [bosBopSelectedJenjang, setBosBopSelectedJenjang] =
    useState<string>("");
  const [bosBopJenjangOptions, setBosBopJenjangOptions] = useState<
    SelectOption[]
  >([]);
  const [bosBopSelectedKanwil, setBosBopSelectedKanwil] = useState<string>("");
  const [bosBopKanwilOptions, setBosBopKanwilOptions] = useState<
    SelectOption[]
  >([]);
  const [bosBopSelectedKppn, setBosBopSelectedKppn] = useState<string>("");
  const [bosBopKppnOptions, setBosBopKppnOptions] = useState<SelectOption[]>(
    [],
  );
  const [bosBopShowResults, setBosBopShowResults] = useState<boolean>(false);
  const [bosBopTableData, setBosBopTableData] = useState<any[]>([]);
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
      const d = await fetchData(
        "SELECT DISTINCT thang FROM tkd.tpg ORDER BY thang DESC",
      );
      setTpgYearOptions(
        d.map((y: any) => ({ label: y.thang, value: y.thang })),
      );
    } catch (e) {
      console.error("Error fetching TPG years:", e);
    }
  };

  const fetchTpgKppn = async (selectedKanwil = "") => {
    try {
      let query = "";
      if (role === "3" && kdkppn)
        query = `SELECT DISTINCT kdkppn, nmkppn FROM dbref.t_kppn_2025 WHERE kdkppn = '${kdkppn}' ORDER BY kdkppn ASC`;
      else if (role === "2" && kdkanwil)
        query = `SELECT DISTINCT kdkppn, nmkppn FROM dbref.t_kppn_2025 WHERE kdkanwil = '${kdkanwil}' ORDER BY kdkppn ASC`;
      else if (selectedKanwil)
        query = `SELECT DISTINCT kdkppn, nmkppn FROM dbref.t_kppn_2025 WHERE kdkanwil = '${selectedKanwil}' ORDER BY kdkppn ASC`;
      else
        query =
          "SELECT DISTINCT kdkppn, nmkppn FROM dbref.t_kppn_2025 WHERE kdkppn IS NOT NULL ORDER BY kdkppn ASC";
      const d = await fetchData(query);
      setTpgkppnOptions(
        d.map((k: any) => ({
          label: `${k.kdkppn} - ${k.nmkppn || "N/A"}`,
          value: k.kdkppn,
        })),
      );
      if (role === "3" && kdkppn) setTpgSelectedkppn(kdkppn);
      else setTpgSelectedkppn("");
    } catch (e) {
      console.error("Error fetching TPG kppn:", e);
    }
  };

  const fetchTpgKanwil = async () => {
    try {
      let query =
        "SELECT DISTINCT kdkanwil, nmkanwil FROM dbref.t_kanwil_2025 WHERE kdkanwil IS NOT NULL ORDER BY kdkanwil ASC";
      if ((role === "2" || role === "3") && kdkanwil)
        query = `SELECT DISTINCT kdkanwil, nmkanwil FROM dbref.t_kanwil_2025 WHERE kdkanwil = '${kdkanwil}'`;
      const d = await fetchData(query);
      setTpgkanwilOptions(
        d.map((k: any) => ({
          label: `${k.kdkanwil} - ${k.nmkanwil}`,
          value: k.kdkanwil,
        })),
      );
      if ((role === "2" || role === "3") && kdkanwil)
        setTpgSelectedkanwil(kdkanwil);
      else setTpgSelectedkanwil("");
    } catch (e) {
      console.error("Error fetching TPG kanwil:", e);
    }
  };

  const fetchTpgPeriodes = async () => {
    try {
      const d = await fetchData(
        "SELECT DISTINCT nm_periode FROM tkd.tpg WHERE nm_periode IS NOT NULL ORDER BY nm_periode",
      );
      setTpgPeriodeOptions(
        d.map((p: any) => ({ label: p.nm_periode, value: p.nm_periode })),
      );
    } catch (e) {
      console.error(e);
    }
  };
  const fetchTpgGelombangs = async () => {
    try {
      const d = await fetchData(
        "SELECT DISTINCT gelombang FROM tkd.tpg WHERE gelombang IS NOT NULL ORDER BY gelombang",
      );
      setTpgGelombangOptions(
        d.map((g: any) => ({ label: g.gelombang, value: g.gelombang })),
      );
    } catch (e) {
      console.error(e);
    }
  };
  const fetchTpgJenisTkd = async () => {
    try {
      const d = await fetchData(
        "SELECT DISTINCT nama_detail FROM tkd.tpg WHERE nama_detail IS NOT NULL ORDER BY nama_detail",
      );
      setTpgJenisTkdOptions(
        d.map((j: any) => ({ label: j.nama_detail, value: j.nama_detail })),
      );
    } catch (e) {
      console.error(e);
    }
  };

  // ===== BOS_BOP FETCH =====
  const fetchBosBopYears = async () => {
    try {
      const d = await fetchData(
        "SELECT DISTINCT thang FROM tkd.bos_bop ORDER BY thang DESC",
      );
      setBosBopYearOptions(
        d.map((y: any) => ({ label: y.thang, value: y.thang })),
      );
    } catch (e) {
      console.error(e);
    }
  };
  const fetchBosBopPrograms = async () => {
    try {
      const d = await fetchData(
        "SELECT DISTINCT nmprogram FROM tkd.bos_bop WHERE nmprogram IS NOT NULL ORDER BY nmprogram",
      );
      setBosBopProgramOptions(
        d.map((p: any) => ({ label: p.nmprogram, value: p.nmprogram })),
      );
    } catch (e) {
      console.error(e);
    }
  };
  const fetchBosBopJenisBos = async () => {
    try {
      const d = await fetchData(
        "SELECT DISTINCT jenis_bos FROM tkd.bos_bop WHERE jenis_bos IS NOT NULL ORDER BY jenis_bos",
      );
      setBosBopJenisBosOptions(
        d.map((j: any) => ({ label: j.jenis_bos, value: j.jenis_bos })),
      );
    } catch (e) {
      console.error(e);
    }
  };
  const fetchBosBopJenjang = async () => {
    try {
      const d = await fetchData(
        "SELECT DISTINCT jenjang FROM tkd.bos_bop WHERE jenjang IS NOT NULL ORDER BY jenjang",
      );
      setBosBopJenjangOptions(
        d.map((j: any) => ({ label: j.jenjang, value: j.jenjang })),
      );
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBosBopKanwil = async () => {
    try {
      let query =
        (role === "2" || role === "3") && kdkanwil
          ? `SELECT DISTINCT kdkanwil, nmkanwil FROM dbref.t_kanwil_2025 WHERE kdkanwil = '${kdkanwil}' ORDER BY kdkanwil ASC`
          : "SELECT DISTINCT kdkanwil, nmkanwil FROM dbref.t_kanwil_2025 WHERE kdkanwil IS NOT NULL ORDER BY kdkanwil ASC";
      const d = await fetchData(query);
      setBosBopKanwilOptions(
        d.map((k: any) => ({
          label: `${k.kdkanwil} - ${k.nmkanwil || "N/A"}`,
          value: k.kdkanwil,
        })),
      );
      if ((role === "2" || role === "3") && kdkanwil)
        setBosBopSelectedKanwil(kdkanwil);
      else setBosBopSelectedKanwil("");
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBosBopKppn = async (selectedKanwil = "") => {
    try {
      let query = "";
      if (role === "3" && kdkppn)
        query = `SELECT DISTINCT kdkppn, nmkppn FROM dbref.t_kppn_2025 WHERE kdkppn = '${kdkppn}' ORDER BY kdkppn ASC`;
      else if (role === "2" && kdkanwil)
        query = `SELECT DISTINCT kdkppn, nmkppn FROM dbref.t_kppn_2025 WHERE kdkanwil = '${kdkanwil}' ORDER BY kdkppn ASC`;
      else if (selectedKanwil)
        query = `SELECT DISTINCT kdkppn, nmkppn FROM dbref.t_kppn_2025 WHERE kdkanwil = '${selectedKanwil}' ORDER BY kdkppn ASC`;
      else
        query =
          "SELECT DISTINCT kdkppn, nmkppn FROM dbref.t_kppn_2025 WHERE kdkppn IS NOT NULL ORDER BY kdkppn ASC";
      const d = await fetchData(query);
      setBosBopKppnOptions(
        d.map((k: any) => ({
          label: `${k.kdkppn} - ${k.nmkppn || "N/A"}`,
          value: k.kdkppn,
        })),
      );
      if (role === "3" && kdkppn) setBosBopSelectedKppn(kdkppn);
      else setBosBopSelectedKppn("");
    } catch (e) {
      console.error(e);
    }
  };

  // ===== SQL QUERIES =====
  const generateTpgSQLQuery = (): string => {
    let w = "WHERE 1=1";
    if (tpgSelectedYear) w += ` AND thang = '${tpgSelectedYear}'`;
    const fKanwil =
      tpgSelectedkanwil || (role === "2" || role === "3" ? kdkanwil : "");
    if (fKanwil) w += ` AND kode_kanwil = '${fKanwil}'`;
    const fKppn = tpgSelectedkppn || (role === "3" ? kdkppn : "");
    if (fKppn) w += ` AND kppn = '${fKppn}'`;
    if (tpgStartMonth && tpgEndMonth)
      w += ` AND EXTRACT(MONTH FROM tgsp2d) BETWEEN ${tpgStartMonth} AND ${tpgEndMonth}`;
    if (tpgSelectedPeriode) w += ` AND nm_periode = '${tpgSelectedPeriode}'`;
    if (tpgSelectedGelombang) w += ` AND gelombang = '${tpgSelectedGelombang}'`;
    if (tpgSelectedJenisTkd) w += ` AND nama_detail = '${tpgSelectedJenisTkd}'`;
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
    if (bosBopSelectedYear) w += ` AND a.thang = '${bosBopSelectedYear}'`;
    if (bosBopStartMonth && bosBopEndMonth)
      w += ` AND EXTRACT(MONTH FROM a.tgsp2d) BETWEEN ${bosBopStartMonth} AND ${bosBopEndMonth}`;
    if (bosBopSelectedProgram)
      w += ` AND a.nmprogram = '${bosBopSelectedProgram}'`;
    if (bosBopSelectedJenisBos)
      w += ` AND a.jenis_bos = '${bosBopSelectedJenisBos}'`;
    if (bosBopSelectedJenjang)
      w += ` AND a.jenjang = '${bosBopSelectedJenjang}'`;
    const fKanwil =
      bosBopSelectedKanwil || (role === "2" || role === "3" ? kdkanwil : "");
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
    setSqlQuery(
      activeTab === "tpg" ? generateTpgSQLQuery() : generateBosBopSQLQuery(),
    );
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

  // ===== DOWNLOAD =====
  const convertTableDataToCSV = (data: any[]): string => {
    if (activeTab === "tpg") {
      const headers = [
        "No",
        "Tahun",
        "Periode",
        "Kanwil",
        "Nama Kanwil",
        "KPPN",
        "Nama KPPN",
        "Lokasi",
        "Jenis TKD",
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
        "Total Setahun",
      ];
      let csv = headers.join(",") + "\n";
      data.forEach((row, i) => {
        csv +=
          [
            i + 1,
            row.thang,
            row.nm_periode,
            row.kode_kanwil,
            row.nm_kanwil,
            row.kppn,
            row.nm_kppn,
            row.nm_lokasi,
            row.jenis_tkd,
            row.Januari || 0,
            row.Februari || 0,
            row.Maret || 0,
            row.April || 0,
            row.Mei || 0,
            row.Juni || 0,
            row.Juli || 0,
            row.Agustus || 0,
            row.September || 0,
            row.Oktober || 0,
            row.November || 0,
            row.Desember || 0,
            row.total_setahun || 0,
          ]
            .map((c) => `"${c}"`)
            .join(",") + "\n";
      });
      return csv;
    } else {
      const headers = [
        "No",
        "Tahun",
        "Kd Kanwil",
        "Nama Kanwil",
        "Kd KPPN",
        "Nama KPPN (Wilayah)",
        "Program",
        "Jenjang",
        "Status Sekolah",
        "Jenis BOS",
        "Kd Lokasi",
        "Nama Lokasi Sekolah",
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
        "Total Nilai",
        "Total Siswa",
      ];
      let csv = headers.join(",") + "\n";
      data.forEach((row, i) => {
        csv +=
          [
            i + 1,
            row.thang,
            row.kdkanwil,
            row.nmkanwil,
            row.kdkppn,
            row.nmkabkota_kppn,
            row.nmprogram,
            row.jenjang,
            row.status_sekolah,
            row.jenis_bos,
            row.kdlokasi_kedudukan,
            row.nmkabkota_sekolah,
            row.Januari || 0,
            row.Februari || 0,
            row.Maret || 0,
            row.April || 0,
            row.Mei || 0,
            row.Juni || 0,
            row.Juli || 0,
            row.Agustus || 0,
            row.September || 0,
            row.Oktober || 0,
            row.November || 0,
            row.Desember || 0,
            row.total_nilai || 0,
            row.total_siswa || 0,
          ]
            .map((c) => `"${c}"`)
            .join(",") + "\n";
      });
      return csv;
    }
  };

  const handleDownloadCSV = () => {
    const data = activeTab === "tpg" ? tpgTableData : bosBopTableData;
    if (data.length === 0) {
      SwalConfig.fire({
        icon: "warning",
        title: "Tidak ada data",
        text: "Silakan tayang data terlebih dahulu",
      });
      return;
    }
    const csv = convertTableDataToCSV(data);
    const el = document.createElement("a");
    el.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csv),
    );
    el.setAttribute(
      "download",
      activeTab === "tpg"
        ? `tpg_${tpgSelectedYear || "semua_tahun"}.csv`
        : `bos_bop_${bosBopSelectedYear || "semua_tahun"}.csv`,
    );
    el.style.display = "none";
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  };

  const handleDownloadExcel = () => {
    const data = activeTab === "tpg" ? tpgTableData : bosBopTableData;
    if (data.length === 0) {
      SwalConfig.fire({
        icon: "warning",
        title: "Tidak ada data",
        text: "Silakan tayang data terlebih dahulu",
      });
      return;
    }
    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    const sheetName = activeTab === "tpg" ? "TPG" : "BOS_BOP";
    xlsx.utils.book_append_sheet(wb, ws, sheetName);
    ws["!cols"] =
      activeTab === "tpg"
        ? Array(23).fill({ wch: 12 })
        : Array(26).fill({ wch: 12 });
    xlsx.writeFile(
      wb,
      activeTab === "tpg"
        ? `tpg_${tpgSelectedYear || "semua_tahun"}.xlsx`
        : `bos_bop_${bosBopSelectedYear || "semua_tahun"}.xlsx`,
    );
  };

  const handleDownloadPDF = () => {
    const data = activeTab === "tpg" ? tpgTableData : bosBopTableData;
    if (data.length === 0) {
      SwalConfig.fire({
        icon: "warning",
        title: "Tidak ada data",
        text: "Silakan tayang data terlebih dahulu",
      });
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
      SwalConfig.fire({
        icon: "success",
        title: "Berhasil",
        text: `Data berhasil ditampilkan (${data.length} baris)`,
      });
    } catch (error: any) {
      console.error(error);
      SwalConfig.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Gagal mengambil data",
      });
    } finally {
      setTpgLoading(false);
    }
  };

  const handleTayangBosBop = async () => {
    setBosBopLoading(true);
    try {
      const data = await fetchData(generateBosBopSQLQuery());
      setBosBopTableData(data);
      setBosBopCurrentPage(1);
      setBosBopShowResults(true);
      SwalConfig.fire({
        icon: "success",
        title: "Berhasil",
        text: `Data berhasil ditampilkan (${data.length} baris)`,
      });
    } catch (error: any) {
      console.error(error);
      SwalConfig.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Gagal mengambil data",
      });
    } finally {
      setBosBopLoading(false);
    }
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
  useEffect(() => {
    fetchTpgKppn(tpgSelectedkanwil);
  }, [tpgSelectedkanwil]);
  useEffect(() => {
    fetchBosBopKppn(bosBopSelectedKanwil);
  }, [bosBopSelectedKanwil]);

  const months = [
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
  const monthsShort = [
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
  ];

  const renderPagination = (
    currentPg: number,
    setPage: (n: number) => void,
    dataLen: number,
  ) => (
    <div
      className="mb-3 flex justify-between items-center rounded-md px-4 py-2"
      style={{ backgroundColor: "#1e293b" }}
    >
      <span className="text-white text-sm">
        Halaman {currentPg} dari {Math.ceil(dataLen / itemsPerPage) || 1}
      </span>
      <div className="flex gap-2">
        <button
          className="btn btn-sm text-white"
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            borderColor: "rgba(255,255,255,0.3)",
          }}
          onClick={() => setPage(currentPg - 1)}
          disabled={currentPg === 1}
        >
          ← Sebelumnya
        </button>
        <button
          className="btn btn-sm text-white"
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            borderColor: "rgba(255,255,255,0.3)",
          }}
          onClick={() => setPage(currentPg + 1)}
          disabled={currentPg >= Math.ceil(dataLen / itemsPerPage)}
        >
          Berikutnya →
        </button>
      </div>
    </div>
  );

  return (
    <div className="dnf-container">
      <div className="mb-4">
        <h3 className="mb-3 font-semibold text-lg">DAK Non Fisik</h3>
      </div>
      <div className="mb-1">
        <div className="flex border-b border-zinc-600 mb-4">
          <button
            className={`px-5 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "tpg"
                ? "border-sky-400 text-sky-400"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("tpg")}
          >
            Tunjangan Penghasilan Guru &amp; ASN Daerah
          </button>
          <button
            className={`px-5 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "bosbop"
                ? "border-sky-400 text-sky-400"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("bosbop")}
          >
            BOS BOP
          </button>
        </div>
        {/* ===== TPG TAB ===== */}
        {activeTab === "tpg" && (
          <>
            <Section title="Filter Data TPG">
              <SelectField
                label="Tahun"
                options={tpgYearOptions}
                value={tpgSelectedYear}
                onChange={setTpgSelectedYear}
                defaultLabel="-- Semua Tahun --"
              />
              <SelectField
                label="Kanwil"
                options={tpgkanwilOptions}
                value={tpgSelectedkanwil}
                onChange={setTpgSelectedkanwil}
                defaultLabel="-- Semua --"
                disabled={role === "2" || role === "3"}
              />
              <SelectField
                label="KPPN"
                options={tpgkppnOptions}
                value={tpgSelectedkppn}
                onChange={setTpgSelectedkppn}
                defaultLabel="-- Semua --"
                disabled={role === "3"}
              />
              <SelectField
                label="Periode"
                options={tpgPeriodeOptions}
                value={tpgSelectedPeriode}
                onChange={setTpgSelectedPeriode}
                defaultLabel="-- Semua --"
              />
              <SelectField
                label="Gelombang"
                options={tpgGelombangOptions}
                value={tpgSelectedGelombang}
                onChange={setTpgSelectedGelombang}
                defaultLabel="-- Semua --"
              />
              <SelectField
                label="Jenis TKD"
                options={tpgJenisTkdOptions}
                value={tpgSelectedJenisTkd}
                onChange={setTpgSelectedJenisTkd}
                defaultLabel="-- Semua --"
              />
              <Field label="Bulan SP2D">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Select
                      value={tpgStartMonth}
                      onValueChange={setTpgStartMonth}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Dari Bulan" />
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
                  <span className="text-white text-sm px-2 shrink-0">s.d.</span>
                  <div className="flex-1">
                    <Select value={tpgEndMonth} onValueChange={setTpgEndMonth}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sampai Bulan" />
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
              </Field>
            </Section>
            <Section title="">
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
            </Section>
            {tpgShowResults && (
              <div className="results-section">
                <Section title={`Hasil Data (${tpgTableData.length} baris)`}>
                  {renderPagination(
                    tpgCurrentPage,
                    setTpgCurrentPage,
                    tpgTableData.length,
                  )}
                  <div
                    style={{
                      overflow: "auto",
                      maxHeight: "600px",
                      display: "block",
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    <table
                      className="table table-bordered"
                      style={{
                        minWidth: "2000px",
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
                          boxShadow: "0 2px 2px -1px rgba(0,0,0,0.4)",
                        }}
                      >
                        <tr>
                          <th rowSpan={2} style={{ minWidth: "40px" }}>
                            No
                          </th>
                          <th rowSpan={2} style={{ minWidth: "50px" }}>
                            Tahun
                          </th>
                          <th rowSpan={2} style={{ minWidth: "100px" }}>
                            Periode
                          </th>
                          <th rowSpan={2} style={{ minWidth: "60px" }}>
                            Kanwil
                          </th>
                          <th rowSpan={2} style={{ minWidth: "120px" }}>
                            Nama Kanwil
                          </th>
                          <th rowSpan={2} style={{ minWidth: "50px" }}>
                            KPPN
                          </th>
                          <th rowSpan={2} style={{ minWidth: "120px" }}>
                            Nama KPPN
                          </th>
                          <th rowSpan={2} style={{ minWidth: "120px" }}>
                            Lokasi
                          </th>
                          <th rowSpan={2} style={{ minWidth: "100px" }}>
                            Jenis TKD
                          </th>
                          <th
                            colSpan={12}
                            className="text-center"
                            style={{ minWidth: "1200px" }}
                          >
                            Realisasi Bulanan
                          </th>
                          <th rowSpan={2} style={{ minWidth: "120px" }}>
                            Total Setahun
                          </th>
                        </tr>
                        <tr>
                          {monthsShort.map((m) => (
                            <th key={m} style={{ minWidth: "90px" }}>
                              {m}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tpgTableData
                          .slice(
                            (tpgCurrentPage - 1) * itemsPerPage,
                            tpgCurrentPage * itemsPerPage,
                          )
                          .map((row, i) => (
                            <tr key={i}>
                              <td style={{ whiteSpace: "nowrap" }}>
                                {(tpgCurrentPage - 1) * itemsPerPage + i + 1}
                              </td>
                              <td style={{ whiteSpace: "nowrap" }}>
                                {row.thang}
                              </td>
                              <td style={{ whiteSpace: "nowrap" }}>
                                {row.nm_periode}
                              </td>
                              <td style={{ whiteSpace: "nowrap" }}>
                                {row.kode_kanwil}
                              </td>
                              <td style={{ whiteSpace: "normal" }}>
                                {row.nm_kanwil}
                              </td>
                              <td style={{ whiteSpace: "nowrap" }}>
                                {row.kppn}
                              </td>
                              <td style={{ whiteSpace: "normal" }}>
                                {row.nm_kppn}
                              </td>
                              <td style={{ whiteSpace: "normal" }}>
                                {row.nm_lokasi}
                              </td>
                              <td style={{ whiteSpace: "nowrap" }}>
                                {row.jenis_tkd}
                              </td>
                              {months.map((m) => (
                                <td
                                  key={m}
                                  style={{
                                    whiteSpace: "nowrap",
                                    textAlign: "right",
                                  }}
                                >
                                  {new Intl.NumberFormat("id-ID").format(
                                    row[m] || 0,
                                  )}
                                </td>
                              ))}
                              <td
                                style={{
                                  whiteSpace: "nowrap",
                                  textAlign: "right",
                                  fontWeight: "bold",
                                }}
                              >
                                {new Intl.NumberFormat("id-ID").format(
                                  row.total_setahun || 0,
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
              </div>
            )}
          </>
        )}

        {/* ===== BOS_BOP TAB ===== */}
        {activeTab === "bosbop" && (
          <>
            <Section title="Filter Data BOS BOP">
              <SelectField
                label="Tahun"
                options={bosBopYearOptions}
                value={bosBopSelectedYear}
                onChange={setBosBopSelectedYear}
                defaultLabel="-- Semua Tahun --"
              />
              <SelectField
                label="Kanwil"
                options={bosBopKanwilOptions}
                value={bosBopSelectedKanwil}
                onChange={setBosBopSelectedKanwil}
                defaultLabel="-- Semua --"
                disabled={role === "2" || role === "3"}
              />
              <SelectField
                label="KPPN"
                options={bosBopKppnOptions}
                value={bosBopSelectedKppn}
                onChange={setBosBopSelectedKppn}
                defaultLabel="-- Semua --"
                disabled={role === "3"}
              />
              <SelectField
                label="Program"
                options={bosBopProgramOptions}
                value={bosBopSelectedProgram}
                onChange={setBosBopSelectedProgram}
                defaultLabel="-- Semua --"
              />
              <SelectField
                label="Jenis BOS"
                options={bosBopJenisBosOptions}
                value={bosBopSelectedJenisBos}
                onChange={setBosBopSelectedJenisBos}
                defaultLabel="-- Semua --"
              />
              <SelectField
                label="Jenjang"
                options={bosBopJenjangOptions}
                value={bosBopSelectedJenjang}
                onChange={setBosBopSelectedJenjang}
                defaultLabel="-- Semua --"
              />
              <Field label="Bulan SP2D">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Select
                      value={bosBopStartMonth}
                      onValueChange={setBosBopStartMonth}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Dari Bulan" />
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
                  <span className="text-white text-sm px-2 shrink-0">s.d.</span>
                  <div className="flex-1">
                    <Select
                      value={bosBopEndMonth}
                      onValueChange={setBosBopEndMonth}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sampai Bulan" />
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
              </Field>
            </Section>
            <Section title="">
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
            </Section>
            {bosBopShowResults && (
              <div className="results-section">
                <Section title={`Hasil Data (${bosBopTableData.length} baris)`}>
                  {renderPagination(
                    bosBopCurrentPage,
                    setBosBopCurrentPage,
                    bosBopTableData.length,
                  )}
                  <div
                    style={{
                      overflow: "auto",
                      maxHeight: "600px",
                      display: "block",
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    <table
                      className="table table-bordered"
                      style={{
                        minWidth: "1600px",
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
                          boxShadow: "0 2px 2px -1px rgba(0,0,0,0.4)",
                        }}
                      >
                        <tr>
                          <th rowSpan={2}>No</th>
                          <th rowSpan={2}>Tahun</th>
                          <th rowSpan={2}>Kanwil</th>
                          <th rowSpan={2}>Nama Kanwil</th>
                          <th rowSpan={2}>KPPN</th>
                          <th rowSpan={2}>Nama KPPN (Wilayah)</th>
                          <th rowSpan={2}>Program</th>
                          <th rowSpan={2}>Jenjang</th>
                          <th rowSpan={2}>Status Sekolah</th>
                          <th rowSpan={2}>Jenis BOS</th>
                          <th rowSpan={2}>Lokasi Sekolah</th>
                          <th rowSpan={2}>Nama Lokasi Sekolah</th>
                          <th colSpan={12} className="text-center">
                            Realisasi Bulanan
                          </th>
                          <th rowSpan={2}>Total Nilai</th>
                          <th rowSpan={2}>Total Siswa</th>
                        </tr>
                        <tr>
                          {monthsShort.map((m) => (
                            <th key={m} style={{ minWidth: "90px" }}>
                              {m}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bosBopTableData
                          .slice(
                            (bosBopCurrentPage - 1) * itemsPerPage,
                            bosBopCurrentPage * itemsPerPage,
                          )
                          .map((row, i) => (
                            <tr key={i}>
                              <td style={{ whiteSpace: "nowrap" }}>
                                {(bosBopCurrentPage - 1) * itemsPerPage + i + 1}
                              </td>
                              <td style={{ whiteSpace: "nowrap" }}>
                                {row.thang}
                              </td>
                              <td style={{ whiteSpace: "nowrap" }}>
                                {row.kdkanwil}
                              </td>
                              <td style={{ whiteSpace: "normal" }}>
                                {row.nmkanwil}
                              </td>
                              <td style={{ whiteSpace: "nowrap" }}>
                                {row.kdkppn}
                              </td>
                              <td style={{ whiteSpace: "normal" }}>
                                {row.nmkabkota_kppn}
                              </td>
                              <td style={{ whiteSpace: "normal" }}>
                                {row.nmprogram}
                              </td>
                              <td style={{ whiteSpace: "nowrap" }}>
                                {row.jenjang}
                              </td>
                              <td style={{ whiteSpace: "normal" }}>
                                {row.status_sekolah}
                              </td>
                              <td style={{ whiteSpace: "normal" }}>
                                {row.jenis_bos}
                              </td>
                              <td style={{ whiteSpace: "nowrap" }}>
                                {row.kdlokasi_kedudukan}
                              </td>
                              <td style={{ whiteSpace: "normal" }}>
                                {row.nmkabkota_sekolah}
                              </td>
                              {months.map((m) => (
                                <td
                                  key={m}
                                  style={{
                                    whiteSpace: "nowrap",
                                    textAlign: "right",
                                  }}
                                >
                                  {new Intl.NumberFormat("id-ID").format(
                                    row[m] || 0,
                                  )}
                                </td>
                              ))}
                              <td
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
                              <td
                                style={{
                                  whiteSpace: "nowrap",
                                  textAlign: "right",
                                  fontWeight: "bold",
                                }}
                              >
                                {new Intl.NumberFormat("id-ID").format(
                                  row.total_siswa || 0,
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
              </div>
            )}
          </>
        )}
      </div>

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

export default DNF;
