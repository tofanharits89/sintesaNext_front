"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ChartCardSkeleton } from "@/components/ui/dashboard-skeletons";
import type { TransaksiKppnItem } from "@/features/monev-kkp/api/services";

function fmtRupiah(val: number | null | undefined): string {
  if (val === null || val === undefined || !isFinite(Number(val))) return "–";
  const n = Number(val);
  if (Math.abs(n) >= 1e12) return `${(n / 1e12).toFixed(2)} T`;
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)} M`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(0)} jt`;
  return n.toLocaleString("id-ID");
}

/** Shorten KPPN name for chart */
function shortKppn(name: string): string {
  return name
    .replace(/^KPPN\s+/i, "")
    .replace(/^Kantor\s+/i, "")
    .trim()
    .slice(0, 20);
}

const COLORS = [
  "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a",
  "#60a5fa", "#93c5fd", "#6366f1", "#4f46e5", "#4338ca",
];

interface TransaksiKppnChartProps {
  data: TransaksiKppnItem[];
  isLoading?: boolean;
}

export function TransaksiKppnChart({
  data,
  isLoading,
}: TransaksiKppnChartProps) {
  if (isLoading) return <ChartCardSkeleton />;
  if (!data || data.length === 0) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Transaksi per KPPN</CardTitle>
          <CardDescription>Belum ada data transaksi</CardDescription>
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
    name: shortKppn(item.nmkppn),
    fullName: item.nmkppn,
    value: item.totalTransaksi,
  }));

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Top {data.length} KPPN — Transaksi SP2D
        </CardTitle>
        <CardDescription>
          Nilai transaksi kumulatif per KPPN
        </CardDescription>
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
                fontSize={11}
                tickLine={false}
                axisLine={false}
                stroke="#888"
                width={110}
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
                      <p className="text-xs font-semibold mb-1 text-foreground">
                        {d?.fullName ?? entry.payload?.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: "#3b82f6" }}
                        />
                        <span className="font-medium">Transaksi:</span>
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
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
