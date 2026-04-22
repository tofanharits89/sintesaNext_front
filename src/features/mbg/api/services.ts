import type { MapStats } from "@/features/mbg/types/domain";
import { apiClient } from "@/lib/api/httpClient";

type MbgMapStatsApiResponse = {
  success: boolean;
  data?: {
    scope: "national" | "province" | "regency";
    provinceName?: string | null;
    stats: MapStats | null;
  };
};

export async function getMapStats(
  scope: "national" | "province" | "regency",
  id?: string,
  provinceName?: string,
  year: string = "2026",
): Promise<MapStats | null> {
  const params = new URLSearchParams();
  params.set("scope", scope);
  params.set("year", year);
  if (provinceName) {
    params.set("provinceName", provinceName);
  }

  const response = await apiClient.get<MbgMapStatsApiResponse>(
    `/dashboard/mbg/map-stats?${params.toString()}`,
  );

  if (!response?.success || !response.data) {
    throw new Error("Failed to fetch MBG map stats");
  }

  return response.data.stats;
}

export type QuickStatView = {
  label: string;
  value: string | number;
  trend?: string;
  variant?: "up" | "down" | "neutral";
};

type MbgQuickStatsApiData = {
  jumlahsppg: number;
  jumlahpetugas: number;
  jumlahsupplier: number;
  jumlahkelompok: number;
  jumlahpenerima: number;
  jumlahmitra: number;
};

type MbgQuickStatsApiResponse = {
  success: boolean;
  data?: MbgQuickStatsApiData;
};

function formatCount(value: number): string {
  return value.toLocaleString("id-ID");
}

export async function getQuickStats(
  year: string = "2026",
): Promise<QuickStatView[]> {
  const params = new URLSearchParams({ year });
  const response = await apiClient.get<MbgQuickStatsApiResponse>(
    `/dashboard/mbg/quick-stats?${params.toString()}`,
  );

  if (!response?.success || !response.data) {
    throw new Error("Failed to fetch MBG quick stats");
  }

  const stats = response.data;

  return [
    {
      label: "Total SPPG Aktif",
      value: formatCount(stats.jumlahsppg),
      variant: "neutral",
    },
    {
      label: "Petugas SPPG",
      value: formatCount(stats.jumlahpetugas),
      variant: "neutral",
    },
    {
      label: "Supplier MBG",
      value: formatCount(stats.jumlahsupplier),
      variant: "neutral",
    },
    {
      label: "Kelompok Manfaat",
      value: formatCount(stats.jumlahkelompok),
      variant: "neutral",
    },
    {
      label: "Penerima Manfaat",
      value: formatCount(stats.jumlahpenerima),
      variant: "neutral",
    },
    {
      label: "Total Mitra",
      value: formatCount(stats.jumlahmitra),
      variant: "neutral",
    },
  ];
}

export type RankingsData = {
  items: {
    name: string;
    value: number;
    percentage: number;
  }[];
};

export async function getRankings(
  year: string = "2026",
): Promise<RankingsData> {
  const params = new URLSearchParams({ year });
  const response = await apiClient.get<{
    success: boolean;
    data?: Array<{
      nama_provinsi: string;
      penerima_manfaat: number;
      persen_penerima: number;
    }>;
  }>(`/dashboard/mbg/penerima-rankings?${params.toString()}`);

  if (!response?.success || !response.data) {
    throw new Error("Failed to fetch MBG object rankings");
  }

  return {
    items: response.data.map((row) => ({
      name: row.nama_provinsi,
      value: Number(row.penerima_manfaat) || 0,
      percentage: Number(row.persen_penerima) || 0,
    })),
  };
}

export type MbgProvChoroplethRow = {
  wilkode: string;
  nama_provinsi: string;
  jumlahsppg: number;
  jumlahpetugas: number;
  jumlahsupplier: number;
  jumlahkelompok: number;
  jumlahpenerima: number;
  jumlahmitra: number;
};

