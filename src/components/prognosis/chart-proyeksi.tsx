import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { Section } from "./shared";

interface PrognosisChartProps {
  chartData: any[];
  selectedMetode: string;
  selectedBaseline: string;
  selectedZoomYear: number | null;
  currentYear: number;
}

export const PrognosisChart = ({
  chartData,
  selectedMetode,
  selectedBaseline,
  selectedZoomYear,
  currentYear,
}: PrognosisChartProps) => {
  return (
    <Section title="Grafik Proyeksi Realisasi Anggaran (%)">
      <div className="h-[400px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              opacity={0.5}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickFormatter={(v) => {
                const parts = v.split("-");
                if (parts.length === 2) {
                  const [yr, mo] = parts;
                  const monthNames = [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "Mei",
                    "Jun",
                    "Jul",
                    "Ags",
                    "Sep",
                    "Okt",
                    "Nov",
                    "Des",
                  ];
                  return `${monthNames[parseInt(mo) - 1]} '${yr.slice(2)}`;
                }
                return v;
              }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                color: "var(--foreground)",
              }}
              itemStyle={{ fontSize: "12px" }}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
            <Line
              type="monotone"
              dataKey="realisasi"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4, fill: "#3b82f6" }}
              activeDot={{ r: 6 }}
              name="Realisasi Historis"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="prediksi"
              stroke="#10b981"
              strokeWidth={4}
              strokeDasharray="5 5"
              dot={{
                r: 5,
                fill: "#10b981",
                stroke: "var(--background)",
                strokeWidth: 2,
              }}
              name={`Prediksi ${selectedMetode.toUpperCase()}`}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Controls */}
      <div className="flex items-center justify-between mt-6 p-3 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-semibold">
            Fokus Tahun: {selectedZoomYear || currentYear}
          </span>
          <Button variant="ghost" size="sm" className="h-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-7 text-[10px]">
            Baseline: {selectedBaseline}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] inline-flex items-center"
          >
            <Maximize2 className="h-3 w-3 mr-1" /> Reset Zoom
          </Button>
        </div>
      </div>
    </Section>
  );
};
