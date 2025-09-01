export type MapScope = "national" | "province" | "regency";

export type QuickStat = {
  label: string;
  value: number | string;
  trendPct?: number;
  variant?: "up" | "down" | "neutral";
};

export type RankingItem = {
  name: string;
  value: number;
};

export type MapStats = {
  totalAllocation: number;
  totalRealization: number;
  beneficiaries: number;
  coveragePct: number; // percentage (0..100)
};