export async function getMapChoropleth(
  year: string = "2026",
): Promise<MbgProvChoroplethRow[]> {
  const params = new URLSearchParams({ year });
  const response = await apiClient.get<{
    success: boolean;
    data?: MbgProvChoroplethRow[];
  }>(`/dashboard/mbg/map-choropleth?${params.toString()}`);
  if (!response?.success || !response.data) {
    throw new Error("Failed to fetch MBG map choropleth");
  }
  return response.data;
}

export type PenerimaKabItem = {
  provinsi: string;
  kabkota: string;
  penerimakab: number;
  persen_penerimakab: number;
};

export async function getPenerimaByRegency(
  prov: string,
  year: string = "2026",
): Promise<PenerimaKabItem[]> {
  const params = new URLSearchParams({ prov, year });
  const response = await apiClient.get<{
    success: boolean;
    data?: PenerimaKabItem[];
  }>(`/dashboard/mbg/penerima-by-regency?${params.toString()}`);
  if (!response?.success || !response.data) return [];
  return response.data;
}

export type RankedItem = { name: string; value: number; percentage: number };

export type ProvRankingsData = {
  penerima: RankedItem[];
  sppg: RankedItem[];
  petugas: RankedItem[];
};

export async function getProvRankings(
  year: string = "2026",
): Promise<ProvRankingsData> {
  const params = new URLSearchParams({ year });
  const response = await apiClient.get<{
    success: boolean;
    data?: ProvRankingsData;
  }>(`/dashboard/mbg/province-rankings?${params.toString()}`);
  if (!response?.success || !response.data) {
    throw new Error("Failed to fetch MBG province rankings");
  }
  return response.data;
}

export type BgnMonthlyPoint = {
  month: string;
  realisasi2025: number | null;
  realisasi2026: number | null;
};

export type RealisasiBgnData = {
  pagu2025: number;
  pagu2026: number;
  months: BgnMonthlyPoint[];
};

export async function getRealisasiBgn(): Promise<RealisasiBgnData> {
  const response = await apiClient.get<{
    success: boolean;
    data?: RealisasiBgnData;
  }>("/dashboard/mbg/realisasi-bgn");
  if (!response?.success || !response.data) {
    throw new Error("Failed to fetch BGN realisasi data");
  }
  return response.data;
}

export type SebaranProvItem = {
  nama_provinsi: string;
  penerima2025: number;
  penerima2026: number;
  persen2025: number;
  persen2026: number;
};

export type SebaranPenerimaData = {
  items: SebaranProvItem[];
};

export async function getSebaranPenerima(): Promise<SebaranPenerimaData> {
  const response = await apiClient.get<{
    success: boolean;
    data?: SebaranPenerimaData;
  }>("/dashboard/mbg/sebaran-penerima");
  if (!response?.success || !response.data) {
    throw new Error("Failed to fetch MBG sebaran penerima data");
  }
  return response.data;
}

export type EfektivitasYearItem = {
  tahun: string;
  nmdept: string;
  nmprogram: string;
  penerima_manfaat: number;
  rata_realisasi_per_bulan: number;
  persentase_efektivitas: number;
};

export type EfektivitasProgramData = {
  items: EfektivitasYearItem[];
};

export async function getEfektivitasProgram(): Promise<EfektivitasProgramData> {
  const response = await apiClient.get<{
    success: boolean;
    data?: EfektivitasProgramData;
  }>("/dashboard/mbg/efektivitas-program");
  if (!response?.success || !response.data) {
    throw new Error("Failed to fetch MBG efektivitas program data");
  }
  return response.data;
}

export async function getChartsReady(): Promise<boolean> {
  // Simulate 3s latency to match current UX
  await new Promise((r) => setTimeout(r, 3000));
  return true;
}

// ---------------------------------------------------------------------------
// Lokus MBG Rekap – SpasialLineChart
// ---------------------------------------------------------------------------

export type LokusRow = {
  thang: string;
  prov: string;
  kdkabkota: string;
  nmkabkota: string;
  kdkanwil: string | null;
  Januari: number | null;
  Februari: number | null;
  Maret: number | null;
  April: number | null;
  Mei: number | null;
  Juni: number | null;
  Juli: number | null;
  Agustus: number | null;
  September: number | null;
  Oktober: number | null;
  November: number | null;
  Desember: number | null;
};

