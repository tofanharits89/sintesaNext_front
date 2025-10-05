"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

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
import { usePersentaseRealisasiKL } from "@/hooks/usePersentaseRealisasiKL";
import { useRealisasiKLPerFungsi } from "@/hooks/useRealisasiKLPerFungsi";

import { StatCard, AuthRequiredCard, MultipleBarChart, BarChart, LineChart } from "@/components/lazy";
import { ComponentLoadingFallback, ChartLoadingFallback } from "@/components/ui/loading-fallback";
import { Suspense } from "react";

import {
  StatCardSkeleton,
  MultipleBarChartSkeleton,
  LineChartSkeleton,
  BarChartSkeleton,
  DashboardHeaderSkeleton,
} from "@/components/ui/dashboard-skeletons";
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
// const proyeksiDeficit = [
//   { name: "Jan", aktual: -15, proyeksi: -12 },
//   { name: "Feb", aktual: -20, proyeksi: -18 },
//   { name: "Mar", aktual: -20, proyeksi: -22 },
//   { name: "Apr", aktual: -20, proyeksi: -25 },
//   { name: "Mei", aktual: -20, proyeksi: -28 },
//   { name: "Jun", aktual: -20, proyeksi: -30 },
//   { name: "Jul", aktual: null, proyeksi: -32 },
//   { name: "Agu", aktual: null, proyeksi: -15 },
//   { name: "Sep", aktual: null, proyeksi: -10 },
//   { name: "Okt", aktual: null, proyeksi: -8 },
//   { name: "Nov", aktual: null, proyeksi: -5 },
//   { name: "Des", aktual: null, proyeksi: -2 },
// ];

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

