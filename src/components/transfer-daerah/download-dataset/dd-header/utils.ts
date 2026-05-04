import Swal from "sweetalert2";
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

export const convertTableDataToPDF = (data: DDHeaderData[], selectedYear: string): string => {
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
