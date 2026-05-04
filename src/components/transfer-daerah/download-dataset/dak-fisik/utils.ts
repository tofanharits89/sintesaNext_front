import Swal from "sweetalert2";
import * as xlsx from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DakFisikData } from "./types";

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

export const generateSQLQuery = (params: {
  selectedYear: string;
  selectedkanwil: string;
  selectedkppn: string;
  selectedLokasi: string;
  startMonth: string;
  endMonth: string;
  selectedJenisDana: string;
  selectedBidang: string;
  selectedSubBidang: string;
  role: string;
  kdkanwil: string;
  kdkppn: string;
}): string => {
  const {
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
  } = params;

  const filterKanwil = selectedkanwil || (role === "2" || role === "3" ? kdkanwil : "");
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

export const convertTableDataToCSV = (data: DakFisikData[]): string => {
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

export const handleDownloadPDF = (data: DakFisikData[], selectedYear: string) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  doc.setFontSize(14);
  doc.text(`Laporan DAK Fisik Tahun ${selectedYear}`, 14, 15);
  doc.setFontSize(10);
  doc.text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, 14, 22);

  const tableColumn = [
    "No", "Pemda", "Kanwil", "KPPN", "Bidang", "Sub Bidang", 
    "Pagu", "Realisasi", "Sisa", "%", 
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
    "Jul", "Ags", "Sep", "Okt", "Nov", "Des"
  ];
  
  const tableRows = data.map((row, index) => {
    const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n || 0);
    return [
      index + 1,
      row.pemda || row.kdlokasi,
      row.kdkanwil,
      row.nmkppn || row.kdkppn,
      row.nmbidang,
      row.nmsubidang,
      fmt(row.pagu),
      fmt(row.total_penyaluran),
      fmt(row.sisa_pagu),
      `${row.prosentase}%`,
      fmt(row.Jan), fmt(row.Feb), fmt(row.Mar), fmt(row.Apr), 
      fmt(row.Mei), fmt(row.Jun), fmt(row.Jul), fmt(row.Ags), 
      fmt(row.Sep), fmt(row.Okt), fmt(row.Nov), fmt(row.Des)
    ];
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 28,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [82, 82, 91], textColor: 255, halign: "center" },
    columnStyles: {
      6: { halign: "right" },
      7: { halign: "right" },
      8: { halign: "right" },
      9: { halign: "center" },
      10: { halign: "right" }, 11: { halign: "right" }, 12: { halign: "right" },
      13: { halign: "right" }, 14: { halign: "right" }, 15: { halign: "right" },
      16: { halign: "right" }, 17: { halign: "right" }, 18: { halign: "right" },
      19: { halign: "right" }, 20: { halign: "right" }, 21: { halign: "right" }
    }
  });

  doc.save(`dak_fisik_${selectedYear}.pdf`);
};

export const handleDownloadExcel = (tableData: DakFisikData[], selectedYear: string) => {
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
    { wch: 5 }, { wch: 6 }, { wch: 10 }, { wch: 30 }, { wch: 10 },
    { wch: 10 }, { wch: 20 }, { wch: 8 }, { wch: 12 }, { wch: 8 },
    { wch: 25 }, { wch: 8 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
  ];
  ws["!cols"] = colWidths;

  xlsx.writeFile(wb, `dak_fisik_${selectedYear}.xlsx`);
};
