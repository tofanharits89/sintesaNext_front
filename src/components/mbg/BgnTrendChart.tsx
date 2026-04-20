"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
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

  const chartData = data.months.map((m) => ({
    name: m.month,
    "Realisasi 2025": m.realisasi2025,
    "Realisasi 2026": m.realisasi2026,
  }));

  return (
    <Card className="flex h-full flex-col">
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
              className="text-xs border-blue-300 text-blue-700 bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:bg-blue-950/30"
            >
              2025: {fmtT(lastRealisasi2025)}
              {pctStr(lastRealisasi2025, data.pagu2025)}
            </Badge>
          )}
          {lastRealisasi2026 !== null && (
            <Badge
              variant="outline"
              className="text-xs border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/30"
            >
              2026 s.d. terkini: {fmtT(lastRealisasi2026)}
              {pctStr(lastRealisasi2026, data.pagu2026)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-6 pt-0 pb-4">
        <div className="flex-1 min-h-[248px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart
            data={chartData}
            margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
          >
            <XAxis
              dataKey="name"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              stroke="#888"
            />
            <YAxis
              fontSize={11}
              tickLine={false}
              axisLine={false}
              stroke="#888"
              tickFormatter={(v) => fmtT(v as number)}
              width={54}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm text-sm">
                    <p className="text-xs text-muted-foreground uppercase mb-1.5">
                      {label}
                    </p>
                    {payload.map((entry: any, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="font-medium">{entry.name}:</span>
                        <span>{fmtT(entry.value as number)}</span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            {data.pagu2025 > 0 && (
              <ReferenceLine
                y={data.pagu2025}
                stroke="#3b82f6"
                strokeDasharray="5 3"
                strokeWidth={1}
                label={{
                  value: "PAGU 2025",
                  position: "insideTopLeft",
                  fontSize: 10,
                  fill: "#3b82f6",
                }}
              />
            )}
            {data.pagu2026 > 0 && (
              <ReferenceLine
                y={data.pagu2026}
                stroke="#10b981"
                strokeDasharray="5 3"
                strokeWidth={1}
                label={{
                  value: "PAGU 2026",
                  position: "insideTopRight",
                  fontSize: 10,
                  fill: "#10b981",
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="Realisasi 2025"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="Realisasi 2026"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
