"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type RankedItem = { name: string; value: number; percentage: number };

const PAGE_SIZE = 8;

export function StatsRankingCard({
  title,
  items,
}: {
  title: string;
  items: RankedItem[];
}) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pagedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return items.slice(start, end);
  }, [items, page]);

  useEffect(() => {
    setPage((prev) => (prev > totalPages ? totalPages : prev));
  }, [totalPages]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Ranking Penerima Manfaat</h4>
          {pagedItems.length === 0 ? (
            <div className="rounded-md border px-2 py-2 text-sm text-muted-foreground">
              Tidak ada data.
            </div>
          ) : (
            <ul className="space-y-2.5">
              {pagedItems.map((it, idx) => (
                <li
                  key={`${it.name}-${idx}`}
                  className="rounded-md px-2 py-2.5 bg-background"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm min-w-0">
                      {(page - 1) * PAGE_SIZE + idx + 1}. <span className="font-semibold">{it.name}</span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-medium font-mono tabular-nums">
                        {it.value.toLocaleString("id-ID")}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:bg-blue-950/30"
                      >
                        {it.percentage.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

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
      </CardContent>
    </Card>
  );
}

