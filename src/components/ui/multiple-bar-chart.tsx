"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";
import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
  formatValue = (value) => value.toLocaleString("id-ID"),
}: MultipleBarChartProps) {
  const effectiveHeight = height + 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="px-8 pt-0">
        <ResponsiveContainer width="100%" height={effectiveHeight}>
          <BarChart
            data={data}
            margin={{ top: 12, right: 10, left: 0, bottom: 4 }}
          >
            <XAxis
              dataKey={nameKey}
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              interval={0}
              tickMargin={6}
              tick={{ fontSize: 11, width: 80 }}
              height={56}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={false}
              width={0}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-sm">
                      <div className="mb-2">
                        <span className="text-sm font-medium text-foreground">
                          {label}
                        </span>
                      </div>
                      <div className="grid gap-2">
                        {payload.map((entry, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-sm"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm text-muted-foreground">
                              {entry.name}:
                            </span>
                            <span className="text-sm font-medium">
                              {formatValue(entry.value as number)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="rect"
              wrapperStyle={{ fontSize: "12px", marginBottom: -1 }}
            />
            {series.map((s, index) => (
              <Bar
                key={index}
                dataKey={s.dataKey}
                name={s.name}
                fill={s.color}
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey={s.dataKey}
                  position="top"
                  fontSize={10}
                  fill="#666"
                  formatter={(value: ReactNode) => {
                    let num = 0;
                    if (typeof value === "number") num = value;
                    else if (typeof value === "string") num = Number(value);
                    return formatValue(num);
                  }}
                />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
