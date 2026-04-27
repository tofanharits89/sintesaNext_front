"use client";

import { useMemo, useState } from "react";
import { QuickStatCard } from "@/components/mbg/QuickStatCard";
import { StatsRankingCard } from "@/components/mbg/StatsRankingCard";
import { TransaksiKppnChart } from "@/components/monev-kkp/dashboard/TransaksiKppnChart";
import { BankDistributionChart } from "@/components/monev-kkp/dashboard/BankDistributionChart";
import { KendalaDistributionChart } from "@/components/monev-kkp/dashboard/KendalaDistributionChart";
import { DetilKendalaWordCloud } from "@/components/monev-kkp/dashboard/DetilKendalaWordCloud";
import {
  Building2,
  CreditCard,
  Banknote,
  Receipt,
  TrendingUp,
  AlertTriangle,
  CircleDashed,
  Calendar,
} from "lucide-react";
import {
  QuickStatCardSkeleton,
  StatsRankingCardSkeleton,
  ChartCardSkeleton,
} from "@/components/ui/dashboard-skeletons";
import { useKkpDashboard } from "@/features/monev-kkp/hooks/useKkpDashboard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const iconByLabel: Record<string, React.ComponentType<{ className?: string }>> =
  {
    "Total Satker KKP": Building2,
    "Total Kartu KKP": CreditCard,
    "Total Nilai UP KKP": Banknote,
    "Total Nilai Tagihan": Receipt,
    "Total Transaksi SP2D": TrendingUp,
    "Satker Belum Transaksi": AlertTriangle,
  };

/** Get default previous triwulan */
function getInitialPeriode() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const currentQ = Math.ceil(currentMonth / 3);

  let prevQ = currentQ - 1;
  let prevYear = currentYear;

  if (prevQ === 0) {
    prevQ = 4;
    prevYear = currentYear - 1;
  }

  return {
    year: String(prevYear),
    triwulan: String(prevQ),
  };
}

const periodes = [
  { value: "1", label: "Triwulan 1 (Jan - Mar)" },
  { value: "2", label: "Triwulan 2 (Jan - Jun)" },
  { value: "3", label: "Triwulan 3 (Jan - Sep)" },
  { value: "4", label: "Triwulan 4 (Jan - Des)" },
];

export default function DashboardMonevKkpPage() {
  const initial = getInitialPeriode();
  const [year, setYear] = useState(initial.year);
  const [triwulan, setTriwulan] = useState(initial.triwulan);

  const { data, isLoading } = useKkpDashboard(year, triwulan);

  const quickStats = useMemo(() => data?.quickStats ?? [], [data]);
  const kppnRankings = useMemo(() => data?.kppnRankings, [data]);
  const transaksiPerKppn = useMemo(() => data?.transaksiPerKppn ?? [], [data]);
  const bankDistribution = useMemo(() => data?.bankDistribution ?? [], [data]);
  const kendalaStats = useMemo(() => data?.kendalaStats ?? [], [data]);
  const detilKendalaWords = useMemo(() => data?.detilKendalaWords ?? [], [data]);

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard Monev KKP
          </h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan dan analitik Monitoring Kartu Kredit Pemerintah.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Tahun:</span>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[100px] h-9">
                <SelectValue placeholder="Pilih Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Periode:</span>
            <Select value={triwulan} onValueChange={setTriwulan}>
              <SelectTrigger className="w-[200px] h-9">
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent>
                {periodes.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Row 1: Quick Stats (6 cards) */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <QuickStatCardSkeleton key={`skeleton-${i}`} />
            ))
          : quickStats.map((s, i) => {
              const Icon =
                iconByLabel[s.label as keyof typeof iconByLabel] ??
                CircleDashed;
              return (
                <QuickStatCard
                  key={`${year}-${triwulan}-${i}`}
                  label={s.label}
                  icon={
                    <Icon
                      className={`h-4 w-4 ${
                        s.variant === "down"
                          ? "text-red-500"
                          : s.variant === "up"
                            ? "text-green-500"
                            : "text-blue-500"
                      }`}
                    />
                  }
                  value={s.value}
                  trendVariant={s.variant ?? "neutral"}
                />
              );
            })}
      </div>

      {/* Row 2: Transaksi Chart (75%) + Rankings (25%) */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-4">
        <div className="xl:col-span-3">
          <TransaksiKppnChart data={transaksiPerKppn} isLoading={isLoading} />
        </div>
        <div className="xl:col-span-1">
          {isLoading ? (
            <StatsRankingCardSkeleton />
          ) : (
            <StatsRankingCard
              title="Statistik KPPN"
              tabs={[
                {
                  key: "transaksi",
                  label: "Transaksi",
                  items: (kppnRankings?.transaksi ?? []).map((item) => ({
                    ...item,
                    value: Math.round(item.value / 1e6), // Show in millions for readability
                  })),
                },
                {
                  key: "tagihan",
                  label: "Tagihan",
                  items: (kppnRankings?.tagihan ?? []).map((item) => ({
                    ...item,
                    value: Math.round(item.value / 1e6),
                  })),
                },
                {
                  key: "kartu",
                  label: "Kartu",
                  items: kppnRankings?.kartu ?? [],
                },
              ]}
            />
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {/* Row 3: Bank Distribution */}
        <BankDistributionChart data={bankDistribution} isLoading={isLoading} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Row 4: Kategori Kendala Word Cloud */}
          <KendalaDistributionChart data={kendalaStats} isLoading={isLoading} />
  
          {/* Row 5: Detil Kendala Word Cloud */}
          <DetilKendalaWordCloud data={detilKendalaWords} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
