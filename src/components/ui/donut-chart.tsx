"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface DonutChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  height?: number;
  colors?: string[];
  showLegend?: boolean;
  showLabel?: boolean;
}

const defaultColors = ["#3b82f6", "#10b981", "#ef4444"];

export function DonutChartComponent({
  data,
  height = 200,
  colors = defaultColors,
  showLegend = false,
  showLabel = true,
}: DonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={20}
          outerRadius={40}
          paddingAngle={1}
          dataKey="value"
          label={showLabel}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
            />
          ))}
        </Pie>
        {showLegend && <Legend />}
        <Tooltip
          formatter={(value) => value.toLocaleString("id-ID")}
          contentStyle={{
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            border: "none",
            borderRadius: "4px",
            color: "#fff",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
