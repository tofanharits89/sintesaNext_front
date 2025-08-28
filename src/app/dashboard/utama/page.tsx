"use client";

import { useState, useEffect } from "react";
import { BarChartComponent } from "@/components/ui/bar-chart";
import { MultipleBarChartComponent } from "@/components/ui/multiple-bar-chart";
import { LineChartComponent } from "@/components/ui/line-chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Banknote,
  Wallet,
  TrendingUp,
  Lock,
  Calculator,
} from "lucide-react";
import kdkanwilData from "@/data/kdkanwil.json";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";
import { useRealisasiPerJenisBelanja } from "@/hooks/useRealisasiPerJenisBelanja";
import { backendPath } from "@/lib/backend";

// Sample data for the bar charts
const realisasiApbnData = [
  { name: "Jan", target: 120, realisasi: 110 },
  { name: "Feb", target: 140, realisasi: 135 },
  { name: "Mar", target: 160, realisasi: 155 },
  { name: "Apr", target: 180, realisasi: 170 },
  { name: "Mei", target: 200, realisasi: 195 },
  { name: "Jun", target: 220, realisasi: 210 },
];

const klTopData = [
  { name: "Kemendikbud", value: 85 },
  { name: "Kemenkes", value: 78 },
  { name: "Kemenhub", value: 72 },
  { name: "Kemenag", value: 68 },
  { name: "Kemendagri", value: 65 },
];

const fungsiData = [
  { name: "Pendidikan", value: 320 },
  { name: "Kesehatan", value: 280 },
  { name: "Infrastruktur", value: 240 },
  { name: "Pertahanan", value: 180 },
  { name: "Sosial", value: 160 },
  { name: "Ekonomi", value: 140 },
];

// Data for Tren Penerimaan vs Belanja line chart
const trenPenerimaanBelanja = [
  { name: "Jan", penerimaan: 95, belanja: 110 },
  { name: "Feb", penerimaan: 105, belanja: 125 },
  { name: "Mar", penerimaan: 120, belanja: 140 },
  { name: "Apr", penerimaan: 135, belanja: 155 },
  { name: "Mei", penerimaan: 150, belanja: 170 },
  { name: "Jun", penerimaan: 165, belanja: 185 },
  { name: "Jul", penerimaan: 180, belanja: 200 },
  { name: "Agu", penerimaan: 195, belanja: 210 },
  { name: "Sep", penerimaan: 210, belanja: 225 },
  { name: "Okt", penerimaan: 225, belanja: 240 },
  { name: "Nov", penerimaan: 240, belanja: 250 },
  { name: "Des", penerimaan: 255, belanja: 260 },
];

// Data for Proyeksi Deficit line chart
const proyeksiDeficit = [
  { name: "Jan", aktual: -15, proyeksi: -12 },
  { name: "Feb", aktual: -20, proyeksi: -18 },
  { name: "Mar", aktual: -20, proyeksi: -22 },
  { name: "Apr", aktual: -20, proyeksi: -25 },
  { name: "Mei", aktual: -20, proyeksi: -28 },
  { name: "Jun", aktual: -20, proyeksi: -30 },
  { name: "Jul", aktual: null, proyeksi: -32 },
  { name: "Agu", aktual: null, proyeksi: -15 },
  { name: "Sep", aktual: null, proyeksi: -10 },
  { name: "Okt", aktual: null, proyeksi: -8 },
  { name: "Nov", aktual: null, proyeksi: -5 },
  { name: "Des", aktual: null, proyeksi: -2 },
];

// Types for the API response
interface QuickStatsData {
  jumlahDipa: number;
  paguApbn: number;
  paguDipa: number;
  realisasi: number;
  blokir: number;
  sisaPaguDipa: number;
}

interface QuickStatsResponse {
  success: boolean;
  data: QuickStatsData;
  filters: {
    kanwil: string;
  };
  timestamp: string;
}

// Helper function to format currency
const formatCurrency = (value: number): string => {
  if (value >= 1000000000000) {
    const trillionValue = (value / 1000000000000).toFixed(1);
    return `Rp ${parseFloat(trillionValue).toLocaleString("id-ID")} T`;
  }
  if (value >= 1000000000) {
    const millionValue = (value / 1000000000).toFixed(1);
    return `Rp ${parseFloat(millionValue).toLocaleString("id-ID")} M`;
  }
  return `Rp ${value.toLocaleString("id-ID")}`;
};

