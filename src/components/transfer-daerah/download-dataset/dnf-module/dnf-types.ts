export interface SelectOption {
  label: string;
  value: string;
}

export interface TpgData {
  thang: string;
  nm_periode: string;
  kode_kanwil: string;
  nm_kanwil: string;
  kppn: string;
  nm_kppn: string;
  nm_lokasi: string;
  jenis_tkd: string;
  Januari?: number;
  Februari?: number;
  Maret?: number;
  April?: number;
  Mei?: number;
  Juni?: number;
  Juli?: number;
  Agustus?: number;
  September?: number;
  Oktober?: number;
  November?: number;
  Desember?: number;
  total_setahun?: number;
  [key: string]: any;
}

export interface BosBopData {
  thang: string;
  kdkanwil: string;
  nmkanwil: string;
  kdkppn: string;
  nmkabkota_kppn: string;
  nmprogram: string;
  jenjang: string;
  status_sekolah: string;
  jenis_bos: string;
  kdlokasi_kedudukan: string;
  nmkabkota_sekolah: string;
  Januari?: number;
  Februari?: number;
  Maret?: number;
  April?: number;
  Mei?: number;
  Juni?: number;
  Juli?: number;
  Agustus?: number;
  September?: number;
  Oktober?: number;
  November?: number;
  Desember?: number;
  total_nilai?: number;
  total_siswa?: number;
  [key: string]: any;
}

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
