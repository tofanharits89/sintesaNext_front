import { apiClient } from "@/lib/api/httpClient";
import kddeptData from "@/data/kddept.json";

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
};

export type SankeyFlowItem = {
  jns_kkp_prinsipal: string;
  kdakun: string;
  nmakun: string;
  jml_transaksi: number;
  total_nilai: number;
};

// Raw item from the backend
interface RawKkpRow {
  kddept: string;
  kdsatker: string;
  nmsatker: string;
  kdkppn: string;
  nmkppn: string;
  kdkanwil: string;
  nmlokasi: string;
  bank_penerbit: string;
  jumlah_kartu: number;
  jml_kartu_opr: number;
  limit_opr: number;
  jml_kartu_pd: number;
  limit_pd: number;
  nilai_up_kkp: number;
  porsi_up_kkp_dari_total_up: number;
  total_trans: number;
  nilai_gup_kkp: number;
  nilai_trans_sp2d: number;
  nilai_tagihan: number;
  kendala: string;
  detil_kendala: string;
  detil_masukan_kendala: string;
  nomor_pks?: string;
  tanggal_pks?: string;
  nomor_surat_up?: string;
  tanggal_surat_up?: string;
  tanggal_ctk_tagihan?: string;
  tanggal_jth_tempo?: string;
  nomor_sp2d_list?: string;
  tanggal_sp2d_list?: string;
  jenis_belanja_list?: string;
  jml_kartu_usul?: number | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCount(value: number): string {
  return value.toLocaleString("id-ID");
}

function formatRupiah(value: number): string {
  if (Math.abs(value) >= 1e12) return `Rp${(value / 1e12).toFixed(2)} T`;
  if (Math.abs(value) >= 1e9) return `Rp${(value / 1e9).toFixed(1)} M`;
  if (Math.abs(value) >= 1e6) return `Rp${(value / 1e6).toFixed(0)} jt`;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ---------------------------------------------------------------------------
// Main fetch + client-side aggregation
// ---------------------------------------------------------------------------

export async function getKkpDashboardData(
  year: string = "2026",
  triwulan: string = "1",
  kdkanwil?: string,
  kdkppn?: string
): Promise<KkpDashboardData> {
  let url = `/monev-kkp/kppn?tahun=${year}&triwulan=${triwulan}`;
  if (kdkanwil) url += `&kdkanwil=${kdkanwil}`;
  if (kdkppn) url += `&kdkppn=${kdkppn}`;

  const MAX_RETRIES = 2;
  let lastError: any = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data?: RawKkpRow[];
      }>(url, {
        // Increase timeout specifically for this potentially large request
        timeout: 300000, // 5 minutes
      });

      if (!response?.success || !response.data) {
        throw new Error("Failed to fetch KKP dashboard data");
      }

      const rows = response.data;
      return aggregateDashboardData(rows);
    } catch (error: any) {
      lastError = error;
      const errorMessage = (error?.message || "").toLowerCase();
      const isNetworkError = 
        errorMessage.includes("econnreset") || 
        errorMessage.includes("network error") ||
        errorMessage.includes("timeout");

      if (!isNetworkError || attempt === MAX_RETRIES) {
        break;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      console.warn(`Retrying KKP dashboard fetch (attempt ${attempt + 1}/${MAX_RETRIES})...`);
    }
  }

  throw lastError || new Error("Failed to fetch KKP dashboard data after retries");
}

/**
 * Extracted aggregation logic for clarity and maintainability
 */
