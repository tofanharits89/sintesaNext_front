export type MapScope = "national" | "province" | "regency";

export type MbgIndicatorKey =
  | "jumlahsppg"
  | "jumlahpetugas"
  | "jumlahsupplier"
  | "jumlahkelompok"
  | "jumlahpenerima"
  | "jumlahmitra";

export const MBG_INDICATOR_OPTIONS: { value: MbgIndicatorKey; label: string }[] = [
  { value: "jumlahsppg", label: "Total SPPG Aktif" },
  { value: "jumlahpetugas", label: "Petugas SPPG" },
  { value: "jumlahsupplier", label: "Supplier MBG" },
  { value: "jumlahkelompok", label: "Kelompok Manfaat" },
  { value: "jumlahpenerima", label: "Penerima Manfaat" },
  { value: "jumlahmitra", label: "Total Mitra" },
];

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
  jumlahsppg: number;
  jumlahpetugas: number;
  jumlahsupplier: number;
  jumlahkelompok: number;
  jumlahpenerima: number;
  jumlahmitra: number;
  sourceProvinceName?: string | null;
};
