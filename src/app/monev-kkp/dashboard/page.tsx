"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { QuickStatCard } from "@/components/mbg/QuickStatCard";
import { StatsRankingCard } from "@/components/mbg/StatsRankingCard";
import { RankingBarChart } from "@/components/monev-kkp/dashboard/RankingBarChart";
import { BankDistributionChart } from "@/components/monev-kkp/dashboard/BankDistributionChart";
import { KkpSankeyChart } from "@/components/monev-kkp/dashboard/KkpSankeyChart";
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
  RefreshCw,
} from "lucide-react";
import {
  QuickStatCardSkeleton,
  StatsRankingCardSkeleton,
  ChartCardSkeleton,
} from "@/components/ui/dashboard-skeletons";
import { useAuth } from "@/hooks/useAuth";
import { useKkpDashboard } from "@/features/monev-kkp/hooks/useKkpDashboard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/httpClient";
import { Button } from "@/components/ui/button";

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

// Component to prevent hydration mismatch
function NoSSR({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? <>{children}</> : null;
}

const formatKkpValue = (val: number): string => {
  const v = Math.abs(val);
  if (v >= 1e9) return `${(val / 1e9).toFixed(1)} M`;
  if (v >= 1e6) return `${(val / 1e6).toFixed(0)} Jt`;
  return val.toLocaleString("id-ID");
};

export default function DashboardMonevKkpPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const initial = getInitialPeriode();
  const [year, setYear] = useState(initial.year);
  const [triwulan, setTriwulan] = useState(initial.triwulan);
  const [filterScope, setFilterScope] = useState<"all" | "local">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const userRole = String(user?.role || "").toLowerCase();
  const isKppnUser = userRole === "kppn" || userRole === "3";
  const isKanwilUser =
    userRole === "kanwil_djpb" ||
    userRole === "kanwil" ||
    userRole === "2" ||
    userRole.includes("kanwil");

  const canRefresh = userRole === "super_admin" || userRole === "co_admin";

  const showScopeFilter = isKppnUser || isKanwilUser;

  // Calculate query parameters based on selected scope
  // We pass 'all' to signal the backend to bypass RBAC restrictions for KPPN/Kanwil users
  const kdkanwilQuery = (filterScope === "all" ? "all" : (isKanwilUser ? (user?.kdkanwil ?? undefined) : undefined));
  const kdkppnQuery = (filterScope === "all" ? "all" : (isKppnUser ? (user?.kdkppn ?? undefined) : undefined));

  const { data, isLoading, error } = useKkpDashboard(year, triwulan, kdkanwilQuery, kdkppnQuery);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Clear backend cache
      await apiClient.post("/cache/invalidate/monev-kkp");

      // 2. Clear frontend cache (force refetch)
      await queryClient.invalidateQueries({
        queryKey: ["monev-kkp", "dashboard"],
      });

      toast.success("Cache berhasil dibersihkan", {
        description: "Data dashboard sedang diperbarui dari server.",
      });
    } catch (err) {
      console.error("Refresh error:", err);
      toast.error("Gagal melakukan refresh cache");
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  useEffect(() => {
    if (error) {
      const msg = error instanceof Error ? error.message : "Gagal memuat data dashboard";
      const isConnReset = msg.toLowerCase().includes("econnreset") || msg.toLowerCase().includes("network error");

      if (isConnReset) {
        toast.error("Koneksi ke server terputus", {
          description: "Data terlalu besar atau server sibuk. Kami sedang mencoba memulihkan koneksi.",
        });
      } else {
        toast.error("Gagal memuat data", {
          description: msg,
        });
      }
    }
  }, [error]);

  const formatKanwilName = (name: string) => {
    if (!name) return "";
    if (name.toUpperCase().startsWith("KANWIL DJPB")) return name;
    return `Kanwil DJPb ${name}`;
  };

  const unitLabel = isKanwilUser
    ? (user?.nmkanwil ? formatKanwilName(user.nmkanwil) : `Kanwil DJPb ${user?.kdkanwil || ""}`)
    : (user?.nmkppn || `KPPN ${user?.kdkppn || ""}`);

  const quickStats = useMemo(() => data?.quickStats ?? [], [data]);
  const kppnRankings = useMemo(() => data?.kppnRankings, [data]);
  const transaksiPerKL = useMemo(
    () =>
      (data?.transaksiPerKL ?? []).map((item) => ({
        name: `${item.kddept} - ${item.nmdept}`,
        value: item.totalTransaksi,
      })),
    [data],
  );
  const transaksiPerSatker = useMemo(
    () =>
      (data?.transaksiPerSatker ?? []).map((item) => ({
        name: `${item.kdsatker} - ${item.nmsatker}`,
        value: item.totalTransaksi,
      })),
    [data],
  );
  const bankDistribution = useMemo(() => data?.bankDistribution ?? [], [data]);
  const kendalaStats = useMemo(() => data?.kendalaStats ?? [], [data]);
  const detilKendalaWords = useMemo(() => data?.detilKendalaWords ?? [], [data]);

  const lastRefreshText = data?._meta?.asOfJakarta
    ? new Date(data._meta.asOfJakarta).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    })
    : "-";

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
          <p className="text-xs text-muted-foreground mt-1">
            Terakhir diperbarui: <NoSSR>{lastRefreshText}</NoSSR>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {showScopeFilter && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Kanwil:</span>
              <Select value={filterScope} onValueChange={(val: "all" | "local") => setFilterScope(val)}>
                <SelectTrigger className="w-[240px] h-9">
                  <SelectValue placeholder="Pilih Kanwil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kanwil (Nasional)</SelectItem>
                  <SelectItem value="local">
                    {unitLabel}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tahun:</span>
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
            <span className="text-sm text-muted-foreground">Periode:</span>
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

          {canRefresh && (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              title="Refresh data (invalidate cache)"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>
          )}
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
                    className={`h-4 w-4 ${s.variant === "down"
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

      {/* Row 2: Transaksi Charts (KL & Satker) + Rankings */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-4">
        <div className="xl:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RankingBarChart
            title="Top 10 Kementerian/Lembaga"
            description="Nilai transaksi kumulatif per K/L"
            data={transaksiPerKL}
            isLoading={isLoading}
          />
          <RankingBarChart
            title="Top 10 Satker"
            description="Nilai transaksi kumulatif per Satker"
            data={transaksiPerSatker}
            isLoading={isLoading}
          />
        </div>
        <div className="xl:col-span-1">
          {isLoading ? (
            <StatsRankingCardSkeleton />
          ) : (
            <StatsRankingCard
              title="Statistik KPPN"
              tabs={[
                {
                  key: "tagihan",
                  label: "Tagihan",
                  valuePrefix: "Rp ",
                  valueFormatter: formatKkpValue,
                  items: kppnRankings?.tagihan ?? [],
                },
                {
                  key: "transaksi",
                  label: "Transaksi",
                  valuePrefix: "Rp ",
                  valueFormatter: formatKkpValue,
                  items: kppnRankings?.transaksi ?? [],
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
        {/* Row 3: Bank Distribution + Sankey */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <BankDistributionChart data={bankDistribution} isLoading={isLoading} />
          </div>
          <div className="lg:col-span-2">
            <KkpSankeyChart
              year={year}
              triwulan={triwulan}
              kdkanwil={kdkanwilQuery}
              kdkppn={kdkppnQuery}
            />
          </div>
        </div>

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
