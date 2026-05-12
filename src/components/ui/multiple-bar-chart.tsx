"use client";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { ChartTooltip } from "@/components/charts/tooltip";

interface MultipleBarChartProps {
  data: Array<{
    name: string;
    [key: string]: number | string | null | undefined;
  }>;
  title: string;
  description?: string;
  series: Array<{
    dataKey: string;
    name: string;
    color: string;
    stackId?: string;
    radius?: number | [number, number, number, number];
    labelColor?: string;
  }>;
  nameKey?: string;
  height?: number;
  formatValue?: (value: number) => string;
}

export function MultipleBarChartComponent({
  data,
  title,
  description,
  series,
  nameKey = "name",
  height = 300,
  formatValue = (value) => {
    const trillion = value / 1_000_000_000_000;
    return `${trillion.toLocaleString("id-ID", { maximumFractionDigits: 2 })}T`;
  },
}: MultipleBarChartProps) {
  const isStacked = series.some((s) => s.stackId);

  // Dynamic legend positioning based on empty space
  const leftTotal = series.reduce((acc, s) => acc + (Number(data[0]?.[s.dataKey]) || 0), 0);
  const rightTotal = series.reduce((acc, s) => acc + (Number(data[data.length - 1]?.[s.dataKey]) || 0), 0);
  const legendPosition = leftTotal > rightTotal ? "right" : "left";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription className="text-[12px]">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="px-6 pt-0 pb-6">
        <div style={{ height }} className="w-full relative">
          {/* Absolute positioned Legend in empty space */}
          <div className={cn(
            "absolute z-10 flex flex-col items-start gap-1.5 p-2",
            legendPosition === "right" ? "top-0 right-[25px] text-right items-end" : "top-0 left-[25px] text-left items-start"
          )}>
            {[...series].reverse().map((s, index) => (
              <div key={index} className={cn("flex items-center gap-1.5", legendPosition === "right" && "flex-row-reverse")}>
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-[10px] font-mono font-medium text-muted-foreground whitespace-nowrap">{s.name}</span>
              </div>
            ))}
          </div>

          <BarChart
            data={data}
            xDataKey={nameKey}
            stacked={isStacked}
            aspectRatio="auto"
            className="h-full w-full"
            barGap={0.25}
            stackGap={4}
            margin={{ top: 0, right: 10, bottom: 24, left: 10 }}
          >
            <BarXAxis />
            <ChartTooltip
              rows={(point) =>
                series.map((s) => ({
                  color: s.color,
                  label: s.name,
                  value: formatValue((point[s.dataKey] as number) ?? 0),
                }))
              }
            />
            {series.map((s, index) => {
              const radius = s.radius !== undefined && Array.isArray(s.radius) ? s.radius[0] : (s.radius !== undefined ? s.radius : "round");
              return (
                <Bar
                  key={index}
                  dataKey={s.dataKey}
                  fill={s.color}
                  lineCap={typeof radius === "number" ? radius : "round"}
                  stackGap={4}
                  minPointSize={12}
                  showLabels={true}
                  labelColor={s.labelColor}
                  labelFormatter={(val) => {
                    const trillion = val / 1_000_000_000_000;
                    return `${trillion >= 1 ? trillion.toFixed(1) : trillion.toFixed(2)}T`;
                  }}
                />
              );
            })}
          </BarChart>
        </div>
      </CardContent>
    </Card>
  );
}
