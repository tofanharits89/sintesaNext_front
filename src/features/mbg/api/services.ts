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

export async function getQuickStats(year: string = "2026"): Promise<QuickStatView[]> {
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

export async function getRankings(year: string = "2026"): Promise<RankingsData> {
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

export async function getMapChoropleth(year: string = "2026"): Promise<MbgProvChoroplethRow[]> {
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

export async function getProvRankings(year: string = "2026"): Promise<ProvRankingsData> {
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
