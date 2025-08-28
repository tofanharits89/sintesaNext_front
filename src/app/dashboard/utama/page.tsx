"use client";

import { useState } from "react";
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
// getAuthTokenFromCookie is now used in the useQuickStats hook
import { useRealisasiPerJenisBelanja } from "@/hooks/useRealisasiPerJenisBelanja";
import { useRealisasiKLPaguTerbesar } from "@/hooks/useRealisasiKLPaguTerbesar";
import { useRealisasiKLPaguProgramTerbesar } from "@/hooks/useRealisasiKLPaguProgramTerbesar";
import { useTrenRealisasiBulananPerJenisBelanja } from "@/hooks/useTrenRealisasiBulananPerJenisBelanja";
import { useQuickStats } from "@/hooks/useQuickStats";
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

// Static data removed - now using dynamic data from API

const fungsiData = [
  { name: "Pendidikan", value: 320 },
  { name: "Kesehatan", value: 280 },
  { name: "Infrastruktur", value: 240 },
  { name: "Pertahanan", value: 180 },
  { name: "Sosial", value: 160 },
  { name: "Ekonomi", value: 140 },
];

// Static data for Tren Penerimaan vs Belanja has been replaced with dynamic API data

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

// QuickStatsData interface is now imported from the hook

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

  // Fetch Quick Stats data using React Query
  const {
    data: quickStats,
    isLoading: isLoadingQuickStats,
    error: quickStatsError,
  } = useQuickStats({
    kanwil: selectedKanwil !== "semua" ? selectedKanwil : undefined,
  });

  // Fetch Realisasi per Jenis Belanja data
  const {
    data: realisasiJenisBelanjaData,
    isLoading: isLoadingRealisasi,
    error: realisasiError,
  } = useRealisasiPerJenisBelanja({
    kanwil: selectedKanwil !== "semua" ? selectedKanwil : undefined,
  });

  // Fetch K/L dengan Pagu DIPA Terbesar data
  const {
    data: klPaguTerbesarData,
    isLoading: isLoadingKLPagu,
    error: klPaguError,
  } = useRealisasiKLPaguTerbesar({
    kanwil: selectedKanwil !== "semua" ? selectedKanwil : undefined,
  });

  const {
    data: realisasiKLPaguProgramTerbesarData,
    isLoading: isLoadingRealisasiKLPaguProgramTerbesar,
    error: errorRealisasiKLPaguProgramTerbesar,
  } = useRealisasiKLPaguProgramTerbesar({
    kanwil: selectedKanwil !== "semua" ? selectedKanwil : undefined,
  });

  // Fetch Tren Realisasi Bulanan Per Jenis Belanja data
  const {
    data: trenRealisasiBulananData,
    isLoading: isLoadingTrenRealisasi,
    error: trenRealisasiError,
  } = useTrenRealisasiBulananPerJenisBelanja({
    kanwil: selectedKanwil !== "semua" ? selectedKanwil : undefined,
  });

  // Check if realisasi error is authentication related
  const isRealisasiAuthError =
    realisasiError?.message?.includes("authentication") ||
    realisasiError?.message?.includes("log in") ||
    realisasiError?.message?.includes("401");

  // Check if K/L pagu error is authentication related
  const isKLPaguAuthError =
    klPaguError?.message?.includes("authentication") ||
    klPaguError?.message?.includes("log in") ||
    klPaguError?.message?.includes("401");

  // Check if quick stats error is authentication related
  const isQuickStatsAuthError =
    quickStatsError?.message?.includes("authentication") ||
    quickStatsError?.message?.includes("log in") ||
    quickStatsError?.message?.includes("401");

  // Check if tren realisasi error is authentication related
  const isTrenRealisasiAuthError =
    trenRealisasiError?.message?.includes("authentication") ||
    trenRealisasiError?.message?.includes("log in") ||
    trenRealisasiError?.message?.includes("401");

  // Helper function to format currency for chart display
  const formatChartCurrency = (value: number): string => {
    if (value >= 1000000000000) {
      return `${(value / 1000000000000).toFixed(1)}T`;
    }
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}M`;
    }
    return value.toLocaleString("id-ID");
  };

  // Handle kanwil selection change
  const handleKanwilChange = (value: string) => {
    setSelectedKanwil(value);
    // React Query will automatically refetch when selectedKanwil changes
  };

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
          {isLoadingQuickStats && (
            <span className="text-xs text-muted-foreground">Loading...</span>
          )}
        </div>
      </div>

      {/* First Row: 6 Compact Quick Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {quickStatsError && !isQuickStatsAuthError && (
          <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">
              Error loading data: {quickStatsError.message}
            </p>
            <p className="text-xs text-red-500 mt-1">
              Please try refreshing the page
            </p>
          </div>
        )}
        {isQuickStatsAuthError && (
          <div className="col-span-full bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-600">
              Authentication required to view quick stats
            </p>
            <button
              onClick={() => (window.location.href = "/login")}
              className="mt-2 px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
            >
              Login to View Data
            </button>
          </div>
        )}

        <div className="rounded-lg p-3 bg-white dark:bg-neutral-900 shadow relative">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            <p className="text-xs text-muted-foreground">Jumlah DIPA</p>
          </div>
          <p className="mt-1 text-lg font-semibold">
            {isLoadingQuickStats
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
            {isLoadingQuickStats
              ? "..."
              : formatCurrency(quickStats?.paguApbn || 0)}
          </p>
        </div>
        <div className="rounded-lg p-3 bg-white dark:bg-neutral-900 shadow relative">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-purple-500" />
            <p className="text-xs text-muted-foreground">Pagu DIPA</p>
          </div>
          <p className="mt-1 text-lg font-semibold">
            {isLoadingQuickStats
              ? "..."
              : formatCurrency(quickStats?.paguDipa || 0)}
          </p>
        </div>
        <div className="rounded-lg p-3 bg-white dark:bg-neutral-900 shadow relative">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            <p className="text-xs text-muted-foreground">Realisasi</p>
          </div>
          <p className="mt-1 text-lg font-semibold">
            {isLoadingQuickStats
              ? "..."
              : formatCurrency(quickStats?.realisasi || 0)}
          </p>
        </div>
        <div className="rounded-lg p-3 bg-white dark:bg-neutral-900 shadow relative">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-red-500" />
            <p className="text-xs text-muted-foreground">Blokir</p>
          </div>
          <p className="mt-1 text-lg font-semibold">
            {isLoadingQuickStats
              ? "..."
              : formatCurrency(quickStats?.blokir || 0)}
          </p>
        </div>
        <div className="rounded-lg p-3 bg-white dark:bg-neutral-900 shadow relative">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-teal-500" />
            <p className="text-xs text-muted-foreground">Sisa Pagu DIPA</p>
          </div>
          <p className="mt-1 text-lg font-semibold">
            {isLoadingQuickStats
              ? "..."
              : formatCurrency(quickStats?.sisaPaguDipa || 0)}
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
        {isKLPaguAuthError ? (
          <div className="rounded-lg p-6 bg-white dark:bg-neutral-900 shadow border-2 border-dashed border-yellow-300">
            <div className="text-center">
              <Lock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Realisasi K/L dengan Pagu DIPA Terbesar
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
              klPaguTerbesarData?.map((item) => ({
                name: item.nama_kementerian,
                "Pagu DIPA": item.pagu_dipa,
                Realisasi: item.realisasi,
              })) || []
            }
            title={`Realisasi K/L dengan Pagu DIPA Terbesar${
              isLoadingKLPagu
                ? " (Loading...)"
                : klPaguError
                ? " (Error - Using Fallback)"
                : ""
            }`}
            description={
              klPaguError && !isKLPaguAuthError
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
        {errorRealisasiKLPaguProgramTerbesar?.message?.includes(
          "authentication"
        ) ||
        errorRealisasiKLPaguProgramTerbesar?.message?.includes("log in") ||
        errorRealisasiKLPaguProgramTerbesar?.message?.includes("401") ? (
          <div className="rounded-lg p-6 bg-white dark:bg-neutral-900 shadow border-2 border-dashed border-yellow-300">
            <div className="text-center">
              <Lock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Realisasi K/L dengan Pagu Program Terbesar
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
              realisasiKLPaguProgramTerbesarData?.map((item) => ({
                name: item.nama_program,
                "Pagu DIPA": item.pagu_dipa,
                Realisasi: item.realisasi,
              })) || []
            }
            title={`Realisasi K/L dengan Pagu Program Terbesar${
              isLoadingRealisasiKLPaguProgramTerbesar
                ? " (Loading...)"
                : errorRealisasiKLPaguProgramTerbesar
                ? " (Error - Using Fallback)"
                : ""
            }`}
            description={
              errorRealisasiKLPaguProgramTerbesar &&
              !errorRealisasiKLPaguProgramTerbesar?.message?.includes(
                "authentication"
              )
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
      </div>

      {/* Third Row: 2 Cards with Line Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {isTrenRealisasiAuthError ? (
          <div className="rounded-lg p-6 bg-white dark:bg-neutral-900 shadow border-2 border-dashed border-yellow-300">
            <div className="text-center">
              <Lock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Tren Realisasi Bulanan Per Jenis Belanja
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
          <LineChartComponent
            data={
              trenRealisasiBulananData?.categories?.map((category, index) => {
                const dataPoint: any = { name: category };
                trenRealisasiBulananData.series.forEach((serie) => {
                  dataPoint[serie.name] = serie.data[index] || 0;
                });
                return dataPoint;
              }) || []
            }
            title={`Tren Realisasi Bulanan Per Jenis Belanja${
              isLoadingTrenRealisasi
                ? " (Loading...)"
                : trenRealisasiError
                ? " (Error - Using Fallback)"
                : ""
            }`}
            description={
              trenRealisasiError && !isTrenRealisasiAuthError
                ? "Error loading data - showing fallback data"
                : "Realisasi bulanan per jenis belanja 2025 (Triliun Rp)"
            }
            lines={
              trenRealisasiBulananData?.series?.map((serie, index) => {
                const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
                return {
                  dataKey: serie.name,
                  stroke: colors[index % colors.length],
                  name: serie.name,
                };
              }) || [
                {
                  dataKey: "51-Pegawai",
                  stroke: "#3b82f6",
                  name: "51-Pegawai",
                },
                { dataKey: "52-Barang", stroke: "#10b981", name: "52-Barang" },
                { dataKey: "53-Modal", stroke: "#f59e0b", name: "53-Modal" },
                { dataKey: "57-Bansos", stroke: "#ef4444", name: "57-Bansos" },
              ]
            }
            height={280}
            formatValue={(value) =>
              `Rp ${(value / 1000000000000).toFixed(1)} T`
            }
            legendFontSize={12}
            hideYAxisTicks
            chartMargin={{ top: 0, right: 18, bottom: 0, left: 18 }}
            xAxisPadding={{ left: 24, right: 16 }}
          />
        )}
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
