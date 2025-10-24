export interface RekapEpaRow {
  no: number;
  thang: number;
  triwulan: number;
  kddept: string;
  nmdept: string;
  kdgbkpk: string;
  nmgbkpk: string;
  pagu: number;
  realisasi: number;
  persen_realisasi: number;
  sisa_pagu: number;
  blokir: number;
  sisa_pagu_efektif: number;
  pagu_kontrak: number;
  realisasi_kontrak: number;
  outstanding_kontrak: number;
  sisa_kontrak_pagu_bersih: number;
  rencana_sisa_realisasi: number;
}

export interface RekapEpaGrandTotal {
  pagu: number;
  realisasi: number;
  sisa_pagu: number;
  blokir: number;
  sisa_pagu_efektif: number;
  pagu_kontrak: number;
  realisasi_kontrak: number;
  outstanding_kontrak: number;
  sisa_kontrak_pagu_bersih: number;
  rencana_sisa_realisasi: number;
}

export interface RekapEpaResponse {
  data: RekapEpaRow[];
  total: number;
  grandTotal: RekapEpaGrandTotal;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RekapEpaFilterOptions {
  tahunList: number[];
  triwulanList: number[];
  kementerianList: Array<{ kddept: string; nmdept: string }>;
  jenisBelanjList: Array<{ kdgbkpk: string; nmgbkpk: string }>;
}

export interface RekapEpaFilters {
  tahun: string | null;
  triwulan: string | null;
  kddept: string | null;
  kdgbkpk: string | null;
}
