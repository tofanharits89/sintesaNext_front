"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ChartCardSkeleton } from "@/components/ui/dashboard-skeletons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { KendalaItem } from "@/features/monev-kkp/api/services";

// Dynamic import to avoid SSR issues (d3 uses window/document)
const WordCloud = dynamic(
  () => import("@isoterik/react-word-cloud").then((mod) => mod.WordCloud),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] w-full animate-pulse rounded-md bg-muted" />
    ),
  },
) as any;

const WORD_COLORS = [
  "#ef4444", "#f59e0b", "#8b5cf6", "#3b82f6", "#10b981",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

interface KendalaDistributionChartProps {
  data: KendalaItem[];
  isLoading?: boolean;
}

export function KendalaDistributionChart({
  data,
  isLoading,
}: KendalaDistributionChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 280 });
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let animationFrameId: number;
    const observer = new ResizeObserver((entries) => {
      animationFrameId = requestAnimationFrame(() => {
        for (const entry of entries) {
          const { width } = entry.contentRect;
          if (width > 0) {
            setDimensions((prev) => {
              // Only update if changed by more than 5px to avoid infinite sub-pixel loops
              if (Math.abs(prev.width - width) > 5) {
                return { width: Math.floor(width), height: 280 };
              }
              return prev;
            });
          }
        }
      });
    });

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const { words, totalKendala } = useMemo(() => {
    if (!data || data.length === 0) return { words: [], totalKendala: 0 };
    const total = data.reduce((s, d) => s + d.count, 0);
    const mapped = data.map((item) => ({
      text: item.kategori,
      value: item.count,
    }));
    return { words: mapped, totalKendala: total };
  }, [data]);

  // Stable callbacks — only depend on `data` identity
  const wordColor = useMemo(() => {
    const colorMap = new Map<string, string>();
    (data ?? []).forEach((item, i) => {
      colorMap.set(item.kategori, WORD_COLORS[i % WORD_COLORS.length] ?? "#888");
    });
    return (word: { text: string }) => colorMap.get(word.text) ?? "#888";
  }, [data]);

  const wordTooltip = useMemo(() => {
    const tooltipMap = new Map<string, string>();
    (data ?? []).forEach((item) => {
      tooltipMap.set(
        item.kategori,
        `${item.kategori}: ${item.count.toLocaleString("id-ID")} satker (${item.percentage.toFixed(1)}%)`,
      );
    });
    return (word: { text: string }) => tooltipMap.get(word.text) ?? word.text;
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
        <div
          ref={containerRef}
          className="group"
          style={{ width: "100%", height: 280, overflow: "hidden", display: "flex", justifyContent: "center" }}
        >
          {words.length > 0 && dimensions.width > 0 && (
            <TooltipProvider delayDuration={0}>
              <WordCloud
                words={words}
                width={dimensions.width}
                height={dimensions.height}
                font="Inter, system-ui, sans-serif"
                fontWeight="600"
                fontSize={(word: { value: number }) => {
                  const maxVal = Math.max(...words.map(d => d.value));
                  const minVal = Math.min(...words.map(d => d.value));
                  const minS = 14;
                  const maxS = 64;
                  if (maxVal === minVal) return (minS + maxS) / 2;
                  const normalized = (Math.sqrt(word.value) - Math.sqrt(minVal)) / (Math.sqrt(maxVal) - Math.sqrt(minVal));
                  return minS + normalized * (maxS - minS);
                }}
                rotate={() => 0}
                padding={1}
                spiral="rectangular"
                renderWord={(word: any) => {
                  const color = wordColor({ text: word.text });

                  return (
                    <Tooltip key={word.text}>
                      <TooltipTrigger asChild>
                        <text
                          className="transition-all duration-300 ease-out cursor-pointer outline-none group-hover:opacity-25 hover:!opacity-100 hover:font-[800] hover:[scale:1.05]"
                          fontSize={word.size}
                          fontFamily={word.font}
                          fontWeight={word.weight}
                          fill={color}
                          textAnchor="middle"
                          transform={`translate(${word.x}, ${word.y}) rotate(${word.rotate})`}
                        >
                          {word.text}
                        </text>
                      </TooltipTrigger>
                      <TooltipContent className="pointer-events-none shadow-md" sideOffset={5}>
                        <p className="text-sm font-medium">{wordTooltip({ text: word.text })}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }}
              />
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
