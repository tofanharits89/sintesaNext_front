import type { MapStats } from "@/features/mbg/types/domain";

export async function getMapStats(
  scope: "national" | "province" | "regency",
  id?: string
): Promise<MapStats> {
  // TODO: Replace with real API call
  // Simulate network latency and return deterministic sample data by scope/id
  await new Promise((r) => setTimeout(r, 300));

  if (scope === "national") {
    return {
      totalAllocation: 3_000_000_000_000,
      totalRealization: 2_100_000_000_000,
      beneficiaries: 12_500_120,
      coveragePct: 75.1,
    };
  }
  if (scope === "province") {
    return {
      totalAllocation: 120_000_000_000,
      totalRealization: 98_000_000_000,
      beneficiaries: 245_012,
      coveragePct: 78.4,
    };
  }
  // regency
  return {
    totalAllocation: 25_000_000_000,
    totalRealization: 18_000_000_000,
    beneficiaries: 12_045,
    coveragePct: 74.2,
  };
}

export type QuickStatView = {
  label: string;
  value: string | number;
  trend?: string;
  variant?: "up" | "down" | "neutral";
};

export async function getQuickStats(): Promise<QuickStatView[]> {
  // Simulate 1.5s latency to match current UX
  await new Promise((r) => setTimeout(r, 1500));
  return [
    { label: "Total Alokasi", value: "Rp 1.250 M", trend: "+5.2%", variant: "up" },
    { label: "Total Realisasi", value: "Rp 980 M", trend: "+3.1%", variant: "up" },
    { label: "Serapan (%)", value: "78,4%", trend: "+1,0%", variant: "up" },
    { label: "Penerima Manfaat", value: "2.450.120", trend: "-0,3%", variant: "down" },
    { label: "Kab/Kota Aktif", value: "415", trend: "+2", variant: "neutral" },
  ];
}

export type RankingsData = {
  top5: { name: string; value: number }[];
  bottom5: { name: string; value: number }[];
};

export async function getRankings(): Promise<RankingsData> {
  // Simulate 2.5s latency to match current UX
  await new Promise((r) => setTimeout(r, 2500));
  return {
    top5: [
      { name: "DKI Jakarta", value: 125_000 },
      { name: "Jawa Barat", value: 112_000 },
      { name: "Jawa Timur", value: 97_500 },
      { name: "Sumatera Utara", value: 84_200 },
      { name: "Riau", value: 70_900 },
    ],
    bottom5: [
      { name: "Maluku Utara", value: 12_300 },
      { name: "Gorontalo", value: 13_100 },
      { name: "Sulawesi Barat", value: 14_900 },
      { name: "Papua Barat Daya", value: 15_200 },
      { name: "Papua Pegunungan", value: 16_500 },
    ],
  };
}

export async function getChartsReady(): Promise<boolean> {
  // Simulate 3s latency to match current UX
  await new Promise((r) => setTimeout(r, 3000));
  return true;
}
