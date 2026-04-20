"use client";

import React, { useState, useEffect, useContext } from "react";
// @ts-ignore
import {
    Row,
    Col,
    Card,
    Button,
    Dropdown,
    ButtonGroup,
    Spinner,
    Form,
    Modal,
    Table,
} from "react-bootstrap";
import Swal from "sweetalert2";
// @ts-ignore
import MyContext from "../../../../auth/Context";
import * as xlsx from "xlsx";

// Interface for Context
interface AuthContextProps {
    axiosJWT: any;
    token: string;
    role: string;
    kdkanwil: string;
    kdkppn: string;
}

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

// Presentational subcomponents
interface SectionProps {
    title: string;
    children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
    <Row>
        <Col lg={12}>
            <Card
                className="custom-card"
                style={{
                    backgroundColor: "#52525B",
                    color: "#ffffff",
                    borderRadius: "12px",
                    paddingTop: "16px",
                }}
            >
                <Card.Body className="py-1 px-2">
                    <div className="bagian-query">
                        <div className="custom-content">
                            <h5 className="text-white mb-1">{title}</h5>
                            {children}
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </Col>
    </Row>
);

interface FieldProps {
    label: string;
    children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, children }) => (
    <Row className="mb-3 align-items-center">
        <Col lg={2}>
            <label className="form-label text-white mb-0">{label}</label>
        </Col>
        <Col lg={10}>{children}</Col>
    </Row>
);

