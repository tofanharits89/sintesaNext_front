import { apiClient } from "@/lib/api/httpClient";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QuickStatView = {
  label: string;
  value: string;
  icon: string; // lucide icon name identifier
  variant?: "up" | "down" | "neutral";
};

export type RankedKppnItem = {
  name: string;
  value: number;
  percentage: number;
};

export type KppnRankingsData = {
  transaksi: RankedKppnItem[];
  tagihan: RankedKppnItem[];
  kartu: RankedKppnItem[];
};

export type BankDistItem = {
  bank: string;
  count: number;
  percentage: number;
};

export type TransaksiKLItem = {
  kddept: string;
  nmdept: string;
  totalTransaksi: number;
};

export type TransaksiSatkerItem = {
  kdsatker: string;
  nmsatker: string;
  totalTransaksi: number;
};

export type KendalaItem = {
  kategori: string;
  count: number;
  percentage: number;
};

export type WordCloudItem = {
  text: string;
  value: number;
};

export type KkpDashboardData = {
  quickStats: QuickStatView[];
  kppnRankings: KppnRankingsData;
  bankDistribution: BankDistItem[];
  transaksiPerKL: TransaksiKLItem[];
  transaksiPerSatker: TransaksiSatkerItem[];
  kendalaStats: KendalaItem[];
  detilKendalaWords: WordCloudItem[];
  nmlokasi?: string | null;
  _meta?: {
    asOfJakarta?: string;
  };
};

export type SankeyFlowItem = {
  jns_kkp_prinsipal: string;
  kdakun: string;
  nmakun: string;
  jml_transaksi: number;
  total_nilai: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCount(value: number): string {
  return (value || 0).toLocaleString("id-ID");
}

function formatRupiah(value: number): string {
  const v = value || 0;
  if (Math.abs(v) >= 1e12) return `Rp ${(v / 1e12).toFixed(2)} T`;
  if (Math.abs(v) >= 1e9) return `Rp ${(v / 1e9).toFixed(1)} M`;
  if (Math.abs(v) >= 1e6) return `Rp ${(v / 1e6).toFixed(0)} Jt`;
  
  // Custom format to ensure "Rp " with space
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
  
  return `Rp ${formatted}`;
}

// ---------------------------------------------------------------------------
// Main fetch (backend-aggregated)
// ---------------------------------------------------------------------------

export async function getKkpDashboardData(
  year: string = "2026",
  triwulan: string = "1",
  kdkanwil?: string,
  kdkppn?: string
): Promise<KkpDashboardData> {
  let url = `/monev-kkp/dashboard?tahun=${year}&triwulan=${triwulan}`;
  if (kdkanwil) url += `&kdkanwil=${kdkanwil}`;
  if (kdkppn) url += `&kdkppn=${kdkppn}`;

  const response = await apiClient.get<{
    success: boolean;
    data?: any;
  }>(url, {
    timeout: 300000, // 5 minutes
  });

  if (!response?.success || !response.data) {
    throw new Error("Failed to fetch KKP dashboard data");
  }

  const raw = response.data;
  const { quickStats: s } = raw;

  const quickStats: QuickStatView[] = [
    {
      label: "Total Satker KKP",
      value: formatCount(s.totalSatker),
      icon: "Building2",
      variant: "neutral",
    },
    {
      label: "Total Kartu KKP",
      value: formatCount(s.totalKartu),
      icon: "CreditCard",
      variant: "neutral",
    },
    {
      label: "Total Nilai UP KKP",
      value: formatRupiah(s.totalUpKkp),
      icon: "Banknote",
      variant: "neutral",
    },
    {
      label: "Total Nilai Tagihan",
      value: formatRupiah(s.totalTagihan),
      icon: "Receipt",
      variant: "neutral",
    },
    {
      label: "Total Transaksi SP2D",
      value: formatRupiah(s.totalTransaksi),
      icon: "TrendingUp",
      variant: "neutral",
    },
    {
      label: "Satker Belum Transaksi",
      value: formatCount(s.satkerBelumTransaksi),
      icon: "AlertTriangle",
      variant: s.satkerBelumTransaksi > 0 ? "down" : "up",
    },
  ];

  return {
    ...raw,
    quickStats,
    kendalaStats: (raw.kendalaStats || []).map((k: any) => ({
      kategori: k.kategori,
      count: k.count,
      percentage: k.percentage,
    })),
    _meta: {
      asOfJakarta: new Date().toISOString(),
    },
  };
}

// ---------------------------------------------------------------------------
// Sankey Data (jns_kkp_prinsipal → kode_akun flow)
// ---------------------------------------------------------------------------

export async function getKkpSankeyData(
  year: string = "2026",
  triwulan: string = "1",
  kdkanwil?: string,
  kdkppn?: string
): Promise<SankeyFlowItem[]> {
  let url = `/monev-kkp/sankey-data?tahun=${year}&triwulan=${triwulan}`;
  if (kdkanwil) url += `&kdkanwil=${kdkanwil}`;
  if (kdkppn) url += `&kdkppn=${kdkppn}`;

  const response = await apiClient.get<{
    success: boolean;
    data?: SankeyFlowItem[];
  }>(url, { timeout: 60000 });

  if (!response?.success || !response.data) {
    throw new Error("Failed to fetch KKP sankey data");
  }

  return response.data;
}

// ---------------------------------------------------------------------------
// Real-time Data for Reports
// ---------------------------------------------------------------------------

export async function getKkpKppnData(
  year: string = "2026",
  triwulan: string = "1",
  page: number = 1,
  limit: number = 25,
  kdkanwil?: string,
  kdkppn?: string
): Promise<{ data: any[]; total: number; totals: any }> {
  let url = `/monev-kkp/kppn?tahun=${year}&triwulan=${triwulan}&page=${page}&limit=${limit}`;
  if (kdkanwil) url += `&kdkanwil=${kdkanwil}`;
  if (kdkppn) url += `&kdkppn=${kdkppn}`;

  const response = await apiClient.get<{
    success: boolean;
    data?: any[];
    total?: number;
    totals?: any;
  }>(url, { timeout: 60000 });

  if (!response?.success || !response.data) {
    throw new Error("Failed to fetch KKP report data");
  }

  return {
    data: response.data,
    total: response.total || 0,
    totals: response.totals || {},
  };
}

export async function getKkpDataTransaksi(
  year: string = "2026",
  page: number = 1,
  limit: number = 10,
  search: string = "",
  kdkanwil?: string,
  kdkppn?: string
): Promise<{ data: any[]; total: number }> {
  let url = `/monev-kkp/data-transaksi?tahun=${year}&page=${page}&limit=${limit}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (kdkanwil) url += `&kdkanwil=${kdkanwil}`;
  if (kdkppn) url += `&kdkppn=${kdkppn}`;

  const response = await apiClient.get<{
    success: boolean;
    data?: any[];
    total?: number;
  }>(url);

  if (!response?.success || !response.data) {
    throw new Error("Failed to fetch transaction data");
  }

  return {
    data: response.data,
    total: response.total || 0,
  };
}