export default function DashboardUtamaPage() {
  const [selectedKanwil, setSelectedKanwil] = useState<string>("semua");
  const [quickStats, setQuickStats] = useState<QuickStatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Realisasi per Jenis Belanja data
  const {
    data: realisasiJenisBelanjaData,
    isLoading: isLoadingRealisasi,
    error: realisasiError,
  } = useRealisasiPerJenisBelanja({
    kanwil: selectedKanwil !== "semua" ? selectedKanwil : undefined,
  });

  // Check if realisasi error is authentication related
  const isRealisasiAuthError =
    realisasiError?.message?.includes("authentication") ||
    realisasiError?.message?.includes("log in") ||
    realisasiError?.message?.includes("401");

  // Fetch quick stats from API
  const fetchQuickStats = async (kanwil: string = "semua") => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthTokenFromCookie();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const params = new URLSearchParams();
      if (kanwil !== "semua") {
        params.append("kanwil", kanwil);
      }

      const response = await fetch(
        backendPath(`/dashboard/quick-stats?${params}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: QuickStatsResponse = await response.json();

      if (result.success) {
        setQuickStats(result.data);
      } else {
        throw new Error("Failed to fetch quick stats");
      }
    } catch (err) {
      console.error("Error fetching quick stats:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      // Fallback to mock data on error
      setQuickStats({
        jumlahDipa: 1245,
        paguApbn: 1250000000000000,
        paguDipa: 1100000000000000,
        realisasi: 850000000000000,
        blokir: 45000000000000,
        sisaPaguDipa: 205000000000000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle kanwil selection change
  const handleKanwilChange = (value: string) => {
    setSelectedKanwil(value);
    fetchQuickStats(value);
  };

  // Fetch initial data
  useEffect(() => {
    fetchQuickStats(selectedKanwil);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard Utama
          </h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan cepat realisasi APBN dan indikator makro.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter Kanwil:</span>
          <Select value={selectedKanwil} onValueChange={handleKanwilChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pilih Kanwil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Kanwil</SelectItem>
              {kdkanwilData.map((kanwil) => (
                <SelectItem key={kanwil.kdkanwil} value={kanwil.kdkanwil}>
                  {kanwil.nmkanwil}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {loading && (
            <span className="text-xs text-muted-foreground">Loading...</span>
          )}
        </div>
      </div>

      {/* First Row: 6 Compact Quick Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {error && (
          <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">Error loading data: {error}</p>
            <p className="text-xs text-red-500 mt-1">Showing fallback data</p>
          </div>
        )}

        <div className="rounded-lg p-3 bg-white dark:bg-neutral-900 shadow relative">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            <p className="text-xs text-muted-foreground">Jumlah DIPA</p>
          </div>
          <p className="mt-1 text-lg font-semibold">
            {loading
              ? "..."
              : quickStats?.jumlahDipa?.toLocaleString("id-ID") || "0"}
          </p>
        </div>
        <div className="rounded-lg p-3 bg-white dark:bg-neutral-900 shadow relative">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-green-500" />
            <p className="text-xs text-muted-foreground">Pagu APBN</p>
          </div>
          <p className="mt-1 text-lg font-semibold">
            {loading ? "..." : formatCurrency(quickStats?.paguApbn || 0)}
          </p>
        </div>
        <div className="rounded-lg p-3 bg-white dark:bg-neutral-900 shadow relative">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-purple-500" />
            <p className="text-xs text-muted-foreground">Pagu DIPA</p>
          </div>
          <p className="mt-1 text-lg font-semibold">
            {loading ? "..." : formatCurrency(quickStats?.paguDipa || 0)}
          </p>
        </div>
        <div className="rounded-lg p-3 bg-white dark:bg-neutral-900 shadow relative">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            <p className="text-xs text-muted-foreground">Realisasi</p>
          </div>
          <p className="mt-1 text-lg font-semibold">
            {loading ? "..." : formatCurrency(quickStats?.realisasi || 0)}
          </p>
        </div>
        <div className="rounded-lg p-3 bg-white dark:bg-neutral-900 shadow relative">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-red-500" />
            <p className="text-xs text-muted-foreground">Blokir</p>
          </div>
          <p className="mt-1 text-lg font-semibold">
            {loading ? "..." : formatCurrency(quickStats?.blokir || 0)}
          </p>
        </div>
        <div className="rounded-lg p-3 bg-white dark:bg-neutral-900 shadow relative">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-teal-500" />
            <p className="text-xs text-muted-foreground">Sisa Pagu DIPA</p>
          </div>
          <p className="mt-1 text-lg font-semibold">
            {loading ? "..." : formatCurrency(quickStats?.sisaPaguDipa || 0)}
          </p>
        </div>
      </div>

      {/* Second Row: 3 Cards with Bar Charts */}
      <div className="grid gap-4 md:grid-cols-3">
        {isRealisasiAuthError ? (
          <div className="rounded-lg p-6 bg-white dark:bg-neutral-900 shadow border-2 border-dashed border-yellow-300">
            <div className="text-center">
              <Lock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Realisasi per Jenis Belanja
              </h3>
              <p className="text-sm text-yellow-600 mb-3">
                Login required to view this data
              </p>
              <button
                onClick={() => (window.location.href = "/login")}
                className="px-4 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
              >
                Login to View Data
              </button>
            </div>
          </div>
        ) : (
          <MultipleBarChartComponent
            data={
              realisasiJenisBelanjaData?.categories?.map((category, index) => ({
                name: category,
                "Pagu DIPA":
                  realisasiJenisBelanjaData.series.find(
                    (s) => s.name === "Pagu DIPA"
                  )?.data[index] || 0,
                Realisasi:
                  realisasiJenisBelanjaData.series.find(
                    (s) => s.name === "Realisasi"
                  )?.data[index] || 0,
              })) || []
            }
            title={`Realisasi per Jenis Belanja${
              isLoadingRealisasi
                ? " (Loading...)"
                : realisasiError
                ? " (Error - Using Fallback)"
                : ""
            }`}
            description={
              realisasiError && !isRealisasiAuthError
                ? "Error loading data - showing fallback data"
                : "Perbandingan Pagu DIPA vs Realisasi (Triliun Rp)"
            }
            series={[
              { dataKey: "Pagu DIPA", name: "Pagu DIPA", color: "#3b82f6" },
              { dataKey: "Realisasi", name: "Realisasi", color: "#10b981" },
            ]}
            height={250}
            formatValue={(value) => {
              if (value >= 1000000000000) {
                return `${(value / 1000000000000).toFixed(1)}T`;
              }
              if (value >= 1000000000) {
                return `${(value / 1000000000).toFixed(1)}M`;
              }
              return value.toLocaleString("id-ID");
            }}
          />
        )}
        <BarChartComponent
          data={klTopData}
          title="Top 5 K/L"
          description="Realisasi tertinggi (%)"
          color="#10b981"
          height={250}
        />
        <BarChartComponent
          data={fungsiData}
          title="Realisasi per Fungsi"
          description="Alokasi anggaran (Triliun Rp)"
          color="#f59e0b"
          height={250}
        />
      </div>

      {/* Third Row: 2 Cards with Line Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <LineChartComponent
          data={trenPenerimaanBelanja}
          title="Tren Penerimaan vs Belanja"
          description="Perbandingan bulanan 2025 (Triliun Rp)"
          lines={[
            { dataKey: "penerimaan", stroke: "#10b981", name: "Penerimaan" },
            { dataKey: "belanja", stroke: "#ef4444", name: "Belanja" },
          ]}
          height={280}
        />
        <LineChartComponent
          data={proyeksiDeficit}
          title="Proyeksi Defisit/Surplus"
          description="Estimasi hingga akhir tahun (Triliun Rp)"
          lines={[
            { dataKey: "aktual", stroke: "#3b82f6", name: "Aktual" },
            { dataKey: "proyeksi", stroke: "#f59e0b", name: "Proyeksi" },
          ]}
          height={280}
        />
      </div>
    </div>
  );
}
