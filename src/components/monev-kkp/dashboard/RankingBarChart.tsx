"use client";

import { BarChart, Bar, BarYAxis } from "@/components/charts";
import { ChartTooltip } from "@/components/charts/tooltip";
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

interface RankingBarChartProps {
  title: string;
  description: string;
  data: { name: string; fullName?: string; value: number }[];
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
    fullName: item.fullName ?? item.name,
    Transaksi: item.value,
  }));

  return (
    <Card className="flex h-full min-w-0 flex-col">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-[12px]">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-6 pb-6 pt-0">
        <div className="relative h-[400px] w-full min-w-0">
          <BarChart
            aspectRatio="auto"
            barGap={0.22}
            className="h-full w-full"
            data={chartData}
            margin={{ top: 4, right: 24, bottom: 8, left: 108 }}
            orientation="horizontal"
            xDataKey="name"
          >
            <BarYAxis
              labelClassName="font-mono text-[10px] leading-tight"
              labelMaxWidth={72}
              labelPaddingRight={14}
            />
            <ChartTooltip
              showCrosshair={false}
              showDatePill={false}
              showDots={false}
              rows={(point) => [
                {
                  color: "var(--chart-realisasi)",
                  label: valueLabel,
                  value: new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                  }).format(Number(point.Transaksi) || 0),
                },
              ]}
              content={({ point }) => (
                <div className="min-w-[220px] max-w-[320px] rounded-lg border bg-background p-2.5 text-sm shadow-sm">
                  <p className="mb-1 whitespace-normal text-xs font-semibold text-foreground">
                    {String(point.fullName ?? point.name ?? "")}
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: "var(--chart-realisasi)" }}
                    />
                    <span className="font-medium text-muted-foreground">
                      {valueLabel}:
                    </span>
                    <span className="font-semibold text-foreground">
                      {fmtRupiah(Number(point.Transaksi) || 0)}
                    </span>
                  </div>
                </div>
              )}
            />
            <Bar
              dataKey="Transaksi"
              fill="var(--chart-realisasi)"
              labelColor="var(--chart-realisasi-label)"
              labelFormatter={fmtRupiah}
              lineCap={6}
              minPointSize={12}
              showLabels
            />
          </BarChart>
        </div>
      </CardContent>
    </Card>
  );
}
