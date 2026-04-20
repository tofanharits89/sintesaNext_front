"use client";

import { useMemo } from "react";
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

import { MapSearch } from "@/features/mbg/components/MapSearch";
import { Suspense } from "react";

export default function DashboardMBGPage() {
  // Replace simulated timers with data hooks preserving the same UX timings
  const { data: quickStatsData, isLoading: isQuickStatsLoading } =
    useQuickStats();
  const { data: provRankingsData, isLoading: isRankingLoading } =
    useProvRankings();

  const quickStats = useMemo(() => quickStatsData ?? [], [quickStatsData]);
  const iconByLabel = useMemo(
    () => ({
      "Total SPPG Aktif": Building2,
      "Petugas SPPG": Users,
      "Supplier MBG": Truck,
      "Kelompok Manfaat": Layers3,
      "Penerima Manfaat": UserCheck,
      "Total Mitra": Handshake,
    }),
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard MBG</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan dan analitik Makan Bergizi.
        </p>
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
                  key={i}
                  label={s.label}
                  icon={<Icon className="h-4 w-4 text-blue-500" />}
                  value={String(s.value)}
                  trend={s.trend}
                  trendVariant={(s.variant as any) ?? "neutral"}
                />
              );
            })}
      </div>

      {/* Row 2: Map (75%) + Stats (25%) */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-4">
        <div className="xl:col-span-3">
          <QueryErrorBoundary>
            <Suspense fallback={<MapSearchCardSkeleton className="h-96" />}>
              <MapSearch />
            </Suspense>
          </QueryErrorBoundary>
        </div>
        <div className="xl:col-span-1">
          {isRankingLoading ? (
            <StatsRankingCardSkeleton />
          ) : (
            <StatsRankingCard
              title="Statistik Wilayah"
              tabs={[
                {
                  key: "penerima",
                  label: "Penerima",
                  items: provRankingsData?.penerima ?? [],
                },
                {
                  key: "sppg",
                  label: "SPPG",
                  items: provRankingsData?.sppg ?? [],
                },
                {
                  key: "petugas",
                  label: "Petugas",
                  items: provRankingsData?.petugas ?? [],
                },
              ]}
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
