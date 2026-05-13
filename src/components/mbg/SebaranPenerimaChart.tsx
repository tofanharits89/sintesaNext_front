"use client";

import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ChartCardSkeleton } from "@/components/ui/dashboard-skeletons";
import { useSebaranPenerima } from "@/features/mbg/hooks/useSebaranPenerima";

function fmtRibuan(val: number | null | undefined): string {
  if (val === null || val === undefined || !isFinite(Number(val))) return "–";
  return Number(val).toLocaleString("id-ID");
}

/** Shorten province name so it fits in the chart axis */
function shortProv(name: string): string {
  return name
    .replace(/^PROVINSI\s+/i, "")
    .replace(/^PROV\.\s+/i, "")
    .replace(/^DI\s+/i, "DI ")
    .replace(/^DKI\s+/i, "DKI ")
    .replace(/KALIMANTAN/i, "Kal.")
    .replace(/SULAWESI/i, "Sul.")
    .replace(/SUMATERA/i, "Sum.")
    .replace(/NUSA TENGGARA/i, "NT")
    .replace(/MALUKU UTARA/i, "Malut")
    .replace(/MALUKU/i, "Maluku")
    .replace(/GORONTALO/i, "Gorut")
    .replace(/KEPULAUAN/i, "Kep.")
    .trim();
}

const COLOR_2025 = "#93c5fd"; // blue-300
const COLOR_2026 = "#3b82f6"; // blue-500

export function SebaranPenerimaChart() {
  const { data, isLoading } = useSebaranPenerima();

  if (isLoading) return <ChartCardSkeleton />;
  if (!data || data.items.length === 0) return null;

  const chartData = data.items.map((item) => ({
    name: shortProv(item.nama_provinsi),
    fullName: item.nama_provinsi,
    "2025": item.penerima2025,
    "2026": item.penerima2026,
    persen2025: item.persen2025,
    persen2026: item.persen2026,
  }));

  return (
    <Card className="flex h-full flex-col min-w-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Sebaran Penerima Manfaat</CardTitle>
        <CardDescription>
          Top 8 provinsi – perbandingan 2025 vs 2026
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-6 pt-0 pb-4 min-w-0">
        <div className="flex-1 min-h-[264px] w-full min-w-0 relative">
          {/* Legend */}
          <div className="absolute top-0 right-0 z-10 flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLOR_2025 }} />
              <span>Penerima 2025</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLOR_2026 }} />
              <span>Penerima 2026</span>
            </div>
          </div>

          <BarChart
            data={chartData}
            xDataKey="name"
            margin={{ top: 24, right: 0, left: 0, bottom: 20 }}
            barGap={0.3}
            aspectRatio="auto"
            className="h-full w-full"
          >
            <Grid horizontal />
            <Bar
              dataKey="2025"
              fill={COLOR_2025}
              lineCap="round"
            />
            <Bar
              dataKey="2026"
              fill={COLOR_2026}
              lineCap="round"
            />
            <BarXAxis showAllLabels />
            <ChartTooltip
              rows={(point) => [
                {
                  color: COLOR_2025,
                  label: "Penerima 2025",
                  value: `${fmtRibuan(point["2025"] as number)} (${Number(point.persen2025).toFixed(1)}%)`,
                },
                {
                  color: COLOR_2026,
                  label: "Penerima 2026",
                  value: `${fmtRibuan(point["2026"] as number)} (${Number(point.persen2026).toFixed(1)}%)`,
                },
              ]}
            />
          </BarChart>
        </div>
      </CardContent>
    </Card>
  );
}
