"use client";

import { BarChart, Bar, BarXAxis, Grid } from "@/components/charts";
import { ChartTooltip } from "@/components/charts/tooltip";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ChartCardSkeleton } from "@/components/ui/dashboard-skeletons";
import { transformPersentaseKL } from "@/utils/dashboard";

interface PersentaseChartProps {
  data: any;
  isLoading: boolean;
  title: string;
  description: string;
  height?: number;
}

export const PersentaseChart = ({
  data,
  isLoading,
  title,
  description,
}: PersentaseChartProps) => {
  if (isLoading) return <ChartCardSkeleton />;

  const chartData = transformPersentaseKL(data);
  if (!chartData.length) return null;

  return (
    <Card className="flex h-full flex-col min-w-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-[12px]">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-6 pt-0 pb-4 min-w-0">
        <div className="w-full min-w-0 relative h-[320px]">
          <BarChart
            data={chartData}
            xDataKey="name"
            margin={{ top: 16, right: 10, left: 10, bottom: 20 }}
            aspectRatio="auto"
            className="h-full w-full"
            barGap={0.15}
          >
            <Grid horizontal />
            <Bar dataKey="value" fill="#94a3b8" lineCap="round" />
            <BarXAxis showAllLabels maxLabels={50} />
            <ChartTooltip
              rows={(point) => [
                {
                  color: "#94a3b8",
                  label: `${point.kode_ba} - ${point.nama_ba}`,
                  value: `${Number(point.value).toFixed(2)}%`,
                },
              ]}
            />
          </BarChart>
        </div>
      </CardContent>
    </Card>
  );
};
