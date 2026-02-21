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
  provinceName?: string
): Promise<MapStats | null> {
  const params = new URLSearchParams();
  params.set("scope", scope);
  if (provinceName) {
    params.set("provinceName", provinceName);
  }

  const response = await apiClient.get<MbgMapStatsApiResponse>(
    `/dashboard/mbg/map-stats?${params.toString()}`
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

export async function getQuickStats(): Promise<QuickStatView[]> {
  const response = await apiClient.get<MbgQuickStatsApiResponse>("/dashboard/mbg/quick-stats");

  if (!response?.success || !response.data) {
    throw new Error("Failed to fetch MBG quick stats");
  }

  const stats = response.data;

  return [
    { label: "Total SPPG Aktif", value: formatCount(stats.jumlahsppg), variant: "neutral" },
    { label: "Petugas SPPG", value: formatCount(stats.jumlahpetugas), variant: "neutral" },
    { label: "Supplier MBG", value: formatCount(stats.jumlahsupplier), variant: "neutral" },
    { label: "Kelompok Manfaat", value: formatCount(stats.jumlahkelompok), variant: "neutral" },
    { label: "Penerima Manfaat", value: formatCount(stats.jumlahpenerima), variant: "neutral" },
    { label: "Total Mitra", value: formatCount(stats.jumlahmitra), variant: "neutral" },
  ];
}

export type RankingsData = {
  items: {
    name: string;
    value: number;
    percentage: number;
  }[];
};

export async function getRankings(): Promise<RankingsData> {
  const response = await apiClient.get<{
    success: boolean;
    data?: Array<{
      nama_provinsi: string;
      penerima_manfaat: number;
      persen_penerima: number;
    }>;
  }>("/dashboard/mbg/penerima-rankings");

  if (!response?.success || !response.data) {
    throw new Error("Failed to fetch MBG penerima rankings");
  }

  return {
    items: response.data.map((row) => ({
      name: row.nama_provinsi,
      value: Number(row.penerima_manfaat) || 0,
      percentage: Number(row.persen_penerima) || 0,
    })),
  };
}

export async function getChartsReady(): Promise<boolean> {
  // Simulate 3s latency to match current UX
  await new Promise((r) => setTimeout(r, 3000));
  return true;
}
