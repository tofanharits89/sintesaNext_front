"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChartCardSkeleton } from "@/components/ui/dashboard-skeletons";
import type { BankDistItem } from "@/features/monev-kkp/api/services";

const COLORS = [
  { bg: "#dbeafe", text: "#1e3a8a" }, // blue-100
  { bg: "#93c5fd", text: "#1e3a8a" }, // blue-300
  { bg: "#3b82f6", text: "#ffffff" }, // blue-500
  { bg: "#1d4ed8", text: "#ffffff" }, // blue-700
  { bg: "#1e3a8a", text: "#ffffff" }, // blue-900
  { bg: "#172554", text: "#ffffff" }, // blue-950
  { bg: "#60a5fa", text: "#ffffff" }, // blue-400 (fallback)
  { bg: "#2563eb", text: "#ffffff" }, // blue-600 (fallback)
];

interface BankDistributionChartProps {
  data: BankDistItem[];
  isLoading?: boolean;
}

function getBankAbbreviation(name: string | undefined): string {
  if (!name) return "";
  const upper = name.toUpperCase();
  if (upper === "BELUM MENERBITKAN") return "BELUM MENERBITKAN";
  if (upper.includes("RAKYAT INDONESIA") || upper === "BRI") return "BRI";
  if (upper.includes("NEGARA INDONESIA") || upper === "BNI") return "BNI";
  if (upper.includes("SYARIAH INDONESIA") || upper === "BSI") return "BSI";
  if (upper.includes("MANDIRI")) return "MANDIRI";
  if (upper.includes("RAYA")) return "RAYA";
  // fallback: remove "Bank" prefix and uppercase it
  return name.replace(/BANK\s+/i, "").trim().toUpperCase();
}

