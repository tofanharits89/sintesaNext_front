import * as xlsx from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { TpgData, BosBopData } from "./dnf-types";

export const generateTpgSQLQuery = (params: {
  selectedYear: string;
  selectedkanwil: string;
  selectedkppn: string;
  startMonth: string;
  endMonth: string;
  selectedPeriode: string;
  selectedGelombang: string;
  selectedJenisTkd: string;
  role: string;
  kdkanwil: string;
  kdkppn: string;
}): string => {
  const {
    selectedYear,
    selectedkanwil,
    selectedkppn,
    startMonth,
    endMonth,
    selectedPeriode,
    selectedGelombang,
    selectedJenisTkd,
    role,
    kdkanwil,
    kdkppn,
  } = params;

  let w = "WHERE 1=1";
  if (selectedYear && selectedYear !== "all") w += ` AND thang = '${selectedYear}'`;
  
  const fKanwil = selectedkanwil || ((role === "2" || role === "3") ? kdkanwil : "");
  if (fKanwil) w += ` AND kode_kanwil = '${fKanwil}'`;
  
  const fKppn = selectedkppn || (role === "3" ? kdkppn : "");
  if (fKppn) w += ` AND kppn = '${fKppn}'`;
  
  if (startMonth && endMonth) w += ` AND EXTRACT(MONTH FROM tgsp2d) BETWEEN ${startMonth} AND ${endMonth}`;
  if (selectedPeriode && selectedPeriode !== "all") w += ` AND nm_periode = '${selectedPeriode}'`;
  if (selectedGelombang && selectedGelombang !== "all") w += ` AND gelombang = '${selectedGelombang}'`;
  if (selectedJenisTkd && selectedJenisTkd !== "all") w += ` AND nama_detail = '${selectedJenisTkd}'`;

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

export const generateBosBopSQLQuery = (params: {
  selectedYear: string;
  startMonth: string;
  endMonth: string;
  selectedProgram: string;
  selectedJenisBos: string;
  selectedJenjang: string;
  selectedKanwil: string;
  selectedKppn: string;
  role: string;
  kdkanwil: string;
  kdkppn: string;
}): string => {
  const {
    selectedYear,
    startMonth,
    endMonth,
    selectedProgram,
    selectedJenisBos,
    selectedJenjang,
    selectedKanwil,
    selectedKppn,
    role,
    kdkanwil,
    kdkppn,
  } = params;

  let w = "WHERE 1=1";
  if (selectedYear && selectedYear !== "all") w += ` AND a.thang = '${selectedYear}'`;
  if (startMonth && endMonth) w += ` AND EXTRACT(MONTH FROM a.tgsp2d) BETWEEN ${startMonth} AND ${endMonth}`;
  if (selectedProgram && selectedProgram !== "all") w += ` AND a.nmprogram = '${selectedProgram}'`;
  if (selectedJenisBos && selectedJenisBos !== "all") w += ` AND a.jenis_bos = '${selectedJenisBos}'`;
  if (selectedJenjang && selectedJenjang !== "all") w += ` AND a.jenjang = '${selectedJenjang}'`;
  
  const fKanwil = selectedKanwil || ((role === "2" || role === "3") ? kdkanwil : "");
  if (fKanwil) w += ` AND c.kdkanwil = '${fKanwil}'`;
  
  const fKppn = selectedKppn || (role === "3" ? kdkppn : "");
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

export const convertTableDataToCSV = (data: any[], activeTab: string): string => {
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

export const exportToExcel = (data: any[], activeTab: string, selectedYear: string) => {
  const ws = xlsx.utils.json_to_sheet(data);
  const wb = xlsx.utils.book_new();
  const sheetName = activeTab === "tpg" ? "TPG" : "BOS_BOP";
  xlsx.utils.book_append_sheet(wb, ws, sheetName);
  ws["!cols"] = activeTab === "tpg" ? Array(23).fill({ wch: 12 }) : Array(26).fill({ wch: 12 });
  xlsx.writeFile(wb, activeTab === "tpg" ? `tpg_${selectedYear || "semua_tahun"}.xlsx` : `bos_bop_${selectedYear || "semua_tahun"}.xlsx`);
};

export const handleDownloadPDF = (data: any[], activeTab: string, selectedYear: string) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const title = activeTab === "tpg" ? "Laporan TPG" : "Laporan BOS / BOP";
  const yearText = selectedYear && selectedYear !== "all" ? `Tahun ${selectedYear}` : "Semua Tahun";

  doc.setFontSize(14);
  doc.text(`${title} ${yearText}`, 14, 15);
  doc.setFontSize(10);
  doc.text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, 14, 22);

  let tableColumn: string[] = [];
  let tableRows: any[][] = [];

  if (activeTab === "tpg") {
    tableColumn = [
      "No", "Tahun", "Periode", "Kanwil", "KPPN", "Lokasi", "Jenis TKD",
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
      "Jul", "Ags", "Sep", "Okt", "Nov", "Des", "Total"
    ];
    tableRows = data.map((row, index) => {
      const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n || 0);
      return [
        index + 1,
        row.thang,
        row.nm_periode,
        row.kode_kanwil,
        row.kppn,
        row.nm_lokasi,
        row.jenis_tkd,
        fmt(row.Januari), fmt(row.Februari), fmt(row.Maret), fmt(row.April), 
        fmt(row.Mei), fmt(row.Juni), fmt(row.Juli), fmt(row.Agustus), 
        fmt(row.September), fmt(row.Oktober), fmt(row.November), fmt(row.Desember),
        fmt(row.total_setahun)
      ];
    });
  } else {
    tableColumn = [
      "No", "Tahun", "Kanwil", "KPPN", "Program", "Jenjang", "Status", "Jenis", "Lokasi",
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
      "Jul", "Ags", "Sep", "Okt", "Nov", "Des", "Total", "Siswa"
    ];
    tableRows = data.map((row, index) => {
      const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n || 0);
      return [
        index + 1,
        row.thang,
        row.kdkanwil,
        row.kdkppn,
        row.nmprogram,
        row.jenjang,
        row.status_sekolah,
        row.jenis_bos,
        row.nmkabkota_sekolah || row.kdlokasi_kedudukan,
        fmt(row.Januari), fmt(row.Februari), fmt(row.Maret), fmt(row.April), 
        fmt(row.Mei), fmt(row.Juni), fmt(row.Juli), fmt(row.Agustus), 
        fmt(row.September), fmt(row.Oktober), fmt(row.November), fmt(row.Desember),
        fmt(row.total_nilai),
        fmt(row.total_siswa)
      ];
    });
  }

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 28,
    styles: { fontSize: 6, cellPadding: 1.5 },
    headStyles: { fillColor: [82, 82, 91], textColor: 255, halign: "center" },
    columnStyles: activeTab === "tpg" ? {
      7: { halign: "right" }, 8: { halign: "right" }, 9: { halign: "right" },
      10: { halign: "right" }, 11: { halign: "right" }, 12: { halign: "right" },
      13: { halign: "right" }, 14: { halign: "right" }, 15: { halign: "right" },
      16: { halign: "right" }, 17: { halign: "right" }, 18: { halign: "right" },
      19: { halign: "right" }
    } : {
      9: { halign: "right" }, 10: { halign: "right" }, 11: { halign: "right" },
      12: { halign: "right" }, 13: { halign: "right" }, 14: { halign: "right" },
      15: { halign: "right" }, 16: { halign: "right" }, 17: { halign: "right" },
      18: { halign: "right" }, 19: { halign: "right" }, 20: { halign: "right" },
      21: { halign: "right" }, 22: { halign: "right" }
    }
  });

  const fileName = activeTab === "tpg" ? `tpg_${selectedYear}.pdf` : `bos_bop_${selectedYear}.pdf`;
  doc.save(fileName);
};
