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
import type { WordCloudItem } from "@/features/monev-kkp/api/services";
import { BoundedWordCloud } from "./BoundedWordCloud";

const WORD_COLORS = [
  "#7aa6a1", "#d08b78", "#8fa66f", "#8ea4c8", "#c49a5e",
  "#b5839b", "#78a6c8", "#b2a06d", "#9d91c2", "#c27f7f",
  "#73a889", "#c18ca8", "#d1996b", "#7f9fc0", "#a8a66f",
];

const MAX_VISIBLE_WORDS = 34;

interface DetilKendalaWordCloudProps {
  data: WordCloudItem[];
  isLoading?: boolean;
}

export function DetilKendalaWordCloud({
  data,
  isLoading,
}: DetilKendalaWordCloudProps) {
  const totalWords = useMemo(
    () => data.reduce((s, d) => s + d.value, 0),
    [data],
  );

  const words = useMemo(() => {
    if (!data || data.length === 0) return [];
    const sorted = [...data]
      .sort((a, b) => b.value - a.value)
      .slice(0, MAX_VISIBLE_WORDS);

    return sorted.map((item, i) => ({
      color: WORD_COLORS[i % WORD_COLORS.length] ?? "#64748b",
      text: item.text,
      tooltip: `"${item.text}" - muncul ${item.value}x`,
      value: item.value,
    }));
  }, [data]);

  if (isLoading) return <ChartCardSkeleton />;

  if (!data || data.length === 0) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Detil Kendala</CardTitle>
          <CardDescription>Belum ada data detil kendala</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Tidak ada detil kendala yang dilaporkan
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
            <CardTitle className="text-base">
              Detil Kendala
            </CardTitle>
            <CardDescription>
              Kata-kata yang paling sering muncul dari laporan detil kendala satker
            </CardDescription>
          </div>
          <div className="text-xs text-muted-foreground shrink-0">
            {data.length.toLocaleString("id-ID")} kata unik ·{" "}
            <span className="font-medium text-foreground">
              {totalWords.toLocaleString("id-ID")} kemunculan
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0 pb-4">
        <BoundedWordCloud
          height={360}
          items={words}
          maxFontSize={26}
          maxVisible={MAX_VISIBLE_WORDS}
          minFontSize={10}
        />
      </CardContent>
    </Card>
  );
}
