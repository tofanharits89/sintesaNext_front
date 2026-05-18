"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ChartCardSkeleton } from "@/components/ui/dashboard-skeletons";
import type { KendalaItem } from "@/features/monev-kkp/api/services";
import { BoundedWordCloud } from "./BoundedWordCloud";

const WORD_COLORS = [
  "#7aa6a1", "#d08b78", "#8fa66f", "#8ea4c8", "#c49a5e",
  "#b5839b", "#78a6c8", "#b2a06d", "#9d91c2", "#c27f7f",
];

interface KendalaDistributionChartProps {
  data: KendalaItem[];
  isLoading?: boolean;
}

export function KendalaDistributionChart({
  data,
  isLoading,
}: KendalaDistributionChartProps) {
  const { words, totalKendala } = useMemo(() => {
    if (!data || data.length === 0) return { words: [], totalKendala: 0 };
    const total = data.reduce((s, d) => s + d.count, 0);

    const sorted = [...data].sort((a, b) => b.count - a.count);
    const mapped = sorted.map((item, i) => ({
      color: WORD_COLORS[i % WORD_COLORS.length] ?? "#64748b",
      text: item.kategori,
      tooltip: `${item.kategori}: ${item.count.toLocaleString("id-ID")} satker (${item.percentage.toFixed(1)}%)`,
      value: item.count,
    }));
    return { words: mapped, totalKendala: total };
  }, [data]);

  if (isLoading) return <ChartCardSkeleton />;

  if (!data || data.length === 0) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Kategori Kendala</CardTitle>
          <CardDescription>Belum ada data kendala</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Tidak ada kendala yang dilaporkan
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-base">Kategori Kendala</CardTitle>
            <CardDescription>
              Kategori kendala yang dilaporkan satker
            </CardDescription>
          </div>
          <div className="text-xs text-muted-foreground shrink-0">
            Total:{" "}
            <span className="font-medium text-foreground">
              {totalKendala.toLocaleString("id-ID")} laporan
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0 pb-4">
        <BoundedWordCloud
          height={360}
          items={words}
          maxFontSize={28}
          minFontSize={12}
        />
      </CardContent>
    </Card>
  );
}
