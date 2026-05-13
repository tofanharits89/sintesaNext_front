"use client";

import {
  BarChart,
  Bar,
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
import { useEfektivitasProgram } from "@/features/mbg/hooks/useEfektivitasProgram";
import type { EfektivitasYearItem } from "@/features/mbg/api/services";

function fmtRibuan(n: number): string {
  return n.toLocaleString("id-ID");
}

function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1e12) return `${(n / 1e12).toFixed(2)} T`;
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)} M`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)} jt`;
  return n.toLocaleString("id-ID");
}

function deltaVariant(a: number, b: number) {
  if (b === 0) return null;
  const pct = ((b - a) / a) * 100;
  return { pct, up: pct >= 0 };
}

const COLOR_BAR = "#64748b"; // slate-500 (neutral)
const COLOR_LINE = "#f59e0b"; // amber-500

export function EfektivitasProgramChart() {
  const { data, isLoading } = useEfektivitasProgram();

  if (isLoading) return <ChartCardSkeleton />;
  if (!data || data.items.length === 0) return null;

  const item2025 = data.items.find((r) => r.tahun === "2025");
  const item2026 = data.items.find((r) => r.tahun === "2026");
  const programName = item2025?.nmprogram ?? item2026?.nmprogram ?? "";

  // Chart data: 2 items (one per year)
  const chartData = data.items.map((r: EfektivitasYearItem) => ({
    tahun: r.tahun,
    "Penerima Manfaat": r.penerima_manfaat ?? 0,
    "Efektivitas (%)": r.persentase_efektivitas ?? 0,
    rata: r.rata_realisasi_per_bulan ?? 0,
  }));

  // Delta badges
  const deltaPenerima =
    item2025 && item2026
      ? deltaVariant(item2025.penerima_manfaat, item2026.penerima_manfaat)
      : null;
  const deltaEfektivitas =
    item2025 && item2026
      ? deltaVariant(
          item2025.persentase_efektivitas,
          item2026.persentase_efektivitas,
        )
      : null;

  return (
    <Card className="flex h-full flex-col min-w-0">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-base">Efektivitas Program</CardTitle>
            <CardDescription className="mt-0.5 line-clamp-1">
              {programName || "Makan Bergizi – kddept 128"}
            </CardDescription>
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end">
            {deltaPenerima && (
              <Badge
                variant="outline"
                className={
                  deltaPenerima.up
                    ? "text-xs border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/30"
                    : "text-xs border-rose-300 text-rose-700 bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:bg-rose-950/30"
                }
              >
                Penerima {deltaPenerima.up ? "▲" : "▼"}{" "}
                {Math.abs(deltaPenerima.pct).toFixed(1)}%
              </Badge>
            )}
            {deltaEfektivitas && (
              <Badge
                variant="outline"
                className={
                  deltaEfektivitas.up
                    ? "text-xs border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/30"
                    : "text-xs border-rose-300 text-rose-700 bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:bg-rose-950/30"
                }
              >
                Efektivitas {deltaEfektivitas.up ? "▲" : "▼"}{" "}
                {Math.abs(deltaEfektivitas.pct).toFixed(1)}%
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-6 pt-0 pb-4 min-w-0">
        <div className="flex-1 min-h-[220px] w-full min-w-0 relative">
          <BarChart
            data={chartData}
            xDataKey="tahun"
            margin={{ top: 24, right: 10, left: 10, bottom: 20 }}
            aspectRatio="auto"
            className="h-full w-full"
          >
            <Grid horizontal />
            <Bar
              dataKey="Penerima Manfaat"
              fill={COLOR_BAR}
              lineCap="round"
            />
            <Line
              dataKey="Efektivitas (%)"
              stroke={COLOR_LINE}
              yDomain={[-15, 105]}
              strokeWidth={3}
            />
            <BarXAxis />
            <ChartTooltip
              rows={(point) => [
                {
                  color: COLOR_BAR,
                  label: "Penerima Manfaat",
                  value: fmtRibuan(point["Penerima Manfaat"] as number),
                },
                {
                  color: COLOR_LINE,
                  label: "Efektivitas (%)",
                  value: `${point["Efektivitas (%)"]}%`,
                },
                {
                  color: "#94a3b8",
                  label: "Rata Real/bln",
                  value: fmtCompact(point.rata as number),
                }
              ]}
            />
          </BarChart>
        </div>

        {/* Stat row below chart */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {data.items.map((r) => (
            <div
              key={r.tahun}
              className="rounded-lg border px-3 py-2 text-xs space-y-1"
            >
              <p className="font-semibold text-sm">{r.tahun}</p>
              <div className="flex justify-between text-muted-foreground">
                <span>Penerima</span>
                <span className="font-medium text-foreground">
                  {fmtRibuan(r.penerima_manfaat)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Rata Real/bln</span>
                <span className="font-medium text-foreground">
                  {fmtCompact(r.rata_realisasi_per_bulan)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Efektivitas</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {r.persentase_efektivitas}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