function aggregateDashboardData(rows: RawKkpRow[]): KkpDashboardData {
  // ── Quick Stats ──────────────────────────────────────────
  const totalSatker = rows.length;
  const totalKartu = rows.reduce((s, r) => s + Number(r.jumlah_kartu || 0), 0);
  const totalUpKkp = rows.reduce((s, r) => s + Number(r.nilai_up_kkp || 0), 0);
  const totalTagihan = rows.reduce(
    (s, r) => s + Number(r.nilai_tagihan || 0),
    0,
  );
  const totalTransaksi = rows.reduce(
    (s, r) => s + Number(r.nilai_trans_sp2d || 0),
    0,
  );
  const satkerBelumTransaksi = rows.filter(
    (r) => Number(r.nilai_trans_sp2d || 0) === 0,
  ).length;

  const quickStats: QuickStatView[] = [
    {
      label: "Total Satker KKP",
      value: formatCount(totalSatker),
      icon: "Building2",
      variant: "neutral",
    },
    {
      label: "Total Kartu KKP",
      value: formatCount(totalKartu),
      icon: "CreditCard",
      variant: "neutral",
    },
    {
      label: "Total Nilai UP KKP",
      value: formatRupiah(totalUpKkp),
      icon: "Banknote",
      variant: "neutral",
    },
    {
      label: "Total Nilai Tagihan",
      value: formatRupiah(totalTagihan),
      icon: "Receipt",
      variant: "neutral",
    },
    {
      label: "Total Transaksi SP2D",
      value: formatRupiah(totalTransaksi),
      icon: "TrendingUp",
      variant: "neutral",
    },
    {
      label: "Satker Belum Transaksi",
      value: formatCount(satkerBelumTransaksi),
      icon: "AlertTriangle",
      variant: satkerBelumTransaksi > 0 ? "down" : "up",
    },
  ];

  // ── KPPN Rankings ────────────────────────────────────────
  const kppnMap = new Map<
    string,
    { nmkppn: string; transaksi: number; tagihan: number; kartu: number }
  >();

  for (const r of rows) {
    const key = (r.kdkppn || "").trim();
    if (!key) continue;
    const existing = kppnMap.get(key) || {
      nmkppn: r.nmkppn || key,
      transaksi: 0,
      tagihan: 0,
      kartu: 0,
    };
    existing.transaksi += Number(r.nilai_trans_sp2d || 0);
    existing.tagihan += Number(r.nilai_tagihan || 0);
    existing.kartu += Number(r.jumlah_kartu || 0);
    kppnMap.set(key, existing);
  }

  const toRanked = (
    extractor: (v: { transaksi: number; tagihan: number; kartu: number }) => number,
  ): RankedKppnItem[] => {
    const entries = [...kppnMap.entries()].map(([, v]) => ({
      name: v.nmkppn,
      value: extractor(v),
    }));
    const total = entries.reduce((s, e) => s + e.value, 0);
    return entries
      .sort((a, b) => b.value - a.value)
      .map((e) => ({
        ...e,
        percentage: total > 0 ? (e.value / total) * 100 : 0,
      }));
  };

  const kppnRankings: KppnRankingsData = {
    transaksi: toRanked((v) => v.transaksi),
    tagihan: toRanked((v) => v.tagihan),
    kartu: toRanked((v) => v.kartu),
  };

  // ── Bank Distribution ────────────────────────────────────
  const bankMap = new Map<string, number>();
  for (const r of rows) {
    const bank = (r.bank_penerbit || "Tidak Diketahui").trim();
    bankMap.set(bank, (bankMap.get(bank) || 0) + 1);
  }
  const bankTotal = rows.length;
  const bankDistribution: BankDistItem[] = [...bankMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([bank, count]) => ({
      bank,
      count,
      percentage: bankTotal > 0 ? (count / bankTotal) * 100 : 0,
    }));

  // ── Transaksi per KL (top 10 bar chart) ──────────────────
  const klMap = new Map<string, number>();
  const kdToNmDept = new Map(kddeptData.map(d => [d.kddept, d.nmdept]));
  
  for (const r of rows) {
    const key = (r.kddept || "").trim();
    if (!key) continue;
    klMap.set(key, (klMap.get(key) || 0) + Number(r.nilai_trans_sp2d || 0));
  }
  
  const transaksiPerKL: TransaksiKLItem[] = [...klMap.entries()]
    .map(([kddept, totalTransaksi]) => ({
      kddept,
      nmdept: kdToNmDept.get(kddept) || `K/L ${kddept}`,
      totalTransaksi,
    }))
    .sort((a, b) => b.totalTransaksi - a.totalTransaksi)
    .slice(0, 10);

  // ── Transaksi per Satker (top 10 bar chart) ──────────────
  const satkerMap = new Map<string, { nmsatker: string; total: number }>();
  for (const r of rows) {
    const key = (r.kdsatker || "").trim();
    if (!key) continue;
    const existing = satkerMap.get(key) || { nmsatker: r.nmsatker || key, total: 0 };
    existing.total += Number(r.nilai_trans_sp2d || 0);
    satkerMap.set(key, existing);
  }

  const transaksiPerSatker: TransaksiSatkerItem[] = [...satkerMap.entries()]
    .map(([kdsatker, v]) => ({
      kdsatker,
      nmsatker: v.nmsatker,
      totalTransaksi: v.total,
    }))
    .sort((a, b) => b.totalTransaksi - a.totalTransaksi)
    .slice(0, 10);

  // ── Kendala Distribution (kategori) ──────────────────────
  const kendalaMap = new Map<string, number>();
  for (const r of rows) {
    const rawKendala = (r.kendala || "").trim();
    if (!rawKendala) continue;
    
    // Split by comma or semicolon to handle rows with multiple categories
    const categories = rawKendala.split(/[,;]/);
    for (const cat of categories) {
      const kategori = cat.trim();
      if (kategori) {
        kendalaMap.set(kategori, (kendalaMap.get(kategori) || 0) + 1);
      }
    }
  }
  const kendalaTotal = [...kendalaMap.values()].reduce((s, v) => s + v, 0);
  const kendalaStats: KendalaItem[] = [...kendalaMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([kategori, count]) => ({
      kategori,
      count,
      percentage: kendalaTotal > 0 ? (count / kendalaTotal) * 100 : 0,
    }));

  // ── Detil Kendala Word Cloud ─────────────────────────────
  // Tokenize detil_kendala text into words, count frequency
    // Boundary words break sentences into independent clauses
    const BOUNDARY_WORDS = new Set([
      "dan", "atau", "karena", "dikarenakan", "sebab", "sehingga", "maka", 
      "namun", "tetapi", "serta", "sedangkan", "lalu", "kemudian", "maupun", 
      "yaitu", "adalah", "bahwa", "padahal"
    ]);

    // Junk words are deleted from the phrase to compress it, without breaking the clause
    const JUNK_WORDS = new Set([
      "yang", "di", "ke", "dari", "untuk", "dengan", "pada", "ini", "itu", 
      "juga", "sudah", "ada", "akan", "oleh", "sebagai", "dalam", "telah", 
      "agar", "secara", "hal", "seperti", "lebih", "sesuai", "atas", "tersebut", 
      "melalui", "antara", "perlu", "sedang", "saat", "setelah", "nya", "kami", 
      "mereka", "kita", "sangat", "terkait", "tentang", "mengenai", "adanya", 
      "terdapat", "mengalami", "demikian", "adapun", "beberapa", "lainnya", "lain"
    ]);

    const NEGATIVE_WORDS = new Set([
      "belum", "tidak", "masih", "susah", "sulit", "gagal", "rusak", "error",
      "lambat", "lama", "diblokir", "blokir", "ditolak", "tolak",
      "kurang", "kurangnya", "kendala", "masalah", "terhambat", "hambat", "hilang",
      "batas", "limit", "tutup", "kadaluarsa", "mati", "offline",
      "pergantian", "ganti", "revisi", "salah", "lamban", "menolak", "sedikit"
    ]);

    // Words that are too generic to stand alone. A phrase composed ENTIRELY of these is discarded.
    const WEAK_WORDS = new Set([
      "kkp", "masih", "belum", "tidak", "banyak", "sedikit", "cukup", "demikian",
      "terdapat", "adanya", "terbit", "berarti", "salah", "satu", "membuat",
      "menjadi", "proses", "kendala", "masalah", "kurang", "kurangnya", "pihak",
      "sangat", "hanya", "baru", "beberapa", "lama", "karena", "sebab", "terjadi", "lagi",
      "bisa", "dapat", "saat", "ini", "itu"
    ]);

    const wordFreq = new Map<string, number>();
    for (const r of rows) {
      const text = (r.detil_kendala || "").trim();
      if (!text) continue;
      const tokens = text
        .toLowerCase()
        .split(/[^a-zA-Z0-9]+/)
        .filter((w) => w.length > 1);

      // Clause Extraction: Group words into clauses, skipping junk words
      let currentChunk: string[] = [];
      const chunks: string[][] = [];

      for (const w of tokens) {
        if (BOUNDARY_WORDS.has(w)) {
          if (currentChunk.length > 0) {
            chunks.push(currentChunk);
            currentChunk = [];
          }
        } else if (!JUNK_WORDS.has(w)) {
          currentChunk.push(w);
        }
      }
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }

      for (const chunk of chunks) {
        // Keep chunks of 2 to 8 words to capture full context (now that junk is removed)
        if (chunk.length >= 2 && chunk.length <= 8) {
          // Must contain at least one negative indicator
          if (chunk.some(w => NEGATIVE_WORDS.has(w))) {
            // Must NOT be entirely composed of weak filler words
            if (!chunk.every(w => WEAK_WORDS.has(w))) {
              const phrase = chunk.join(" ");
              wordFreq.set(phrase, (wordFreq.get(phrase) || 0) + 1);
            }
          }
        }
      }
    }
  const detilKendalaWords: WordCloudItem[] = [...wordFreq.entries()]
    .filter(([, count]) => count >= 2) // Only words appearing 2+ times
    .sort((a, b) => b[1] - a[1])
    .slice(0, 60) // Top 60 words
    .map(([text, value]) => ({ text, value }));

  return {
    quickStats,
    kppnRankings,
    bankDistribution,
    transaksiPerKL,
    transaksiPerSatker,
    kendalaStats,
    detilKendalaWords,
    nmlokasi: rows.length > 0 ? (rows[0]?.nmlokasi || null) : null,
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
