"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
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
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Sebaran Penerima Manfaat</CardTitle>
        <CardDescription>
          Top 8 provinsi – perbandingan 2025 vs 2026
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={264} minWidth={0}>
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 0, bottom: 52 }}
            barCategoryGap="25%"
            barGap={2}
          >
            <XAxis
              dataKey="name"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              stroke="#888"
              angle={-35}
              textAnchor="end"
              interval={0}
              height={60}
            />
            <YAxis
              fontSize={10}
              tickLine={false}
              axisLine={false}
              stroke="#888"
              tickFormatter={(v) => {
                const n = Number(v);
                if (n >= 1e6) return `${(n / 1e6).toFixed(1)}jt`;
                if (n >= 1e3) return `${(n / 1e3).toFixed(0)}rb`;
                return String(n);
              }}
              width={42}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = chartData.find((c) => c.name === label);
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm text-sm min-w-[190px]">
                    <p className="text-xs font-semibold mb-1.5 text-foreground">
                      {d?.fullName ?? label}
                    </p>
                    {payload.map((entry: any, i: number) => {
                      const persen =
                        entry.dataKey === "2025"
                          ? d?.persen2025
                          : d?.persen2026;
                      return (
                        <div key={i} className="flex items-center gap-2 mb-0.5">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: entry.fill }}
                          />
                          <span className="font-medium">{entry.name}:</span>
                          <span>{fmtRibuan(entry.value as number)}</span>
                          {persen !== undefined && (
                            <span className="text-muted-foreground text-xs">
                              ({Number(persen).toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "4px" }}
              formatter={(value) => `Penerima ${value}`}
            />
            <Bar
              dataKey="2025"
              name="2025"
              fill={COLOR_2025}
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="2026"
              name="2026"
              fill={COLOR_2026}
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
