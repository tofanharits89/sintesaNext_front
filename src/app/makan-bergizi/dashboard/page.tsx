"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { QuickStatCard } from "@/components/mbg/QuickStatCard";
import { StatsRankingCard } from "@/components/mbg/StatsRankingCard";
import { PlaceholderChartCard } from "@/components/mbg/PlaceholderChartCard";
import { QueryErrorBoundary } from "@/components/ui/query-error-boundary";
import {
  QuickStatCardSkeleton,
  MapSearchCardSkeleton,
  StatsRankingCardSkeleton,
  ChartCardSkeleton,
} from "@/components/ui/dashboard-skeletons";
import { useQuickStats } from "@/features/mbg/hooks/useQuickStats";
import { useRankings } from "@/features/mbg/hooks/useRankings";
import { useChartsReady } from "@/features/mbg/hooks/useChartsReady";

import { MapView } from "@/components/lazy";
import { Suspense } from "react";

export default function DashboardMBGPage() {
  // Replace simulated timers with data hooks preserving the same UX timings
  const { data: quickStatsData, isLoading: isQuickStatsLoading } = useQuickStats();
  const { data: rankingsData, isLoading: isRankingLoading } = useRankings();
  const { isLoading: isChartsLoading } = useChartsReady();

  const quickStats = useMemo(() => quickStatsData ?? [], [quickStatsData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard MBG</h1>
        <p className="text-sm text-muted-foreground">Ringkasan dan analitik Makan Bergizi.</p>
      </div>

      {/* Row 1: Quick Stats (5 cards) */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {isQuickStatsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <QuickStatCardSkeleton key={`skeleton-${i}`} />
          ))
        ) : (
          quickStats.map((s: any, i: number) => (
            <QuickStatCard
              key={i}
              label={s.label}
              value={String(s.value)}
              trend={s.trend}
              trendVariant={(s.variant as any) ?? "neutral"}
            />
          ))
        )}
      </div>

      {/* Row 2: Map (75%) + Stats (25%) */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-4">
        <div className="xl:col-span-3">
          <QueryErrorBoundary>
            <Suspense fallback={<MapSearchCardSkeleton className="h-96" />}>
              <MapView />
            </Suspense>
          </QueryErrorBoundary>
        </div>
        <div className="xl:col-span-1">
          {isRankingLoading ? (
            <StatsRankingCardSkeleton />
          ) : (
            <StatsRankingCard
              title="Statistik Wilayah"
              topItems={rankingsData?.top5 ?? []}
              bottomItems={rankingsData?.bottom5 ?? []}
            />
          )}
        </div>
      </div>

      {/* Row 3: 3 placeholder charts */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isChartsLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <ChartCardSkeleton key={`chart-skeleton-${i}`} />
          ))
        ) : (
          <>
            <PlaceholderChartCard title="Tren Realisasi MBG" description="Per bulan" />
            <PlaceholderChartCard title="Sebaran Penerima" description="Per wilayah" />
            <PlaceholderChartCard title="Efektivitas Program" description="Indikator kunci" />
          </>
        )}
      </div>
    </div>
  );
}