export type LokusProvinsiData = { provinsi: string[] };
export type LokusDataResponse = { rows: LokusRow[] };

export async function getLokusProvinsi(
  kdkanwil?: string,
): Promise<LokusProvinsiData> {
  const params = new URLSearchParams();
  if (kdkanwil) params.set("kdkanwil", kdkanwil);
  const qs = params.toString();
  const response = await apiClient.get<{
    success: boolean;
    data?: LokusProvinsiData;
  }>(`/dashboard/mbg/lokus-provinsi${qs ? `?${qs}` : ""}`);
  if (!response?.success || !response.data) {
    throw new Error("Failed to fetch lokus provinsi");
  }
  return response.data;
}

export async function getLokusData(
  prov: string[],
  tahun: string,
  kdkanwil?: string,
): Promise<LokusDataResponse> {
  const params = new URLSearchParams({ tahun });
  if (prov.length > 0) params.set("prov", prov.join(","));
  if (kdkanwil) params.set("kdkanwil", kdkanwil);
  const response = await apiClient.get<{
    success: boolean;
    data?: LokusDataResponse;
  }>(`/dashboard/mbg/lokus-data?${params.toString()}`);
  if (!response?.success || !response.data) {
    throw new Error("Failed to fetch lokus data");
  }
  return response.data;
}

export async function getLokusExport(): Promise<LokusDataResponse> {
  const response = await apiClient.get<{
    success: boolean;
    data?: LokusDataResponse;
  }>(`/dashboard/mbg/lokus-export`);
  if (!response?.success || !response.data) {
    throw new Error("Failed to fetch lokus export data");
  }
  return response.data;
}

// ---------------------------------------------------------------------------
// OWID – NTP/NTN
// ---------------------------------------------------------------------------

export type NtpRow = {
  provinsi: string;
  kategori: string;
  jan: number | null;
  feb: number | null;
  mar: number | null;
  apr: number | null;
  mei: number | null;
  jun: number | null;
  jul: number | null;
  aug: number | null;
  sep: number | null;
  okt: number | null;
  nov: number | null;
  des: number | null;
  tahun: string;
  kode_kanwil: string | null;
};

export type NtpKategoriData = { kategori: string[] };
export type NtpProvinsiData = { provinsi: string[] };
export type NtpDataResponse = { rows: NtpRow[] };

export async function getNtpKategori(tahun: string): Promise<NtpKategoriData> {
  const response = await apiClient.get<{
    success: boolean;
    data?: NtpKategoriData;
  }>(`/dashboard/owid/ntp-kategori?tahun=${tahun}`);
  if (!response?.success || !response.data)
    throw new Error("Failed to fetch NTP kategori");
  return response.data;
}

export async function getNtpProvinsi(
  tahun: string,
  kdkanwil?: string,
): Promise<NtpProvinsiData> {
  const params = new URLSearchParams({ tahun });
  if (kdkanwil) params.set("kdkanwil", kdkanwil);
  const response = await apiClient.get<{
    success: boolean;
    data?: NtpProvinsiData;
  }>(`/dashboard/owid/ntp-provinsi?${params.toString()}`);
  if (!response?.success || !response.data)
    throw new Error("Failed to fetch NTP provinsi");
  return response.data;
}

export async function getNtpData(
  provinsi: string[],
  kategori: string,
  tahun: string,
  kdkanwil?: string,
): Promise<NtpDataResponse> {
  const params = new URLSearchParams({ tahun, kategori });
  if (provinsi.length > 0) params.set("provinsi", provinsi.join(","));
  if (kdkanwil) params.set("kdkanwil", kdkanwil);
  const response = await apiClient.get<{
    success: boolean;
    data?: NtpDataResponse;
  }>(`/dashboard/owid/ntp-data?${params.toString()}`);
  if (!response?.success || !response.data)
    throw new Error("Failed to fetch NTP data");
  return response.data;
}

export async function getNtpExport(): Promise<NtpDataResponse> {
  const response = await apiClient.get<{
    success: boolean;
    data?: NtpDataResponse;
  }>(`/dashboard/owid/ntp-export`);
  if (!response?.success || !response.data)
    throw new Error("Failed to fetch NTP export");
  return response.data;
}

