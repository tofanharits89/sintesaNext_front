"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MBG_INDICATOR_OPTIONS,
  type MapStats,
  type MbgIndicatorKey,
} from "@/features/mbg/types/domain";

export type OverlayScope = "national" | "province" | "regency";

export function MapStatsOverlay({
  scope,
  indicator,
  scopeName,
  stats,
  isLoading,
  error,
}: {
  scope: OverlayScope;
  indicator: MbgIndicatorKey;
  scopeName?: string;
  stats?: MapStats | null;
  isLoading?: boolean;
  error?: string | null;
}) {
  const title =
    scope === "national"
      ? "Statistik Nasional"
      : scope === "province"
      ? `Statistik Provinsi${scopeName ? `: ${scopeName}` : ""}`
      : `Statistik Kabupaten/Kota${scopeName ? `: ${scopeName}` : ""}`;
  const indicatorLabel =
    MBG_INDICATOR_OPTIONS.find((option) => option.value === indicator)?.label ?? "Indikator";
  const indicatorValue = stats ? stats[indicator] : 0;

  return (
    <div className="absolute left-3 bottom-3 z-10 w-[min(92vw,320px)] pointer-events-none">
      <Card className="bg-background/85 backdrop-blur pointer-events-auto border py-1.5 gap-1">
        <CardHeader className="py-1 px-3 gap-0.5">
          <CardTitle className="text-xs">{title}</CardTitle>
          {error && <CardDescription className="text-xs text-red-600">{error}</CardDescription>}
        </CardHeader>
        <CardContent className="py-1 px-3">
          {isLoading ? (
            <div className="text-xs text-muted-foreground">Memuat statistik…</div>
          ) : !stats ? (
            <div className="text-xs text-muted-foreground">Tidak ada data.</div>
          ) : (
            <div className="space-y-1.5">
              <div>
                <div className="text-xs text-muted-foreground">Indikator Aktif</div>
                <div className="text-sm font-medium leading-tight">{indicatorLabel}</div>
                <div className="text-xl font-semibold leading-tight">{indicatorValue.toLocaleString("id-ID")}</div>
              </div>
              {stats.sourceProvinceName && scope !== "national" ? (
                <div className="text-xs text-muted-foreground">
                  Sumber data provinsi: {stats.sourceProvinceName}
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

