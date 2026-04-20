"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
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

const COLOR_BAR = "#3b82f6"; // blue-500
const COLOR_LINE = "#f59e0b"; // amber-500

export function EfektivitasProgramChart() {
  const { data, isLoading } = useEfektivitasProgram();

  if (isLoading) return <ChartCardSkeleton />;
  if (!data || data.items.length === 0) return null;

  const item2025 = data.items.find((r) => r.tahun === "2025");
  const item2026 = data.items.find((r) => r.tahun === "2026");
  const programName = item2025?.nmprogram ?? item2026?.nmprogram ?? "";

  // Chart data: 2 bars (one per year)
  const chartData = data.items.map((r: EfektivitasYearItem) => ({
    tahun: r.tahun,
    "Penerima Manfaat": r.penerima_manfaat,
    "Efektivitas (%)": r.persentase_efektivitas,
    rata: r.rata_realisasi_per_bulan,
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
    <Card className="h-full">
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
      <CardContent>
        <ResponsiveContainer width="100%" height={220} minWidth={0}>
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 48, left: 8, bottom: 0 }}
            barCategoryGap="40%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e5e7eb"
            />
            <XAxis
              dataKey="tahun"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              stroke="#888"
            />
            {/* Left Y-axis: penerima manfaat */}
            <YAxis
              yAxisId="left"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              stroke="#888"
              tickFormatter={(v) => fmtCompact(v as number)}
              width={46}
            />
            {/* Right Y-axis: efektivitas % */}
            <YAxis
              yAxisId="right"
              orientation="right"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              stroke={COLOR_LINE}
              tickFormatter={(v) => `${v}%`}
              width={44}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = data.items.find((r) => r.tahun === label);
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm text-sm min-w-[210px]">
                    <p className="text-xs font-semibold text-foreground mb-1.5">
                      Tahun {label}
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: COLOR_BAR }}
                        />
                        <span className="text-muted-foreground">Penerima:</span>
                        <span className="font-medium ml-auto">
                          {fmtRibuan(d?.penerima_manfaat ?? 0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: COLOR_LINE }}
                        />
                        <span className="text-muted-foreground">
                          Efektivitas:
                        </span>
                        <span className="font-medium ml-auto">
                          {d?.persentase_efektivitas ?? 0}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-sm shrink-0 bg-slate-400" />
                        <span className="text-muted-foreground">
                          Rata Real/bln:
                        </span>
                        <span className="font-medium ml-auto">
                          {fmtCompact(d?.rata_realisasi_per_bulan ?? 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
              formatter={(value) => value}
            />
            <Bar
              yAxisId="left"
              dataKey="Penerima Manfaat"
              fill={COLOR_BAR}
              radius={[4, 4, 0, 0]}
              maxBarSize={64}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="Efektivitas (%)"
              stroke={COLOR_LINE}
              strokeWidth={2.5}
              dot={{ r: 5, fill: COLOR_LINE }}
              activeDot={{ r: 7 }}
            />
          </ComposedChart>
        </ResponsiveContainer>

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
