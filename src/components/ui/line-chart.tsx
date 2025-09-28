"use client";

import {
  Line,
  LineChart,
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

interface LineChartProps {
  data: Array<{
    name: string;
    [key: string]: any;
  }>;
  title: string;
  description?: string;
  lines: Array<{
    dataKey: string;
    stroke: string;
    name: string;
  }>;
  height?: number;
  // Optional formatter for tooltip values
  formatValue?: (value: number) => string;
  // Optional legend font size (px)
  legendFontSize?: number;
  // Hide Y-axis tick labels entirely
  hideYAxisTicks?: boolean;
  // Optional chart margin (applied to <LineChart />)
  chartMargin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  // Optional X-axis padding to avoid clipping first/last labels
  xAxisPadding?: { left?: number; right?: number };
}

export function LineChartComponent({
  data,
  title,
  description,
  lines,
  height = 300,
  formatValue,
  legendFontSize,
  hideYAxisTicks = false,
  chartMargin,
  xAxisPadding,
}: LineChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} {...(chartMargin ? { margin: chartMargin } : {})}>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              {...(xAxisPadding ? { padding: xAxisPadding } : {})}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
              {...(hideYAxisTicks ? { tick: false, width: 0 } : {})}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            {label}
                          </span>
                        </div>
                        {payload.map((entry, index) => {
                          const rawVal = entry.value as number;
                          const displayVal =
                            typeof rawVal === "number" && formatValue
                              ? formatValue(rawVal)
                              : (entry.value as any);
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-sm font-medium">
                                {entry.name}: {displayVal}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {legendFontSize ? (
              <Legend wrapperStyle={{ fontSize: `${legendFontSize}px` }} />
            ) : (
              <Legend />
            )}
            {lines.map((line, index) => (
              <Line
                key={index}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.stroke}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name={line.name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
