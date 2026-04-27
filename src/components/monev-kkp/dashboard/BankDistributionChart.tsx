"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ChartCardSkeleton } from "@/components/ui/dashboard-skeletons";
import type { BankDistItem } from "@/features/monev-kkp/api/services";

const COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ef4444", // red-500
  "#06b6d4", // cyan-500
  "#ec4899", // pink-500
  "#84cc16", // lime-500
];

interface BankDistributionChartProps {
  data: BankDistItem[];
  isLoading?: boolean;
}

export function BankDistributionChart({
  data,
  isLoading,
}: BankDistributionChartProps) {
  const chartData = useMemo(
    () =>
      data.map((item) => ({
        name: item.bank,
        value: item.count,
        percentage: item.percentage,
      })),
    [data],
  );

  if (isLoading) return <ChartCardSkeleton />;

  if (!data || data.length === 0) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Distribusi Bank Penerbit</CardTitle>
          <CardDescription>Belum ada data bank penerbit</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Tidak ada data untuk ditampilkan
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Distribusi Bank Penerbit</CardTitle>
        <CardDescription>Jumlah satker per bank penerbit KKP</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-6 pt-0 pb-4">
        <div className="flex-1 min-h-[264px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                label={({ name, percentage }: any) =>
                  `${name} (${Number(percentage).toFixed(1)}%)`
                }
                labelLine={{ strokeWidth: 1 }}
                fontSize={10}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length] ?? "#888"}
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const entry = payload[0]!;
                  return (
                    <div className="rounded-lg border bg-background p-2.5 shadow-sm text-sm min-w-[160px]">
                      <p className="text-xs font-semibold mb-1 text-foreground">
                        {entry.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: (entry.payload as any)?.fill ?? "#888",
                          }}
                        />
                        <span className="font-medium">Satker:</span>
                        <span>
                          {Number(entry.value).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mt-0.5">
                        <span>
                          {Number((entry.payload as any)?.percentage ?? 0).toFixed(1)}%
                          dari total
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
