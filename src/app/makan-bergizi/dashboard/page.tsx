"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { QuickStatCard } from "@/components/mbg/QuickStatCard";
import { StatsRankingCard } from "@/components/mbg/StatsRankingCard";
import { PlaceholderChartCard } from "@/components/mbg/PlaceholderChartCard";
import { BgnTrendChart } from "@/components/mbg/BgnTrendChart";
import { SebaranPenerimaChart } from "@/components/mbg/SebaranPenerimaChart";
import { EfektivitasProgramChart } from "@/components/mbg/EfektivitasProgramChart";
import {
  Building2,
  Users,
  Truck,
  Layers3,
  UserCheck,
  Handshake,
  CircleDashed,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { QueryErrorBoundary } from "@/components/ui/query-error-boundary";
import {
  QuickStatCardSkeleton,
  MapSearchCardSkeleton,
  StatsRankingCardSkeleton,
  ChartCardSkeleton,
} from "@/components/ui/dashboard-skeletons";
import { useQuickStats } from "@/features/mbg/hooks/useQuickStats";
import { useProvRankings } from "@/features/mbg/hooks/useProvRankings";
import { useKabRankings } from "@/features/mbg/hooks/useKabRankings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/httpClient";
import { toast } from "sonner";
import { formatJakartaDateTime } from "@/utils/formatters";

import { MapSearch } from "@/features/mbg/components/MapSearch";
import { Suspense } from "react";
import type { MbgIndicatorKey } from "@/features/mbg/types/domain";

export default function DashboardMBGPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [year, setYear] = useState("2026");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshText, setLastRefreshText] = useState<string>("");

  // Province selection lifted from MapSearch so StatsRankingCard can react to it
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("");
  const [selectedProvinceName, setSelectedProvinceName] = useState<string>("");
  // Indicator selection lifted from MapSearch so StatsRankingCard can react to it
  const [selectedIndicator, setSelectedIndicator] = useState<MbgIndicatorKey>("jumlahpenerima");

  const handleProvinceChange = useCallback((id: string, name: string) => {
    setSelectedProvinceId(id);
    setSelectedProvinceName(name);
  }, []);

  const handleIndicatorChange = useCallback((indicator: MbgIndicatorKey) => {
    setSelectedIndicator(indicator);
  }, []);

  const { data: quickStatsResponse, isLoading: isQuickStatsLoading } =
    useQuickStats(year);
  const { data: provRankingsData, isLoading: isRankingLoading } =
    useProvRankings(year);
  const { data: kabRankingsData, isLoading: isKabRankingLoading } =
    useKabRankings(selectedProvinceName, year);

  const quickStats = useMemo(() => quickStatsResponse?.data ?? [], [quickStatsResponse]);
  const lastRefreshJakarta = quickStatsResponse?._meta?.asOfJakarta;

  const userRole = String(user?.role || "").toLowerCase();
  const canRefresh = userRole === "super_admin" || userRole === "co_admin";

  useEffect(() => {
    if (lastRefreshJakarta) {
      setLastRefreshText(formatJakartaDateTime(lastRefreshJakarta));
    }
  }, [lastRefreshJakarta]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Invalidate backend (Redis) cache
      await apiClient.post("/cache/invalidate/dashboard");

      // Invalidate client-side React Query caches for MBG
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["financial", "mbg"] }),
      ]);

      toast.success("Data dashboard berhasil diperbarui");
    } catch (error: any) {
      console.error("Dashboard refresh failed:", error);
      toast.error(error?.message || "Gagal memperbarui data dashboard");
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  const iconByLabel = useMemo(
    () => ({
      "Penerima Manfaat": UserCheck,
      "Total SPPG Aktif": Building2,
      "Petugas SPPG": Users,
      "Supplier MBG": Truck,
      "Kelompok Manfaat": Layers3,
      "Total Mitra": Handshake,
    }),
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard MBG</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan dan analitik Makan Bergizi.
          </p>
          {lastRefreshText && (
            <p className="text-xs text-muted-foreground mt-1">
              Terakhir diperbarui: {lastRefreshText}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Tahun:</span>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[100px] h-9">
                <SelectValue placeholder="Pilih Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {canRefresh && (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh data (invalidate cache)"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>
      </div>

      {/* Row 1: Quick Stats (6 cards) */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {isQuickStatsLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <QuickStatCardSkeleton key={`skeleton-${i}`} />
            ))
          : quickStats.map((s: any, i: number) => {
              const Icon =
                iconByLabel[s.label as keyof typeof iconByLabel] ??
                CircleDashed;
              return (
                <QuickStatCard
                  key={`${year}-${i}`}
                  label={s.label}
                  icon={<Icon className="h-4 w-4 text-blue-500" />}
                  value={String(s.value)}
                  trend={s.trend}
                  trendVariant={(s.variant as any) ?? "neutral"}
                  breakdown={s.breakdown}
                />
              );
            })}
      </div>

      {/* Row 2: Map (75%) + Stats (25%) */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-4">
        <div className="xl:col-span-3">
          <QueryErrorBoundary>
            <Suspense fallback={<MapSearchCardSkeleton className="h-96" />}>
              <MapSearch
                year={year}
                provinceId={selectedProvinceId}
                onProvinceChange={handleProvinceChange}
                indicator={selectedIndicator}
                onIndicatorChange={handleIndicatorChange}
              />
            </Suspense>
          </QueryErrorBoundary>
        </div>
        <div className="xl:col-span-1">
          {isRankingLoading || (selectedProvinceName && isKabRankingLoading) ? (
            <StatsRankingCardSkeleton />
          ) : (
            <StatsRankingCard
              title={selectedProvinceName ? `Statistik: ${selectedProvinceName}` : "Statistik Wilayah"}
              tabs={(() => {
                const rankingData = selectedProvinceName ? kabRankingsData : provRankingsData;

                if (selectedIndicator === "jumlahsppg") {
                  return [{ key: "sppg", label: "SPPG", items: rankingData?.sppg ?? [] }];
                }
                if (selectedIndicator === "jumlahpetugas") {
                  return [{ key: "petugas", label: "Petugas", items: rankingData?.petugas ?? [] }];
                }
                if (selectedIndicator === "jumlahsupplier") {
                  return [{ key: "supplier", label: "Supplier", items: rankingData?.supplier ?? [] }];
                }
                if (selectedIndicator === "jumlahkelompok") {
                  return [{ key: "kelompok", label: "Kelompok", items: rankingData?.kelompok ?? [] }];
                }
                if (selectedIndicator === "jumlahmitra") {
                  return [{ key: "mitra", label: "Mitra", items: rankingData?.mitra ?? [] }];
                }
                // Default: jumlahpenerima
                return [{ key: "penerima", label: "Penerima", items: rankingData?.penerima ?? [] }];
              })()}
            />
          )}
        </div>
      </div>

      {/* Row 3: charts */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <BgnTrendChart />
        <SebaranPenerimaChart />
        <EfektivitasProgramChart />
      </div>
    </div>
  );
}
