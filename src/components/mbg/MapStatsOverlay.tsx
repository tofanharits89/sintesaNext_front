"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type OverlayScope = "national" | "province" | "regency";

export type OverlayStats = {
  totalAllocation: number;
  totalRealization: number;
  beneficiaries: number;
  coveragePct: number; // 0-100
};

export function MapStatsOverlay({
  scope,
  scopeName,
  stats,
  isLoading,
  error,
}: {
  scope: OverlayScope;
  scopeName?: string;
  stats?: OverlayStats;
  isLoading?: boolean;
  error?: string | null;
}) {
  const title =
    scope === "national"
      ? "Statistik Nasional"
      : scope === "province"
      ? `Statistik Provinsi${scopeName ? `: ${scopeName}` : ""}`
      : `Statistik Kabupaten/Kota${scopeName ? `: ${scopeName}` : ""}`;

  return (
    <div className="absolute left-3 bottom-3 z-10 w-[min(92vw,360px)] pointer-events-none">
      <Card className="bg-background/85 backdrop-blur pointer-events-auto border">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">{title}</CardTitle>
          {error && <CardDescription className="text-red-600">{error}</CardDescription>}
        </CardHeader>
        <CardContent className="py-3">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Memuat statistik…</div>
          ) : !stats ? (
            <div className="text-sm text-muted-foreground">Tidak ada data.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Total Alokasi</div>
                <div className="font-semibold">{stats.totalAllocation.toLocaleString("id-ID")}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Realisasi</div>
                <div className="font-semibold">{stats.totalRealization.toLocaleString("id-ID")}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Penerima Manfaat</div>
                <div className="font-semibold">{stats.beneficiaries.toLocaleString("id-ID")}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Cakupan</div>
                <div className="font-semibold">{stats.coveragePct.toFixed(1)}%</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

