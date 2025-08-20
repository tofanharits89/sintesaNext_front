"use client";

import { QuickStatCard } from "@/components/mbg/QuickStatCard";
import { MapSearchCard } from "@/components/mbg/MapSearchCard";
import { StatsRankingCard } from "@/components/mbg/StatsRankingCard";
import { PlaceholderChartCard } from "@/components/mbg/PlaceholderChartCard";

export default function DashboardMBGPage() {
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
        {quickStats.map((s, i) => (
          <QuickStatCard key={i} label={s.label} value={s.value} trend={s.trend} trendVariant={s.variant} />
        ))}
      </div>

      {/* Row 2: Map (75%) + Stats (25%) */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-4">
        <div className="xl:col-span-3">
          <MapSearchCard />
        </div>
        <div className="xl:col-span-1">
          <StatsRankingCard title="Statistik Wilayah" topItems={top5} bottomItems={bottom5} />
        </div>
      </div>

      {/* Row 3: 3 placeholder charts */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <PlaceholderChartCard title="Tren Realisasi MBG" description="Per bulan" />
        <PlaceholderChartCard title="Sebaran Penerima" description="Per wilayah" />
        <PlaceholderChartCard title="Efektivitas Program" description="Indikator kunci" />
      </div>
    </div>
  );
}