interface SelectFieldProps {
    label: string;
    options?: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    defaultLabel?: string;
    disabled?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({
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
}) => (
    <div className="button-query">
        <Row>
            <Col lg={12}>
                <Button
                    variant="success"
                    size="sm"
                    className="button me-2"
                    onClick={onTayang}
                    disabled={loadingResults}
                    style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
                >
                    {loadingResults ? (
                        <>
                            <Spinner animation="border" size="sm" className="me-1" />
                            Loading...
                        </>
                    ) : (
                        "Tayang"
                    )}
                </Button>

                <Dropdown as={ButtonGroup}>
                    <Button
                        variant="info"
                        className="button-download"
                        style={{ backgroundColor: "#0ea5e9", borderColor: "#0ea5e9" }}
                    >
                        <i className="bi bi-download me-1"></i>
                        Download
                    </Button>
                    <Dropdown.Toggle
                        variant="info"
                        className="button-download-split me-2 dropup"
                        style={{ backgroundColor: "#0ea5e9", borderColor: "#0ea5e9" }}
                    />
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={onDownloadCSV}>
                            <i className="bi bi-file-earmark-font text-danger fw-bold"></i>{" "}
                            CSV
                        </Dropdown.Item>
                        <Dropdown.Item onClick={onDownloadExcel}>
                            <i className="bi bi-file-earmark-excel text-success fw-bold"></i>{" "}
                            EXCEL
                        </Dropdown.Item>
                        <Dropdown.Item onClick={onDownloadPDF}>
                            <i className="bi bi-file-earmark-pdf text-danger fw-bold"></i> PDF
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>

                <Button
                    variant="secondary"
                    size="sm"
                    className="button me-2"
                    onClick={onRefresh}
                    title="Refresh Halaman"
                    style={{ backgroundColor: "#6b7280", borderColor: "#6b7280" }}
                >
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Refresh
                </Button>

                {role === "X" && (
                    <Button
                        variant="warning"
                        size="sm"
                        className="button me-2"
                        onClick={onShowSQL}
                        style={{
                            backgroundColor: "#f59e0b",
                            borderColor: "#f59e0b",
                            color: "#000",
                        }}
                    >
                        SQL
                    </Button>
                )}
            </Col>
        </Row>
    </div>
);

const DD_header: React.FC = () => {
    const { axiosJWT, token, role, kdkanwil, kdkppn } = useContext(MyContext) as AuthContextProps;
    const year = new Date().getFullYear();

    // State untuk filter
    const [selectedYear, setSelectedYear] = useState<string>(String(year));
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

    // Date Filters
    const [startDate, setStartDate] = useState<string>(`${year}-01-01`);
    const [endDate, setEndDate] = useState<string>(`${year}-12-31`);

    // Update dates when year changes
    useEffect(() => {
        if (selectedYear) {
            setStartDate(`${selectedYear}-01-01`);
            setEndDate(`${selectedYear}-12-31`);
        }
    }, [selectedYear]);

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
                "SELECT DISTINCT thang FROM bot.dak_fisik ORDER BY thang DESC";
            const encodedQuery = encodeURIComponent(query);
            const response = await axiosJWT.get(
                `${process.env.NEXT_PUBLIC_DAKFISIK_DNF_DATA}${encodedQuery}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            const years = response.data.result || [];
            setYearOptions(years.map((y: any) => ({ label: y.thang, value: y.thang })));
            setSelectedYear(String(year));
        } catch (error) {
            console.error("Error fetching years:", error);
        }
    };

    const fetchKanwilData = async () => {
        try {
            let query =
                "SELECT DISTINCT kdkanwil, nmkanwil FROM dbref.t_kanwil_2025 WHERE kdkanwil IS NOT NULL ORDER BY kdkanwil ASC";

            if (
                (role === "2" || role === "3") &&
                kdkanwil
            ) {
                query = `SELECT DISTINCT kdkanwil, nmkanwil FROM dbref.t_kanwil_2025 WHERE kdkanwil = '${kdkanwil}'`;
            }

            const encodedQuery = encodeURIComponent(query);
            const response = await axiosJWT.get(
                `${process.env.NEXT_PUBLIC_DAKFISIK_DNF_DATA}${encodedQuery}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            const kanwil = response.data.result || [];
            setKanwilOptions(
                kanwil.map((k: any) => ({
                    label: `${k.kdkanwil} - ${k.nmkanwil}`,
                    value: k.kdkanwil,
                })),
            );

            if (
                (role === "2" || role === "3") &&
                kdkanwil
            ) {
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

            if ((role === "3") && kdkppn) {
                query = `SELECT DISTINCT kdkppn, nmkppn FROM dbref.t_kppn_2026 WHERE kdkppn = '${kdkppn}' ORDER BY kdkppn ASC`;
            } else if ((role === "2") && kdkanwil) {
                query = `SELECT DISTINCT kdkppn, nmkppn FROM dbref.t_kppn_2026 WHERE kdkanwil = '${kdkanwil}' ORDER BY kdkppn ASC`;
            } else if (selectedKanwil) {
                query = `SELECT DISTINCT kdkppn, nmkppn FROM dbref.t_kppn_2026 WHERE kdkanwil = '${selectedKanwil}' ORDER BY kdkppn ASC`;
            } else {
                query =
                    "SELECT DISTINCT kdkppn, nmkppn FROM dbref.t_kppn_2026 WHERE kdkppn IS NOT NULL ORDER BY kdkppn ASC";
            }

            const encodedQuery = encodeURIComponent(query);
            const response = await axiosJWT.get(
                `${process.env.NEXT_PUBLIC_DAKFISIK_DNF_DATA}${encodedQuery}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            const kppn = response.data.result || [];
            setKppnOptions(
                kppn.map((k: any) => ({
                    label: `${k.kdkppn} - ${k.nmkppn || "N/A"}`,
                    value: k.kdkppn,
                })),
            );

            if ((role === "3") && kdkppn) {
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
                "SELECT DISTINCT a.kdlokasi, b.nmkabkota FROM bot.dd_header a LEFT JOIN dbref.t_kabkota_apbd b ON a.kdlokasi = REPLACE(b.kdkabkota, '.', '') ORDER BY a.kdlokasi ASC";
            const encodedQuery = encodeURIComponent(query);
            const response = await axiosJWT.get(
                `${process.env.NEXT_PUBLIC_DAKFISIK_DNF_DATA}${encodedQuery}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            const lokasi = response.data.result || [];
            setLokasiOptions(
                lokasi.map((l: any) => ({
                    label: `${l.kdlokasi} - ${l.nmkabkota || "N/A"}`,
                    value: l.kdlokasi,
                })),
            );
        } catch (error) {
            console.error("Error fetching lokasi:", error);
        }
    };

    // Generate SQL Query
    const generateSQLQuery = (): string => {
        let cteWhere = "WHERE 1=1";
        if (selectedYear) cteWhere += ` AND a.thang = '${selectedYear}'`;

        const filterKanwil =
            selectedkanwil ||
            (role === "2" || role === "3"
                ? kdkanwil
                : "");
        if (filterKanwil) cteWhere += ` AND b.kdkanwil = '${filterKanwil}'`;

        const filterKppn =
            selectedkppn || (role === "3" ? kdkppn : "");
        if (filterKppn) cteWhere += ` AND a.kdkppn = '${filterKppn}'`;

        if (selectedLokasi) cteWhere += ` AND a.kdlokasi = '${selectedLokasi}'`;
        if (startDate && endDate)
            cteWhere += ` AND a.tgsp2d BETWEEN '${startDate}' AND '${endDate}'`;

        let mainWhere = "WHERE 1=1";
        if (selectedYear) mainWhere += ` AND p.thang = '${selectedYear}'`;
        if (filterKanwil) mainWhere += ` AND k_ref.kdkanwil = '${filterKanwil}'`;
        if (filterKppn) mainWhere += ` AND p.kdkppn = '${filterKppn}'`;
        if (selectedLokasi) mainWhere += ` AND p.kdlokasi = '${selectedLokasi}'`;

        let whereConditions = "WHERE 1=1";
        if (selectedYear) whereConditions += ` AND a.thang = '${selectedYear}'`;
        if (filterKanwil) whereConditions += ` AND c.kdkanwil = '${filterKanwil}'`;
        if (filterKppn) whereConditions += ` AND a.kdkppn = '${filterKppn}'`;
        if (selectedLokasi)
            whereConditions += ` AND a.kdlokasi = '${selectedLokasi}'`;
        if (startDate && endDate)
            whereConditions += ` AND a.tgl_sp2d BETWEEN '${startDate}' AND '${endDate}'`;

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
    SUM(CASE WHEN MONTH(a.tgl_sp2d) = 1 THEN a.rupiah ELSE 0 END) AS Januari,
    SUM(CASE WHEN MONTH(a.tgl_sp2d) = 2 THEN a.rupiah ELSE 0 END) AS Februari,
    SUM(CASE WHEN MONTH(a.tgl_sp2d) = 3 THEN a.rupiah ELSE 0 END) AS Maret,
    SUM(CASE WHEN MONTH(a.tgl_sp2d) = 4 THEN a.rupiah ELSE 0 END) AS April,
    SUM(CASE WHEN MONTH(a.tgl_sp2d) = 5 THEN a.rupiah ELSE 0 END) AS Mei,
    SUM(CASE WHEN MONTH(a.tgl_sp2d) = 6 THEN a.rupiah ELSE 0 END) AS Juni,
    SUM(CASE WHEN MONTH(a.tgl_sp2d) = 7 THEN a.rupiah ELSE 0 END) AS Juli,
    SUM(CASE WHEN MONTH(a.tgl_sp2d) = 8 THEN a.rupiah ELSE 0 END) AS Agustus,
    SUM(CASE WHEN MONTH(a.tgl_sp2d) = 9 THEN a.rupiah ELSE 0 END) AS September,
    SUM(CASE WHEN MONTH(a.tgl_sp2d) = 10 THEN a.rupiah ELSE 0 END) AS Oktober,
    SUM(CASE WHEN MONTH(a.tgl_sp2d) = 11 THEN a.rupiah ELSE 0 END) AS November,
    SUM(CASE WHEN MONTH(a.tgl_sp2d) = 12 THEN a.rupiah ELSE 0 END) AS Desember,
    SUM(a.rupiah) AS total_nilai
FROM bot.dd_header a
LEFT JOIN dbref.t_kabkota_apbd b 
    ON a.kdlokasi = REPLACE(b.kdkabkota, '.', '')
LEFT JOIN dbref.t_kppn_2025 c 
    ON a.kdkppn = c.kdkppn
LEFT JOIN dbref.t_kanwil_2025 d 
    ON c.kdkanwil = d.kdkanwil
LEFT JOIN (
    SELECT thang, kdlokasi, SUM(pagu) AS total_pagu
    FROM bot.dd_pagu
    GROUP BY thang, kdlokasi
) p ON a.kdlokasi = p.kdlokasi COLLATE utf8mb4_0900_ai_ci 
    AND a.thang = p.thang COLLATE utf8mb4_0900_ai_ci
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
            { wch: 5 }, { wch: 6 }, { wch: 10 }, { wch: 25 }, { wch: 10 },
            { wch: 20 }, { wch: 10 }, { wch: 30 }, { wch: 15 }, { wch: 15 },
            { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
            { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
            { wch: 15 }, { wch: 15 },
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
            "No", "Tahun", "Kode Kanwil", "Nama Kanwil", "Kode KPPN", "Nama KPPN",
            "Kode Lokasi", "Nama Pemda", "Pagu", "Januari", "Februari", "Maret",
            "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober",
            "November", "Desember", "Total",
        ];

        let csv = headers.join(",") + "\n";

        data.forEach((row, index) => {
            csv += [
                index + 1, row.thang, row.kdkanwil, row.nmkanwil, row.kdkppn,
                row.nmkppn, row.kdlokasi, row.nmkabkota, row.pagu, row.Januari,
                row.Februari, row.Maret, row.April, row.Mei, row.Juni, row.Juli,
                row.Agustus, row.September, row.Oktober, row.November, row.Desember,
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
            const response = await axiosJWT.get(
                `${process.env.NEXT_PUBLIC_DAKFISIK_DNF_DATA}${encodedQuery}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
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
            <Row className="mb-4">
                <Col lg={12}>
                    <h3 className="mb-3">Dana Desa</h3>
                </Col>
            </Row>

            {/* Filter Section */}
            <Section title="Filter Data">
                <SelectField
                    label="Tahun"
                    options={yearOptions}
                    value={selectedYear}
                    onChange={setSelectedYear}
                    defaultLabel="-- Semua --"
                />
                <SelectField
                    label="Kanwil"
                    options={kanwilOptions}
                    value={selectedkanwil}
                    onChange={setSelectedkanwil}
                    defaultLabel="-- Semua --"
                    disabled={role === "2" || role === "3"}
                />
                <SelectField
                    label="KPPN"
                    options={kppnOptions}
                    value={selectedkppn}
                    onChange={setSelectedkppn}
                    defaultLabel="-- Semua --"
                    disabled={role === "3"}
                />
                <SelectField
                    label="Lokasi"
                    options={lokasiOptions}
                    value={selectedLokasi}
                    onChange={setSelectedLokasi}
                    defaultLabel="-- Semua --"
                />
                <Field label="Tanggal SP2D">
                    <Row>
                        <Col md={5}>
                            <Form.Control
                                type="date"
                                value={startDate}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                            />
                        </Col>
                        <Col md={2} className="text-center text-white align-self-center">
                            s.d.
                        </Col>
                        <Col md={5}>
                            <Form.Control
                                type="date"
                                value={endDate}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                            />
                        </Col>
                    </Row>
                </Field>
            </Section>

            {/* Button Section */}
            <Section title="">
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
            </Section>

            {/* Results Section */}
            {showResults && (
                <div className="results-section">
                    <Section title={`Hasil Data (${tableData.length} baris)`}>
                        <div
                            className="mb-3 d-flex justify-content-between align-items-center"
                            style={{
                                backgroundColor: "#1e293b",
                                padding: "10px 15px",
                                borderRadius: "6px",
                            }}
                        >
                            <div className="text-white">
                                Halaman {currentPage} dari{" "}
                                {Math.ceil(tableData.length / itemsPerPage) || 1}
                            </div>
                            <div>
                                <Button
                                    size="sm"
                                    variant="outline-light"
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="me-2"
                                >
                                    ← Sebelumnya
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline-light"
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
                        >
                            <Table
                                striped
                                bordered
                                hover
                                variant="dark"
                                style={{
                                    minWidth: "2500px",
                                    marginBottom: 0,
                                    wordWrap: "break-word",
                                    tableLayout: "auto",
                                    fontSize: "0.85rem",
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
                                        <th rowSpan={2} style={{ width: "2%", minWidth: "40px" }}>No</th>
                                        <th rowSpan={2} style={{ width: "4%", minWidth: "60px" }}>Tahun</th>
                                        <th rowSpan={2} style={{ width: "4%", minWidth: "60px" }}>Kd Kanwil</th>
                                        <th rowSpan={2} style={{ width: "10%", minWidth: "150px" }}>Nama Kanwil</th>
                                        <th rowSpan={2} style={{ width: "4%", minWidth: "60px" }}>Kd KPPN</th>
                                        <th rowSpan={2} style={{ width: "10%", minWidth: "150px" }}>Nama KPPN</th>
                                        <th rowSpan={2} style={{ width: "4%", minWidth: "60px" }}>Kd Lokasi</th>
                                        <th rowSpan={2} style={{ width: "10%", minWidth: "180px" }}>Nama Pemda</th>
                                        <th rowSpan={2} style={{ width: "6%", minWidth: "120px" }}>Pagu</th>
                                        <th colSpan={12} className="text-center">Realisasi Bulanan</th>
                                        <th rowSpan={2} style={{ width: "6%", minWidth: "120px" }}>Total</th>
                                    </tr>
                                    <tr>
                                        {["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"].map((m) => (
                                            <th key={m} style={{ minWidth: "100px" }}>{m}</th>
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
                                            <tr key={index}>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>{row.thang}</td>
                                                <td style={{ whiteSpace: "nowrap" }}>{row.kdkanwil}</td>
                                                <td style={{ whiteSpace: "normal", wordWrap: "break-word" }}>{row.nmkanwil}</td>
                                                <td style={{ whiteSpace: "nowrap" }}>{row.kdkppn}</td>
                                                <td style={{ whiteSpace: "normal", wordWrap: "break-word" }}>{row.nmkppn}</td>
                                                <td style={{ whiteSpace: "nowrap" }}>{row.kdlokasi}</td>
                                                <td style={{ whiteSpace: "normal", wordWrap: "break-word" }}>{row.nmkabkota}</td>
                                                <td style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                                                    {new Intl.NumberFormat("id-ID").format(row.pagu || 0)}
                                                </td>
                                                {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m) => (
                                                    <td key={m} style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                                                        {new Intl.NumberFormat("id-ID").format(row[m] || 0)}
                                                    </td>
                                                ))}
                                                <td style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                                                    {new Intl.NumberFormat("id-ID").format(row.total_nilai || 0)}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </Table>
                        </div>
                    </Section>
                </div>
            )}

            {/* SQL Modal */}
            <Modal show={showModalSQL} onHide={handleCloseSQL} size="lg">
                <Modal.Header closeButton style={{ backgroundColor: "#334155" }}>
                    <Modal.Title style={{ color: "white" }}>SQL Query</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ backgroundColor: "#1e293b" }}>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleCopy}
                        className="mb-2"
                    >
                        {isCopied ? "Copied!" : "Copy to Clipboard"}
                    </Button>
                    <pre
                        style={{
                            backgroundColor: "#0f172a",
                            color: "#10b981",
                            padding: "15px",
                            borderRadius: "6px",
                            overflow: "auto",
                            maxHeight: "300px",
                        }}
                    >
                        {sqlQuery}
                    </pre>
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: "#334155" }}>
                    <Button variant="secondary" onClick={handleCloseSQL}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default DD_header;
