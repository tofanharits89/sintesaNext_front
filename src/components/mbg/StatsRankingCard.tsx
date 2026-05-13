"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContents,
  TabsContent,
} from "@/components/animate-ui/components/animate/tabs";

export type RankedItem = {
  name: string;
  value: number;
  percentage: number;
  target?: number | null;
  attainment?: number | null;
  breakdown?: { category: string; value: number }[];
};

export type RankingTab = {
  key: string;
  label: string;
  items: RankedItem[];
  valuePrefix?: string;
  valueSuffix?: string;
  valueFormatter?: ((value: number) => string) | undefined;
};

const PAGE_SIZE = 5;

function RankingList({
  items,
  badgeColor = "blue",
  showTargetBar = false,
  valuePrefix = "",
  valueSuffix = "",
  valueFormatter,
}: {
  items: RankedItem[];
  badgeColor?: "blue" | "orange" | "purple";
  showTargetBar?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  valueFormatter?: ((value: number) => string) | undefined;
}) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pagedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  useEffect(() => {
    setPage((prev) => (prev > totalPages ? totalPages : prev));
  }, [totalPages]);

  // Reset page when items change (tab switch)
  useEffect(() => {
    setPage(1);
  }, [items]);

  const badgeClass =
    badgeColor === "orange"
      ? "border-orange-200 text-orange-700 bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:bg-orange-950/30"
      : badgeColor === "purple"
        ? "border-purple-200 text-purple-700 bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:bg-purple-950/30"
        : "border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:bg-blue-950/30";

  if (items.length === 0) {
    return (
      <div className="rounded-md border px-2 py-2 text-sm text-muted-foreground">
        Tidak ada data.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-2.5">
        {pagedItems.map((it, idx) => (
          <li
            key={`${it.name}-${idx}`}
            className="rounded-lg px-3 py-3 bg-muted/30 border border-transparent hover:border-border transition-colors"
          >
            <div className="flex flex-col gap-2">
              {/* Top Row: Index + Name and Realisasi Value */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs min-w-0 flex-1 truncate">
                  <span className="text-muted-foreground font-medium">
                    {(page - 1) * PAGE_SIZE + idx + 1}.
                  </span>{" "}
                  <span className="font-bold text-foreground">{it.name}</span>
                </span>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold font-mono tabular-nums text-foreground">
                    {valuePrefix}
                    {valueFormatter
                      ? valueFormatter(it.value)
                      : it.value.toLocaleString("id-ID")}
                    {!valueFormatter && valueSuffix}
                  </span>
                  <Badge
                    variant="outline"
                    className={`${badgeClass} text-[10px] px-1.5 py-0 h-4.5 flex items-center shrink-0 font-bold`}
                  >
                    {it.percentage.toFixed(2)}%
                  </Badge>
                </div>
              </div>

              {/* Bottom Row: Target Progress (penerima only) */}
              {showTargetBar && it.target != null && it.target > 0 && (
                <div className="mt-1">
                  <div className="relative w-full bg-muted/50 rounded-md h-5 overflow-hidden border border-muted-foreground/10">
                    {/* Layer 1: Background Text (Muted - visible when bar is behind it) */}
                    <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                      <span className="text-[10px] font-bold tracking-tight text-muted-foreground">
                        Target: {it.target.toLocaleString("id-ID")}
                      </span>
                      <span className="text-[10px] font-bold tracking-tight text-slate-600 dark:text-slate-400">
                        {(it.attainment ?? 0).toFixed(1)}% Capaian
                      </span>
                    </div>

                    {/* Layer 2: Progress Bar (Neutral) */}
                    <div
                      className="absolute inset-0 bg-slate-500 transition-all duration-700 ease-in-out shadow-[inset_-2px_0_4px_rgba(0,0,0,0.1)]"
                      style={{
                        clipPath: `inset(0 ${100 - Math.min(100, it.attainment ?? 0)}% 0 0)`,
                      }}
                    />

                    {/* Layer 3: Foreground Text (White - visible only over the neutral bar) */}
                    <div
                      className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none transition-all duration-700 ease-in-out"
                      style={{
                        clipPath: `inset(0 ${100 - Math.min(100, it.attainment ?? 0)}% 0 0)`,
                      }}
                    >
                      <span className="text-[10px] font-bold tracking-tight text-white whitespace-nowrap">
                        Target: {it.target.toLocaleString("id-ID")}
                      </span>
                      <span className="text-[10px] font-bold tracking-tight text-white whitespace-nowrap">
                        {(it.attainment ?? 0).toFixed(1)}% Capaian
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Breakdown Row: Category distribution (kelompok only) */}
              {it.breakdown && it.breakdown.length > 0 && (
                <div className="mt-1.5 flex flex-col gap-1">
                  <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted/50 border border-muted-foreground/5">
                    {it.breakdown.map((b, bIdx) => {
                      const colors = [
                        "bg-blue-500",
                        "bg-indigo-500",
                        "bg-cyan-500",
                        "bg-sky-500",
                        "bg-teal-500",
                        "bg-slate-400",
                      ];
                      const colorClass = colors[bIdx % colors.length];
                      const width = ((b.value / (it.value || 1)) * 100).toFixed(1);
                      if (parseFloat(width) < 1) return null;
                      return (
                        <div
                          key={bIdx}
                          className={cn("h-full transition-all", colorClass)}
                          style={{ width: `${width}%` }}
                          title={`${b.category}: ${b.value.toLocaleString("id-ID")}`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5 leading-none">
                    {it.breakdown.slice(0, 4).map((b, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-1">
                        <div
                          className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            [
                              "bg-blue-500",
                              "bg-indigo-500",
                              "bg-cyan-500",
                              "bg-sky-500",
                              "bg-teal-500",
                              "bg-slate-400",
                            ][bIdx % 6],
                          )}
                        />
                        <span className="text-[9px] font-medium text-muted-foreground whitespace-nowrap uppercase tracking-tighter">
                          {b.category}: {b.value.toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))}
                    {it.breakdown.length > 4 && (
                      <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">
                        +{it.breakdown.length - 4} LAINNYA
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-muted-foreground">
          Hal {page} / {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
          >
            Sebelumnya
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  );
}

const TAB_BADGE_COLOR: Record<string, "blue" | "orange" | "purple"> = {
  penerima: "blue",
  sppg: "orange",
  petugas: "purple",
  supplier: "orange",
  kelompok: "blue",
  mitra: "purple",
};

export function StatsRankingCard({
  title,
  tabs,
}: {
  title: string;
  tabs: RankingTab[];
}) {
  const firstKey = tabs[0]?.key ?? "";
  const [activeTab, setActiveTab] = useState(firstKey);

  // When the tab list changes (indicator switched), reset to the first tab
  useEffect(() => {
    setActiveTab(tabs[0]?.key ?? "");
  }, [tabs]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="relative w-full h-auto md:h-12 p-2 rounded-xl">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="flex-1 h-10 md:h-full text-xs md:text-sm py-0"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContents className="mt-4">
            {tabs.map((tab) => (
              <TabsContent key={tab.key} value={tab.key} className="p-1">
                <RankingList
                  items={tab.items}
                  badgeColor={TAB_BADGE_COLOR[tab.key] ?? "blue"}
                  showTargetBar={tab.key === "penerima"}
                  valuePrefix={tab.valuePrefix ?? ""}
                  valueSuffix={tab.valueSuffix ?? ""}
                  valueFormatter={tab.valueFormatter}
                />
              </TabsContent>
            ))}
          </TabsContents>
        </Tabs>
      </CardContent>
    </Card>
  );
}