export function BankDistributionChart({
  data,
  isLoading,
}: BankDistributionChartProps) {
  const chartData = useMemo(
    () =>
      data.map((item) => {
        const bankName = item.bank;
        const displayName = bankName && bankName.toUpperCase() === "TIDAK DIKETAHUI" 
          ? "BELUM MENERBITKAN" 
          : bankName || "";

        return {
          name: getBankAbbreviation(displayName),
          fullName: displayName, // original full name
          value: item.count,
          percentage: item.percentage,
        };
      }),
    [data],
  );

  if (isLoading) return <ChartCardSkeleton />;

  if (!data || data.length === 0) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Distribusi Bank Penerbit</CardTitle>
          <CardDescription>Belum ada data bank penerbit</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Tidak ada data untuk ditampilkan
          </p>
        </CardContent>
      </Card>
    );
  }

  // Adjust display percentages so small segments are at least wide enough for their text
  const MIN_DISPLAY_PERCENTAGE = 8;
  let extraNeeded = 0;
  let availableToSteal = 0;

  const chartDataWithDisplay = chartData.map(item => ({
    ...item,
    originalPercentage: Number(item.percentage) || 0,
    displayPercentage: Number(item.percentage) || 0,
  }));

  chartDataWithDisplay.forEach(item => {
    if (item.originalPercentage > 0 && item.originalPercentage < MIN_DISPLAY_PERCENTAGE) {
      extraNeeded += (MIN_DISPLAY_PERCENTAGE - item.originalPercentage);
    } else if (item.originalPercentage > MIN_DISPLAY_PERCENTAGE) {
      availableToSteal += (item.originalPercentage - MIN_DISPLAY_PERCENTAGE);
    }
  });

  if (extraNeeded > 0 && availableToSteal >= extraNeeded) {
    chartDataWithDisplay.forEach(item => {
      if (item.originalPercentage > 0 && item.originalPercentage < MIN_DISPLAY_PERCENTAGE) {
        item.displayPercentage = MIN_DISPLAY_PERCENTAGE;
      } else if (item.originalPercentage > MIN_DISPLAY_PERCENTAGE) {
        const stolen = ((item.originalPercentage - MIN_DISPLAY_PERCENTAGE) / availableToSteal) * extraNeeded;
        item.displayPercentage = item.originalPercentage - stolen;
      }
    });
  } else if (extraNeeded > 0) {
    // If not enough to steal, just scale everyone proportionally
    const totalWithMins = chartDataWithDisplay.reduce((acc, item) => acc + Math.max(item.originalPercentage, MIN_DISPLAY_PERCENTAGE), 0);
    chartDataWithDisplay.forEach(item => {
      item.displayPercentage = (Math.max(item.originalPercentage, MIN_DISPLAY_PERCENTAGE) / totalWithMins) * 100;
    });
  }

  let accumulatedDisplayPercentage = 0;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Distribusi Bank Penerbit</CardTitle>
        <CardDescription>Jumlah satker per bank penerbit KKP</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-6 pt-0 pb-4">
        <div className="w-full flex flex-col">
          {/* Top visual stack */}
          <div className="relative w-full pt-8">
            {/* Tick marks and labels */}
            <div className="absolute top-0 left-0 w-full h-8">
              {chartDataWithDisplay.map((item, idx) => {
                const displayPercentage = item.displayPercentage;
                const left = accumulatedDisplayPercentage;
                accumulatedDisplayPercentage += displayPercentage;
                
                // Hide label if the segment is too small to avoid overlap
                // We use displayPercentage here, which is guaranteed to be >= 8
                if (displayPercentage < 10) return null;

                return (
                  <div 
                    key={`label-${idx}`} 
                    className="absolute top-0 flex flex-col"
                    style={{ left: `${left}%` }}
                  >
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap -ml-1 mb-1">
                      {item.name}
                    </span>
                    <div className="h-2 w-[2px] bg-border ml-[1px]" />
                  </div>
                );
              })}
            </div>

            {/* The Stacked Bar */}
            <TooltipProvider delayDuration={100}>
              <div className="flex h-12 w-full overflow-hidden rounded-lg bg-muted">
                {chartDataWithDisplay.map((item, idx) => {
                  const percentage = item.originalPercentage;
                  const displayPercentage = item.displayPercentage;
                  if (percentage === 0) return null;
                  const colorConfig = COLORS[idx % COLORS.length]!;
                  return (
                    <Tooltip key={`bar-${idx}`}>
                      <TooltipTrigger asChild>
                        <div
                          className="flex h-full items-center justify-center px-1 transition-all hover:opacity-90 border-r border-background/20 last:border-r-0 overflow-hidden cursor-pointer"
                          style={{ 
                            width: `${displayPercentage}%`, 
                            backgroundColor: colorConfig.bg,
                            color: colorConfig.text
                          }}
                        >
                          <span className="text-xs sm:text-sm font-medium truncate">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="rounded-lg border bg-background p-2.5 shadow-sm text-sm min-w-[200px] text-foreground">
                        <p className="text-xs font-semibold mb-1 text-foreground whitespace-normal">
                          {item.fullName}
                        </p>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: colorConfig.bg === "#ffffff" ? "#cbd5e1" : colorConfig.bg }}
                          />
                          <span className="font-medium">Satker:</span>
                          <span>
                            {item.value.toLocaleString("id-ID")} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
          </div>

          {/* Legend List */}
          <div className="flex flex-col border-t pt-2 mt-6">
            {chartDataWithDisplay.map((item, idx) => {
              const percentage = item.originalPercentage;
              const colorConfig = COLORS[idx % COLORS.length]!;
              return (
                <div 
                  key={`list-${idx}`} 
                  className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-muted/50 px-2 -mx-2 rounded-md transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {/* Color dot/rectangle */}
                    <div 
                      className="h-3 w-3 shrink-0 rounded-sm" 
                      style={{ backgroundColor: colorConfig.bg }} 
                    />
                    <span className="truncate text-sm font-medium text-muted-foreground" title={item.fullName}>
                      {item.fullName}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 pl-4 text-right">
                    <span className="font-semibold text-sm text-foreground min-w-[6rem]">
                      {item.value.toLocaleString("id-ID")} Satker
                    </span>
                    <span className="min-w-[3.5rem] inline-flex items-center justify-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground border border-border/40">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
