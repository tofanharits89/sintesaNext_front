"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ChartCardSkeleton } from "@/components/ui/dashboard-skeletons";

function fmtRupiah(val: number | null | undefined): string {
  if (val === null || val === undefined || !isFinite(Number(val))) return "–";
  const n = Number(val);
  if (Math.abs(n) >= 1e12) return `${(n / 1e12).toFixed(2)} T`;
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)} M`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(0)} jt`;
  return n.toLocaleString("id-ID");
}

function shortenName(name: string): string {
  return name
    .replace(/KPPN\s+/i, "")
    .replace(/Kantor\s+/i, "")
    .replace(/KEMENTERIAN\s+/i, "")
    .replace(/BADAN\s+/i, "")
    .trim()
    .slice(0, 40);
}

const COLORS = [
  "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a",
  "#60a5fa", "#93c5fd", "#6366f1", "#4f46e5", "#4338ca",
];

interface RankingBarChartProps {
  title: string;
  description: string;
  data: { name: string; value: number }[];
  isLoading?: boolean;
  valueLabel?: string;
}

export function RankingBarChart({
  title,
  description,
  data,
  isLoading,
  valueLabel = "Transaksi",
}: RankingBarChartProps) {
  if (isLoading) return <ChartCardSkeleton />;
  if (!data || data.length === 0) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>Belum ada data</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Tidak ada data untuk ditampilkan
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: shortenName(item.name),
    fullName: item.name,
    value: item.value,
  }));

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-6 pt-0 pb-4">
        <div className="flex-1 min-h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 40, left: 4, bottom: 4 }}
              barCategoryGap="18%"
            >
              <XAxis
                type="number"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                stroke="#888"
                tickFormatter={(v) => fmtRupiah(v)}
              />
              <YAxis
                dataKey="name"
                type="category"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                stroke="#888"
                width={180}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const entry = payload[0]!;
                  const d = chartData.find(
                    (c) => c.name === entry.payload?.name,
                  );
                  return (
                    <div className="rounded-lg border bg-background p-2.5 shadow-sm text-sm min-w-[200px]">
                      <p className="text-xs font-semibold mb-1 text-foreground whitespace-normal">
                        {d?.fullName ?? entry.payload?.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: "#3b82f6" }}
                        />
                        <span className="font-medium">{valueLabel}:</span>
                        <span>
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                          }).format(Number(entry.value) || 0)}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {chartData.map((_, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={COLORS[idx % COLORS.length] ?? "#888"}
                  />
                ))}
                <LabelList
                  dataKey="value"
                  position="insideRight"
                  formatter={(v: number) => fmtRupiah(v)}
                  fontSize={9}
                  fill="#fff"
                  offset={10}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
