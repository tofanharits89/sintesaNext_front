"use client";

import { useState, useEffect } from "react";
import { QuickStatCard } from "@/components/mbg/QuickStatCard";
import { MapSearchCard } from "@/components/mbg/MapSearchCard";
import { StatsRankingCard } from "@/components/mbg/StatsRankingCard";
import { PlaceholderChartCard } from "@/components/mbg/PlaceholderChartCard";
import {
  QuickStatCardSkeleton,
  MapSearchCardSkeleton,
  StatsRankingCardSkeleton,
  ChartCardSkeleton,
} from "@/components/ui/dashboard-skeletons";

export default function DashboardMBGPage() {
  // Loading states for different sections
  const [isQuickStatsLoading, setIsQuickStatsLoading] = useState(true);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isRankingLoading, setIsRankingLoading] = useState(true);
  const [isChartsLoading, setIsChartsLoading] = useState(true);

  // Simulate data loading with different timing for each section
  useEffect(() => {
    // Quick stats load first (1.5s)
    const quickStatsTimer = setTimeout(() => {
      setIsQuickStatsLoading(false);
    }, 1500);

    // Map loads second (2s)
    const mapTimer = setTimeout(() => {
      setIsMapLoading(false);
    }, 2000);

    // Ranking loads third (2.5s)
    const rankingTimer = setTimeout(() => {
      setIsRankingLoading(false);
    }, 2500);

    // Charts load last (3s)
    const chartsTimer = setTimeout(() => {
      setIsChartsLoading(false);
    }, 3000);

    return () => {
      clearTimeout(quickStatsTimer);
      clearTimeout(mapTimer);
      clearTimeout(rankingTimer);
      clearTimeout(chartsTimer);
    };
  }, []);

  // Sample quick stats. Replace with real data hooks later.
  const quickStats = [
    { label: "Total Alokasi", value: "Rp 1.250 M", trend: "+5.2%", variant: "up" as const },
    { label: "Total Realisasi", value: "Rp 980 M", trend: "+3.1%", variant: "up" as const },
    { label: "Serapan (%)", value: "78,4%", trend: "+1,0%", variant: "up" as const },
    { label: "Penerima Manfaat", value: "2.450.120", trend: "-0,3%", variant: "down" as const },
    { label: "Kab/Kota Aktif", value: "415", trend: "+2", variant: "neutral" as const },
  ];

  const top5 = [
    { name: "DKI Jakarta", value: 125_000 },
    { name: "Jawa Barat", value: 112_000 },
    { name: "Jawa Timur", value: 97_500 },
    { name: "Sumatera Utara", value: 84_200 },
    { name: "Riau", value: 70_900 },
  ];

  const bottom5 = [
    { name: "Maluku Utara", value: 12_300 },
    { name: "Gorontalo", value: 13_100 },
    { name: "Sulawesi Barat", value: 14_900 },
    { name: "Papua Barat Daya", value: 15_200 },
    { name: "Papua Pegunungan", value: 16_500 },
  ];

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
          quickStats.map((s, i) => (
            <QuickStatCard key={i} label={s.label} value={s.value} trend={s.trend} trendVariant={s.variant} />
          ))
        )}
      </div>

      {/* Row 2: Map (75%) + Stats (25%) */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-4">
        <div className="xl:col-span-3">
          {isMapLoading ? (
            <MapSearchCardSkeleton className="h-96" />
          ) : (
            <MapSearchCard />
          )}
        </div>
        <div className="xl:col-span-1">
          {isRankingLoading ? (
            <StatsRankingCardSkeleton />
          ) : (
            <StatsRankingCard title="Statistik Wilayah" topItems={top5} bottomItems={bottom5} />
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

