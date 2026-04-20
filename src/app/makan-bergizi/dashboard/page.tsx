"use client";

import { useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { MapSearch } from "@/features/mbg/components/MapSearch";
import { Suspense } from "react";

export default function DashboardMBGPage() {
  const [year, setYear] = useState("2026");

  const { data: quickStatsData, isLoading: isQuickStatsLoading } =
    useQuickStats(year);
  const { data: provRankingsData, isLoading: isRankingLoading } =
    useProvRankings(year);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard MBG</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan dan analitik Makan Bergizi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Tahun:</span>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="Pilih Tahun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>
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
                />
              );
            })}
      </div>

      {/* Row 2: Map (75%) + Stats (25%) */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-4">
        <div className="xl:col-span-3">
          <QueryErrorBoundary>
            <Suspense fallback={<MapSearchCardSkeleton className="h-96" />}>
              <MapSearch year={year} />
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
