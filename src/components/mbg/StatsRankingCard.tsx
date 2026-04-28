"use client";

import { useEffect, useMemo, useState } from "react";
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

export type RankedItem = { name: string; value: number; percentage: number };

export type RankingTab = {
  key: string;
  label: string;
  items: RankedItem[];
  valuePrefix?: string;
  valueSuffix?: string;
};

const PAGE_SIZE = 8;

function RankingList({
  items,
  badgeColor = "blue",
  valuePrefix = "",
  valueSuffix = "",
}: {
  items: RankedItem[];
  badgeColor?: "blue" | "orange" | "purple";
  valuePrefix?: string | undefined;
  valueSuffix?: string | undefined;
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
            className="rounded-md px-2 py-2.5 bg-background"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm min-w-0">
                {(page - 1) * PAGE_SIZE + idx + 1}.{" "}
                <span className="font-semibold">{it.name}</span>
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-medium font-mono tabular-nums">
                  {valuePrefix}
                  {it.value.toLocaleString("id-ID")}
                  {valueSuffix}
                </span>
                <Badge variant="outline" className={badgeClass}>
                  {it.percentage.toFixed(2)}%
                </Badge>
              </div>
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
};

export function StatsRankingCard({
  title,
  tabs,
}: {
  title: string;
  tabs: RankingTab[];
}) {
  const defaultTab = tabs[0]?.key ?? "";

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab} className="w-full">
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
                  valuePrefix={tab.valuePrefix}
                  valueSuffix={tab.valueSuffix}
                />
              </TabsContent>
            ))}
          </TabsContents>
        </Tabs>
      </CardContent>
    </Card>
  );
}
