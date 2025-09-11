"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface BarChartProps {
  data: Array<{
    name: string;
    [key: string]: any;
  }>;
  title: string;
  description?: string;
  dataKey?: string;
  nameKey?: string;
  color?: string;
  height?: number;
  formatValue?: (value: number) => string;
  // Custom tooltip label text from the data point
  formatTooltipLabel?: (datum: any) => string;
  // X-axis label styling/rotation
  xTickAngle?: number; // e.g. -90 for vertical
  xTickFontSize?: number; // e.g. 10
  xAxisHeight?: number; // e.g. 100-140 to fit rotated labels
  showAllXTicks?: boolean; // interval={0}
}

export function BarChartComponent({
  data,
  title,
  description,
  dataKey = "value",
  nameKey = "name",
  color = "#8884d8",
  height = 300,
  formatValue,
  formatTooltipLabel,
  xTickAngle = 0,
  xTickFontSize = 12,
  xAxisHeight,
  showAllXTicks = false,
}: BarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data}>
            <XAxis
              dataKey={nameKey}
              stroke="#888888"
              fontSize={xTickFontSize}
              tickLine={false}
              axisLine={false}
              interval={showAllXTicks ? 0 : undefined}
              angle={xTickAngle}
              textAnchor={
                xTickAngle ? (xTickAngle < 0 ? "end" : "start") : "middle"
              }
              height={xAxisHeight}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                formatValue ? formatValue(Number(value)) : `${value}`
              }
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const entry = payload[0];
                  const val = entry.value as number;
                  const datum = entry.payload as any;
                  const title = formatTooltipLabel
                    ? formatTooltipLabel(datum)
                    : label;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            {title}
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {formatValue ? formatValue(val) : val}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
