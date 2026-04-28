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
  const [dimensions, setDimensions] = useState({ width: 800, height: 360 });
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
                return { width: Math.floor(width), height: 360 };
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

    const wrapText = (text: string) => {
      const wordsList = text.split(" ");
      if (wordsList.length <= 1 || text.length < 25) return [text];

      const midPoint = text.length / 2;
      let currentLength = 0;
      let splitIndex = Math.max(1, Math.floor(wordsList.length / 2));

      for (let i = 0; i < wordsList.length - 1; i++) {
        const currentWord = wordsList[i]!;
        currentLength += currentWord.length + 1;
        if (currentLength >= midPoint) {
          const prevLength = currentLength - currentWord.length - 1;
          if (i > 0 && (midPoint - prevLength) < (currentLength - midPoint)) {
            splitIndex = i;
          } else {
            splitIndex = i + 1;
          }
          break;
        }
      }

      const line1 = wordsList.slice(0, splitIndex).join(" ");
      const line2 = wordsList.slice(splitIndex).join(" ");
      return [line1, line2].filter(Boolean);
    };

    const mapped = data.map((item) => {
      const lines = wrapText(item.kategori);
      // Use the longest line for d3-cloud's width calculation to ensure horizontal fit
      const longestLine = lines.reduce((a, b) => (a.length > b.length ? a : b), "");

      return {
        text: longestLine, // Required by d3-cloud for layout
        originalText: item.kategori, // The full original text
        lines: lines, // The wrapped lines to render
        value: item.count,
      };
    });
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
          className="group bg-zinc-100 dark:bg-black rounded-lg"
          style={{ width: "100%", height: 360, overflow: "hidden", display: "flex", justifyContent: "center" }}
        >
          {words.length > 0 && dimensions.width > 0 && (
            <TooltipProvider delayDuration={0}>
              <WordCloud
                words={words}
                width={dimensions.width}
                height={dimensions.height}
                font="Inter, system-ui, sans-serif"
                fontWeight="600"
                fontSize={(word: any) => {
                  const maxVal = Math.max(...words.map(d => d.value));
                  const minVal = Math.min(...words.map(d => d.value));
                  const minS = 14;
                  const maxS = 64; // Reduced from 80 for better fit of long phrases

                  let size;
                  if (maxVal === minVal) {
                    size = (minS + maxS) / 2;
                  } else {
                    size = minS + ((word.value - minVal) / (maxVal - minVal)) * (maxS - minS);
                  }

                  // d3-cloud drops words that exceed bounding box. 
                  // Scale down font size if the text is too long or tall for the container.
                  const textToMeasure = word.text || "";
                  const lineCount = word.lines?.length || 1;
                  const paddingValue = 12; // estimated base padding

                  // Width check (0.6 is a safe multiplier for Inter font width)
                  const estimatedWidth = textToMeasure.length * size * 0.6;
                  const maxWidth = dimensions.width * 0.85;
                  if (estimatedWidth > maxWidth) {
                    size = maxWidth / (textToMeasure.length * 0.6);
                  }

                  // Height check
                  const estimatedHeight = size * lineCount * 1.2; // 1.2 accounts for line spacing
                  const maxHeight = dimensions.height * 0.7; // Leave room for padding and other words
                  if (estimatedHeight > maxHeight) {
                    size = maxHeight / (lineCount * 1.2);
                  }

                  return Math.max(minS, size);
                }}
                rotate={() => 0}
                padding={(word: any) => 12 + (word.size * ((word.lines?.length || 1) - 1)) * 1.0}
                spiral="rectangular"
                renderWord={(word: any) => {
                  const color = wordColor({ text: word.originalText });
                  const lines = word.lines || [word.text];
                  const lineHeight = word.size * 1.1;
                  const startDy = -((lines.length - 1) * lineHeight) / 2;

                  return (
                    <Tooltip key={word.originalText}>
                      <TooltipTrigger asChild>
                        <text
                          className="transition-all duration-300 ease-out cursor-pointer outline-none group-hover:opacity-25 hover:!opacity-100 hover:font-[800] hover:[scale:1.05]"
                          fontSize={word.size}
                          fontFamily={word.font}
                          fontWeight={word.weight}
                          fill={color}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`translate(${word.x}, ${word.y}) rotate(${word.rotate})`}
                        >
                          {lines.map((line: string, i: number) => (
                            <tspan
                              key={i}
                              x={0}
                              dy={i === 0 ? `${startDy}px` : `${lineHeight}px`}
                            >
                              {line}
                            </tspan>
                          ))}
                        </text>
                      </TooltipTrigger>
                      <TooltipContent className="pointer-events-none shadow-md" sideOffset={5}>
                        <p className="text-sm font-medium">{wordTooltip({ text: word.originalText })}</p>
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
