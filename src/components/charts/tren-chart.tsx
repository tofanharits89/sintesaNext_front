"use client";

import { BarChart, Line, BarXAxis, Grid } from "@/components/charts";
import { ChartTooltip } from "@/components/charts/tooltip";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ChartCardSkeleton } from "@/components/ui/dashboard-skeletons";
import { transformTrenRealisasiBulanan, getTrenRealisasiLines } from "@/utils/dashboard";

interface TrenChartProps {
  data: any;
  isLoading: boolean;
  title: string;
  description: string;
  height?: number;
}

function fmtT(val: number): string {
  if (!isFinite(val)) return "–";
  if (Math.abs(val) >= 1e12) return `${(val / 1e12).toFixed(2)} T`;
  if (Math.abs(val) >= 1e9) return `${(val / 1e9).toFixed(1)} M`;
  return val.toLocaleString("id-ID");
}

export const TrenChart = ({
  data,
  isLoading,
  title,
  description,
}: TrenChartProps) => {
  if (isLoading) return <ChartCardSkeleton />;

  const chartData = transformTrenRealisasiBulanan(data);
  const lines = getTrenRealisasiLines(data);

  if (!chartData.length || !lines.length) return null;

  // Compute y-domain from actual values
  const allValues = chartData.flatMap((d: any) =>
    lines.map((l: any) => d[l.dataKey]).filter((v: any) => typeof v === "number" && v > 0)
  );
  const maxVal = Math.max(...allValues, 1);
  const yDomain: [number, number] = [0, maxVal * 1.02];

  return (
    <Card className="flex h-full flex-col min-w-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
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
            {lines.map((line: any) => (
              <Line
                key={line.dataKey}
                dataKey={line.dataKey}
                stroke={line.stroke}
                strokeWidth={2.5}
                yDomain={yDomain}
              />
            ))}
            <BarXAxis showAllLabels />
            <ChartTooltip
              rows={(point) =>
                lines.map((line: any) => ({
                  color: line.stroke,
                  label: line.dataKey,
                  value: fmtT(point[line.dataKey] as number),
                }))
              }
            />
          </BarChart>
        </div>
      </CardContent>
    </Card>
  );
};
