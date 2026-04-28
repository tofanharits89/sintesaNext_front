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
import type { WordCloudItem } from "@/features/monev-kkp/api/services";

// Dynamic import to avoid SSR issues (d3 uses window/document)
const WordCloud = dynamic(
  () => import("@isoterik/react-word-cloud").then((mod) => mod.WordCloud),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] w-full animate-pulse rounded-md bg-muted" />
    ),
  },
) as any;

const WORD_COLORS = [
  "#ef4444", "#f59e0b", "#8b5cf6", "#3b82f6", "#10b981",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
  "#14b8a6", "#a855f7", "#e11d48", "#0ea5e9", "#65a30d",
];

interface DetilKendalaWordCloudProps {
  data: WordCloudItem[];
  isLoading?: boolean;
}

export function DetilKendalaWordCloud({
  data,
  isLoading,
}: DetilKendalaWordCloudProps) {
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

  const totalWords = useMemo(
    () => data.reduce((s, d) => s + d.value, 0),
    [data],
  );

  // Stable color callback
  const wordColor = useMemo(() => {
    const colorMap = new Map<string, string>();
    data.forEach((item, i) => {
      colorMap.set(item.text, WORD_COLORS[i % WORD_COLORS.length] ?? "#888");
    });
    return (word: { text: string }) => colorMap.get(word.text) ?? "#888";
  }, [data]);

  // Stable tooltip callback
  const wordTooltip = useMemo(() => {
    const tooltipMap = new Map<string, string>();
    data.forEach((item) => {
      tooltipMap.set(item.text, `"${item.text}" — muncul ${item.value}x`);
    });
    return (word: { text: string }) => tooltipMap.get(word.text) ?? word.text;
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
        <div
          ref={containerRef}
          className="group bg-zinc-100 dark:bg-black rounded-lg"
          style={{ width: "100%", height: 360, overflow: "hidden", display: "flex", justifyContent: "center" }}
        >
          {data.length > 0 && dimensions.width > 0 && (
            <TooltipProvider delayDuration={0}>
              <WordCloud
                words={data}
                width={dimensions.width}
                height={dimensions.height}
                font="Inter, system-ui, sans-serif"
                fontWeight="600"
                fontSize={(word: any) => {
                  const maxVal = Math.max(...data.map(d => d.value));
                  const minVal = Math.min(...data.map(d => d.value));
                  const minS = 14;
                  const maxS = 80;

                  let size;
                  if (maxVal === minVal) {
                    size = (minS + maxS) / 2;
                  } else {
                    size = minS + ((word.value - minVal) / (maxVal - minVal)) * (maxS - minS);
                  }

                  // D3-cloud drops words that exceed bounding box. 
                  // Scale down font size if the text is too long for the container.
                  // A rough estimate: character width is ~0.6x font size.
                  const estimatedWidth = word.text.length * size * 0.6;
                  const maxWidth = dimensions.width * 0.9;

                  if (estimatedWidth > maxWidth) {
                    size = maxWidth / (word.text.length * 0.6);
                  }

                  // Height check
                  const maxHeight = dimensions.height * 0.8;
                  if (size > maxHeight) {
                    size = maxHeight;
                  }

                  return Math.max(minS, size);
                }}
                rotate={() => 0}
                padding={4}
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
                          dominantBaseline="middle"
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
