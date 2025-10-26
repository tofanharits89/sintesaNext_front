export interface QuickStatsData {
  jumlahDipa?: number;
  paguApbn?: number;
  paguDipa?: number;
  realisasi?: number;
  blokir?: number;
  sisaPaguDipa?: number;
  _meta?: {
    asOfJakarta?: string;
  };
}

export interface RealisasiJenisBelanjaData {
  categories: string[];
  series: Array<{
    name: string;
    data: number[];
  }>;
}

export interface KLPaguData {
  nama_kementerian?: string;
  nama_program?: string;
  pagu_dipa: number;
  realisasi: number;
}

export interface PersentaseKLData {
  kode_ba: string;
  nama_ba: string;
  persentase: number;
}

export interface ChartDataPoint {
  name: string;
  [key: string]: any;
}