// ---------------------------------------------------------------------------
// OWID – PDRB
// ---------------------------------------------------------------------------

export type PdrbRow = {
  provinsi: string;
  kategori: string;
  tw1: number | null;
  tw2: number | null;
  tw3: number | null;
  tw4: number | null;
  tahun: string;
  kode_kanwil: string | null;
};

export type PdrbKategoriData = { kategori: string[] };
export type PdrbProvinsiData = { provinsi: string[] };
export type PdrbDataResponse = { rows: PdrbRow[] };

export async function getPdrbKategori(
  tahun: string,
): Promise<PdrbKategoriData> {
  const response = await apiClient.get<{
    success: boolean;
    data?: PdrbKategoriData;
  }>(`/dashboard/owid/pdrb-kategori?tahun=${tahun}`);
  if (!response?.success || !response.data)
    throw new Error("Failed to fetch PDRB kategori");
  return response.data;
}

export async function getPdrbProvinsi(
  tahun: string,
  kdkanwil?: string,
): Promise<PdrbProvinsiData> {
  const params = new URLSearchParams({ tahun });
  if (kdkanwil) params.set("kdkanwil", kdkanwil);
  const response = await apiClient.get<{
    success: boolean;
    data?: PdrbProvinsiData;
  }>(`/dashboard/owid/pdrb-provinsi?${params.toString()}`);
  if (!response?.success || !response.data)
    throw new Error("Failed to fetch PDRB provinsi");
  return response.data;
}

export async function getPdrbData(
  provinsi: string[],
  kategori: string,
  tahun: string,
  kdkanwil?: string,
): Promise<PdrbDataResponse> {
  const params = new URLSearchParams({ tahun, kategori });
  if (provinsi.length > 0) params.set("provinsi", provinsi.join(","));
  if (kdkanwil) params.set("kdkanwil", kdkanwil);
  const response = await apiClient.get<{
    success: boolean;
    data?: PdrbDataResponse;
  }>(`/dashboard/owid/pdrb-data?${params.toString()}`);
  if (!response?.success || !response.data)
    throw new Error("Failed to fetch PDRB data");
  return response.data;
}

export async function getPdrbExport(): Promise<PdrbDataResponse> {
  const response = await apiClient.get<{
    success: boolean;
    data?: PdrbDataResponse;
  }>(`/dashboard/owid/pdrb-export`);
  if (!response?.success || !response.data)
    throw new Error("Failed to fetch PDRB export");
  return response.data;
}

// ---------------------------------------------------------------------------
// OWID – Komoditas
// ---------------------------------------------------------------------------

export type KomoditasRow = {
  Provinsi: string;
  Kategori: string;
  Jan: number | null;
  Feb: number | null;
  Mar: number | null;
  Apr: number | null;
  Mei: number | null;
  Jun: number | null;
  Jul: number | null;
  Agt: number | null;
  Sep: number | null;
  Okt: number | null;
  Nov: number | null;
  Des: number | null;
  tahun: string;
  kode_kanwil: string | null;
};

export type KomoditasKategoriData = { kategori: string[] };
export type KomoditasProvinsiData = { provinsi: string[] };
export type KomoditasDataResponse = { rows: KomoditasRow[] };

export async function getKomoditasKategori(
  tahun: string,
): Promise<KomoditasKategoriData> {
  const response = await apiClient.get<{
    success: boolean;
    data?: KomoditasKategoriData;
  }>(`/dashboard/owid/komoditas-kategori?tahun=${tahun}`);
  if (!response?.success || !response.data)
    throw new Error("Failed to fetch Komoditas kategori");
  return response.data;
}

export async function getKomoditasProvinsi(
  tahun: string,
  kdkanwil?: string,
): Promise<KomoditasProvinsiData> {
  const params = new URLSearchParams({ tahun });
  if (kdkanwil) params.set("kdkanwil", kdkanwil);
  const response = await apiClient.get<{
    success: boolean;
    data?: KomoditasProvinsiData;
  }>(`/dashboard/owid/komoditas-provinsi?${params.toString()}`);
  if (!response?.success || !response.data)
    throw new Error("Failed to fetch Komoditas provinsi");
  return response.data;
}

