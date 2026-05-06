import Swal from "sweetalert2";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DDHeaderData } from "./types";

export const MONTHS = [
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

export const SwalConfig = Swal.mixin({
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

export const generateSQLQuery = (
  selectedYear: string,
  selectedkanwil: string,
  selectedkppn: string,
  selectedLokasi: string,
  startMonth: string,
  endMonth: string,
  role: string,
  kdkanwil: string,
  kdkppn: string
): string => {
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

export const convertTableDataToCSV = (data: DDHeaderData[]): string => {
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

export const handleDownloadPDF = (data: DDHeaderData[], selectedYear: string) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  doc.setFontSize(14);
  doc.text(`Laporan Dana Desa Tahun ${selectedYear}`, 14, 15);
  doc.setFontSize(10);
  doc.text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, 14, 22);

  const tableColumn = [
    "No", "Tahun", "Kanwil", "KPPN", "Pemda", 
    "Pagu", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
    "Jul", "Ags", "Sep", "Okt", "Nov", "Des", "Total"
  ];
  
  const tableRows = data.map((row, index) => {
    const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n || 0);
    return [
      index + 1,
      row.thang,
      row.nmkanwil || row.kdkanwil,
      row.nmkppn || row.kdkppn,
      row.nmkabkota || row.kdlokasi,
      fmt(row.pagu),
      fmt(row.Januari), fmt(row.Februari), fmt(row.Maret), fmt(row.April), 
      fmt(row.Mei), fmt(row.Juni), fmt(row.Juli), fmt(row.Agustus), 
      fmt(row.September), fmt(row.Oktober), fmt(row.November), fmt(row.Desember),
      fmt(row.total_nilai)
    ];
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 28,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [82, 82, 91], textColor: 255, halign: "center" },
    columnStyles: {
      5: { halign: "right" },
      6: { halign: "right" }, 7: { halign: "right" }, 8: { halign: "right" },
      9: { halign: "right" }, 10: { halign: "right" }, 11: { halign: "right" },
      12: { halign: "right" }, 13: { halign: "right" }, 14: { halign: "right" },
      15: { halign: "right" }, 16: { halign: "right" }, 17: { halign: "right" },
      18: { halign: "right" }
    }
  });

  doc.save(`dana_desa_${selectedYear}.pdf`);
};
