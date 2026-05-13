"use client";

import { useMemo } from "react";
import {
  BarChart,
  Line,
  BarXAxis,
  Grid,
} from "@/components/charts";
import { ChartTooltip } from "@/components/charts/tooltip";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartCardSkeleton } from "@/components/ui/dashboard-skeletons";
import { useRealisasiBgn } from "@/features/mbg/hooks/useRealisasiBgn";

function fmtT(val: number | null | undefined): string {
  if (val === null || val === undefined || !isFinite(Number(val))) return "–";
  const n = Number(val);
  if (Math.abs(n) >= 1e12) return `${(n / 1e12).toFixed(2)} T`;
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)} M`;
  return n.toLocaleString("id-ID");
}

function pctStr(realized: number | null | undefined, pagu: number): string {
  if (!realized || !pagu) return "";
  return ` (${((realized / pagu) * 100).toFixed(1)}%)`;
}

const COLOR_2025 = "#94a3b8"; // slate-400
const COLOR_2026 = "#0f172a"; // slate-900

export function BgnTrendChart() {
  const { data, isLoading } = useRealisasiBgn();

  const lastRealisasi2025 = useMemo(() => {
    if (!data) return null;
    return (
      [...data.months]
        .reverse()
        .find((m) => m.realisasi2025 !== null && m.realisasi2025 > 0)
        ?.realisasi2025 ?? null
    );
  }, [data]);

  const lastRealisasi2026 = useMemo(() => {
    if (!data) return null;
    return (
      [...data.months]
        .reverse()
        .find((m) => m.realisasi2026 !== null && m.realisasi2026 > 0)
        ?.realisasi2026 ?? null
    );
  }, [data]);

  if (isLoading) return <ChartCardSkeleton />;
  if (!data) return null;

  // Keep nulls so Line component skips future months (no drop to zero)
  const chartData = data.months.map((m) => ({
    name: m.month,
    "Realisasi 2025": m.realisasi2025 as number | null,
    "Realisasi 2026": m.realisasi2026 as number | null,
  }));

  // Compute proper y-domain from actual values + pagu
  const allValues = data.months.flatMap((m) =>
    [m.realisasi2025, m.realisasi2026].filter((v): v is number => v !== null && v > 0)
  );
  const maxVal = Math.max(...allValues, 1);
  const yDomain: [number, number] = [0, maxVal * 1.02];

  return (
    <Card className="flex h-full flex-col min-w-0">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-base">Tren Realisasi BGN</CardTitle>
            <CardDescription>
              Kumulatif per bulan (Badan Gizi Nasional)
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-0.5 text-xs text-muted-foreground shrink-0">
            <span>
              Pagu 2025:{" "}
              <span className="font-medium text-foreground">
                {fmtT(data.pagu2025)}
              </span>
            </span>
            <span>
              Pagu 2026:{" "}
              <span className="font-medium text-foreground">
                {fmtT(data.pagu2026)}
              </span>
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap mt-1">
          {lastRealisasi2025 !== null && (
            <Badge
              variant="outline"
              className="text-xs border-slate-300 text-slate-700 bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:bg-slate-950/30"
            >
              2025: {fmtT(lastRealisasi2025)}
              {pctStr(lastRealisasi2025, data.pagu2025)}
            </Badge>
          )}
          {lastRealisasi2026 !== null && (
            <Badge
              variant="outline"
              className="text-xs border-slate-400 text-slate-900 bg-slate-100 dark:border-slate-500 dark:text-slate-200 dark:bg-slate-900/40"
            >
              2026 s.d. terkini: {fmtT(lastRealisasi2026)}
              {pctStr(lastRealisasi2026, data.pagu2026)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-6 pt-0 pb-4 min-w-0">
        <div className="flex-1 min-h-[248px] w-full min-w-0 relative">
          <BarChart
            data={chartData}
            xDataKey="name"
            margin={{ top: 24, right: 10, left: 10, bottom: 20 }}
            aspectRatio="auto"
            className="h-full w-full"
            barGap={0.1}
          >
            <Grid horizontal />
            <Line
              dataKey="Realisasi 2025"
              stroke={COLOR_2025}
              strokeWidth={2.5}
              yDomain={yDomain}
            />
            <Line
              dataKey="Realisasi 2026"
              stroke={COLOR_2026}
              strokeWidth={2.5}
              yDomain={yDomain}
            />
            <BarXAxis showAllLabels />
            <ChartTooltip
              rows={(point) => [
                {
                  color: COLOR_2025,
                  label: "Realisasi 2025",
                  value: fmtT(point["Realisasi 2025"] as number),
                },
                {
                  color: COLOR_2026,
                  label: "Realisasi 2026",
                  value: fmtT(point["Realisasi 2026"] as number),
                },
              ]}
            />
          </BarChart>
        </div>
      </CardContent>
    </Card>
  );
}