export async function getKomoditasData(
  provinsi: string[],
  kategori: string,
  tahun: string,
  kdkanwil?: string,
): Promise<KomoditasDataResponse> {
  const params = new URLSearchParams({ tahun, kategori });
  if (provinsi.length > 0) params.set("provinsi", provinsi.join(","));
  if (kdkanwil) params.set("kdkanwil", kdkanwil);
  const response = await apiClient.get<{
    success: boolean;
    data?: KomoditasDataResponse;
  }>(`/dashboard/owid/komoditas-data?${params.toString()}`);
  if (!response?.success || !response.data)
    throw new Error("Failed to fetch Komoditas data");
  return response.data;
}

export async function getKomoditasExport(): Promise<KomoditasDataResponse> {
  const response = await apiClient.get<{
    success: boolean;
    data?: KomoditasDataResponse;
  }>(`/dashboard/owid/komoditas-export`);
  if (!response?.success || !response.data)
    throw new Error("Failed to fetch Komoditas export");
  return response.data;
}

// ---------------------------------------------------------------------------
// MBG – Petugas
// ---------------------------------------------------------------------------

export type PetugasRow = {
  tipe_petugas: string;
  jumlah: number;
};

export type PetugasProvinsiData = { provinsi: string[] };
export type PetugasDataResponse = { rows: PetugasRow[] };

export async function getPetugasProvinsi(
  kdkanwil?: string,
): Promise<PetugasProvinsiData> {
  const params = new URLSearchParams();
  if (kdkanwil) params.set("kdkanwil", kdkanwil);
  const qs = params.toString();
  const response = await apiClient.get<{
    success: boolean;
    data?: PetugasProvinsiData;
  }>(`/dashboard/mbg/petugas-provinsi${qs ? `?${qs}` : ""}`);
  if (!response?.success || !response.data)
    throw new Error("Failed to fetch Petugas provinsi");
  return response.data;
}

export async function getPetugasData(
  provinsi: string,
  kdkanwil?: string,
): Promise<PetugasDataResponse> {
  const params = new URLSearchParams({ provinsi });
  if (kdkanwil) params.set("kdkanwil", kdkanwil);
  const response = await apiClient.get<{
    success: boolean;
    data?: PetugasDataResponse;
  }>(`/dashboard/mbg/petugas-data?${params.toString()}`);
  if (!response?.success || !response.data)
    throw new Error("Failed to fetch Petugas data");
  return response.data;
}

// ---------------------------------------------------------------------------
// MBG – SPPG
// ---------------------------------------------------------------------------

export type SppgRawRow = {
  nmprov: string;
  tgtarik: string;
  nilai: number;
};

export type SppgKanwilData = { kanwil: string[] };
export type SppgDataResponse = { rows: SppgRawRow[] };

export async function getSppgKanwil(
  kdkanwil?: string,
): Promise<SppgKanwilData> {
  const params = new URLSearchParams();
  if (kdkanwil) params.set("kdkanwil", kdkanwil);
  const qs = params.toString();
  const response = await apiClient.get<{
    success: boolean;
    data?: SppgKanwilData;
  }>(`/dashboard/mbg/sppg-kanwil${qs ? `?${qs}` : ""}`);
  if (!response?.success || !response.data)
    throw new Error("Failed to fetch SPPG kanwil");
  return response.data;
}

export async function getSppgData(
  kanwil: string[],
  kdkanwil?: string,
): Promise<SppgDataResponse> {
  const params = new URLSearchParams();
  if (kanwil.length > 0) params.set("kanwil", kanwil.join(","));
  if (kdkanwil) params.set("kdkanwil", kdkanwil);
  const response = await apiClient.get<{
    success: boolean;
    data?: SppgDataResponse;
  }>(`/dashboard/mbg/sppg-data?${params.toString()}`);
  if (!response?.success || !response.data)
    throw new Error("Failed to fetch SPPG data");
  return response.data;
}