// Component to prevent hydration mismatch
function NoSSR({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? <>{children}</> : null;
}

export default function DashboardUtamaPage() {
  const router = useRouter();
  const [selectedKanwil, setSelectedKanwil] = useState<string>("semua");

  // Socket connection is handled by DashboardSocketInitializer in DashboardProvider
  // No need for page-specific socket initialization

  // Fetch Quick Stats data using React Query
  const {
    data: quickStats,
    isLoading: isLoadingQuickStats,
    error: quickStatsError,
  } = useQuickStats({
    ...(selectedKanwil !== "semua" ? { kanwil: selectedKanwil } : {}),
  });

  // Ensure strong typing for quickStats data shape
  const qs = quickStats as import("@/hooks/useQuickStats").QSReturn | undefined;

  // Fetch Realisasi per Jenis Belanja data
  const {
    data: realisasiJenisBelanjaData,
    isLoading: isLoadingRealisasi,
    error: realisasiError,
  } = useRealisasiPerJenisBelanja({
    ...(selectedKanwil !== "semua" ? { kanwil: selectedKanwil } : {}),
  });

  // Fetch K/L dengan Pagu DIPA Terbesar data
  const {
    data: klPaguTerbesarData,
    isLoading: isLoadingKLPagu,
    error: klPaguError,
  } = useRealisasiKLPaguTerbesar({
    ...(selectedKanwil !== "semua" ? { kanwil: selectedKanwil } : {}),
  });

  const {
    data: realisasiKLPaguProgramTerbesarData,
    isLoading: isLoadingRealisasiKLPaguProgramTerbesar,
    error: errorRealisasiKLPaguProgramTerbesar,
  } = useRealisasiKLPaguProgramTerbesar({
    ...(selectedKanwil !== "semua" ? { kanwil: selectedKanwil } : {}),
  });

  // Fetch Tren Realisasi Bulanan Per Jenis Belanja data
  const {
    data: trenRealisasiBulananData,
    isLoading: isLoadingTrenRealisasi,
    error: trenRealisasiError,
  } = useTrenRealisasiBulananPerJenisBelanja({
    ...(selectedKanwil !== "semua" ? { kanwil: selectedKanwil } : {}),
  });

  // Fetch Persentase Realisasi K/L data
  const {
    data: persentaseKLData,
    isLoading: isLoadingPersentaseKL,
    error: persentaseKLError,
  } = usePersentaseRealisasiKL({
    ...(selectedKanwil !== "semua" ? { kanwil: selectedKanwil } : {}),
  });

  const {
    data: realisasiKLPerFungsi,
    isLoading: isLoadingRealisasiKLPerFungsi,
    error: realisasiKLPerFungsiError,
  } = useRealisasiKLPerFungsi({
    ...(selectedKanwil !== "semua" ? { kanwil: selectedKanwil } : {}),
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

  // Check if persentase K/L error is authentication related
  const isPersentaseAuthError =
    persentaseKLError?.message?.includes("authentication") ||
    persentaseKLError?.message?.includes("log in") ||
    persentaseKLError?.message?.includes("401");

  const isQuickStatsAuthError =
    quickStatsError?.message?.includes("authentication") ||
    quickStatsError?.message?.includes("log in") ||
    quickStatsError?.message?.includes("401");

  // Check if tren realisasi error is authentication related
  const isTrenRealisasiAuthError =
    trenRealisasiError?.message?.includes("authentication") ||
    trenRealisasiError?.message?.includes("log in") ||
    trenRealisasiError?.message?.includes("401");

  // Check if realisasi K/L per fungsi error is authentication related
  const isRealisasiKLPerFungsiAuthError =
    realisasiKLPerFungsiError?.message?.includes("authentication") ||
    realisasiKLPerFungsiError?.message?.includes("log in") ||
    realisasiKLPerFungsiError?.message?.includes("401");



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

  // Last refresh info from backend meta header (forwarded by Next API)
  const lastRefreshJakarta = (quickStats as any)?._meta?.asOfJakarta as
    | string
    | undefined;
  
  // Client-side date formatting to prevent hydration mismatch
  // Use NoSSR component to prevent hydration mismatch
  const [lastRefreshText, setLastRefreshText] = useState<string>('-')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && lastRefreshJakarta) {
      try {
        const formattedDate = new Date(lastRefreshJakarta).toLocaleString("id-ID", {
          timeZone: "Asia/Jakarta",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
        setLastRefreshText(`${formattedDate} WIB`)
      } catch (error) {
        console.error('Error formatting date:', error)
        setLastRefreshText('-')
      }
    } else if (isClient) {
      setLastRefreshText('-')
    }
  }, [lastRefreshJakarta, isClient])

  // Show single loading state for initial load
  const isInitialLoading = isLoadingQuickStats && !quickStats;

  // Handle kanwil selection change
  const handleKanwilChange = (value: string) => {
    setSelectedKanwil(value);
    // React Query will automatically refetch when selectedKanwil changes
  };

  // Show unified loading state for better UX
  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <DashboardHeaderSkeleton />
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <MultipleBarChartSkeleton key={i} height={250} />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <LineChartSkeleton height={280} />
          <MultipleBarChartSkeleton height={280} />
        </div>
        <BarChartSkeleton height={360} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - always show the actual header, no skeleton */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard Utama K/L
          </h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan cepat realisasi APBN untuk Kementerian/Lembaga.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Terakhir diperbarui: <NoSSR>{lastRefreshText}</NoSSR>
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
              onClick={() => router.push("/login")}
              className="mt-2 px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
            >
              Login to View Data
            </button>
          </div>
        )}

        {isLoadingQuickStats ? (
          // Show skeleton cards while loading
          Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={`skeleton-${i}`} />
          ))
        ) : (
          // Show actual stat cards when loaded
          <>
            <StatCard
              label="Jumlah DIPA"
              icon={<FileText className="h-4 w-4 text-blue-500" />}
              loading={isLoadingQuickStats}
              value={qs?.jumlahDipa?.toLocaleString("id-ID") || "0"}
            />
            <StatCard
              label="Pagu APBN"
              icon={<Banknote className="h-4 w-4 text-green-500" />}
              loading={isLoadingQuickStats}
              value={formatCurrency(qs?.paguApbn || 0)}
            />
            <StatCard
              label="Pagu DIPA"
              icon={<Wallet className="h-4 w-4 text-purple-500" />}
              loading={isLoadingQuickStats}
              value={formatCurrency(qs?.paguDipa || 0)}
            />
            <StatCard
              label="Realisasi"
              icon={<TrendingUp className="h-4 w-4 text-orange-500" />}
              loading={isLoadingQuickStats}
              value={formatCurrency(qs?.realisasi || 0)}
            />
            <StatCard
              label="Blokir"
              icon={<Lock className="h-4 w-4 text-red-500" />}
              loading={isLoadingQuickStats}
              value={formatCurrency(qs?.blokir || 0)}
            />
            <StatCard
              label="Sisa Pagu DIPA"
              icon={<Calculator className="h-4 w-4 text-teal-500" />}
              loading={isLoadingQuickStats}
              value={formatCurrency(qs?.sisaPaguDipa || 0)}
            />
          </>
        )}
      </div>



      {/* Second Row: 3 Cards with Bar Charts */}
      <div className="grid gap-4 md:grid-cols-3">
        {isRealisasiAuthError ? (
          <AuthRequiredCard
            title="Realisasi per Jenis Belanja"
            description="Login required to view this data"
          />
        ) : isLoadingRealisasi ? (
          <MultipleBarChartSkeleton height={250} />
        ) : (
          <MultipleBarChart
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
              <AuthRequiredCard
              title="Realisasi K/L dengan Pagu DIPA Terbesar"
              description="Login required to view this data"
            />
          ) : isLoadingKLPagu ? (
          <MultipleBarChartSkeleton height={250} />
        ) : (
                <MultipleBarChart
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
              <AuthRequiredCard
              title="Realisasi K/L dengan Pagu Program Terbesar"
              description="Login required to view this data"
            />
          ) : isLoadingRealisasiKLPaguProgramTerbesar ? (
          <MultipleBarChartSkeleton height={250} />
        ) : (
                <MultipleBarChart
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
              <AuthRequiredCard
              title="Tren Realisasi Bulanan Per Jenis Belanja"
              description="Login required to view this data"
            />
          ) : isLoadingTrenRealisasi ? (
          <LineChartSkeleton height={280} />
        ) : (
                <LineChart
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
                const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"] as const;
                const stroke: string = colors[index % colors.length] ?? "#3b82f6";
                return {
                  dataKey: serie.name,
                  stroke,
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

        {isRealisasiKLPerFungsiAuthError ? (
              <AuthRequiredCard
              title="Realisasi K/L per Fungsi"
              description="Login required to view this data"
            />
          ) : isLoadingRealisasiKLPerFungsi ? (
          <MultipleBarChartSkeleton height={280} />
        ) : (
                <MultipleBarChart
            data={
              realisasiKLPerFungsi?.categories?.map((category, index) => {
                const paguSeries = realisasiKLPerFungsi.series.find(
                  (s) => s.name === "Pagu DIPA"
                );
                const realisasiSeries = realisasiKLPerFungsi.series.find(
                  (s) => s.name === "Realisasi"
                );
                return {
                  name: category,
                  "Pagu DIPA": paguSeries?.data[index] || 0,
                  Realisasi: realisasiSeries?.data[index] || 0,
                };
              }) || []
            }
            title={`Realisasi K/L per Fungsi${
              isLoadingRealisasiKLPerFungsi
                ? " (Loading...)"
                : realisasiKLPerFungsiError
                ? " (Error - Using Fallback)"
                : ""
            }`}
            description={
              realisasiKLPerFungsiError && !isRealisasiKLPerFungsiAuthError
                ? "Error loading data - showing fallback data"
                : "Perbandingan Pagu DIPA vs Realisasi (Triliun Rp)"
            }
            series={[
              { dataKey: "Pagu DIPA", name: "Pagu DIPA", color: "#3b82f6" },
              { dataKey: "Realisasi", name: "Realisasi", color: "#10b981" },
            ]}
            height={280}
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
      {/* Fourth Row: Large Bar Chart */}
      {isPersentaseAuthError ? (
          <AuthRequiredCard
            title="Persentase Realisasi K/L"
            description="Login required to view this data"
          />
      ) : isLoadingPersentaseKL ? (
        <BarChartSkeleton height={360} />
      ) : (
            <BarChart
          data={
            Array.isArray(persentaseKLData) ? persentaseKLData.map((item) => ({
              name: item.kode_ba, // use kode_ba for the X-axis label
              value: item.persentase,
              kode_ba: item.kode_ba,
              nama_ba: item.nama_ba,
            })) : []
          }
          title={`Persentase Realisasi K/L${
            isLoadingPersentaseKL
              ? " (Loading...)"
              : persentaseKLError
              ? " (Error - Using Fallback)"
              : ""
          }`}
          description={
            persentaseKLError && !isPersentaseAuthError
              ? "Error loading data - showing fallback data"
              : "Persentase realisasi terhadap Pagu DIPA per K/L (%)"
          }
          color="#0ea5e9"
          height={360}
          formatValue={(v) => `${Number(v).toFixed(2)}%`}
          // Show kode_ba - nama_ba in tooltip label
          formatTooltipLabel={(d) => `${d.kode_ba} - ${d.nama_ba}`}
          // Rotate x-axis labels to vertical and shrink font
          xTickAngle={-90}
          xTickFontSize={10}
          xAxisHeight={30}
          showAllXTicks
          />
      )}
    </div>
  );
}
