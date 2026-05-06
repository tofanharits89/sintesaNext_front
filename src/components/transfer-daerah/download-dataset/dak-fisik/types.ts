export interface SelectOption {
  label: string;
  value: string;
}

export interface DakFisikData {
  thang: string;
  kdlokasi: string;
  pemda: string;
  kdkanwil: string;
  kdkppn: string;
  nmkppn: string;
  kdakun: string;
  jenis_dana: string;
  kdbidang: string;
  nmbidang: string;
  kdsubidang: string;
  nmsubidang: string;
  pagu: number;
  total_penyaluran: number;
  sisa_pagu: number;
  prosentase: number;
  Jan: number;
  Feb: number;
  Mar: number;
  Apr: number;
  Mei: number;
  Jun: number;
  Jul: number;
  Ags: number;
  Sep: number;
  Okt: number;
  Nov: number;
  Des: number;
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
