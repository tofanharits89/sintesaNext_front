"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type RankedItem = { name: string; value: number };

export function StatsRankingCard({
  title,
  topItems,
  bottomItems,
}: {
  title: string;
  topItems: RankedItem[];
  bottomItems: RankedItem[];
}) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Top 5 Realisasi</h4>
            <ul className="space-y-1">
              {topItems.map((it, idx) => (
                <li key={idx} className="flex items-center justify-between text-sm">
                  <span className="truncate">{idx + 1}. {it.name}</span>
                  <span className="font-medium">{it.value.toLocaleString("id-ID")}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">Bottom 5 Realisasi</h4>
            <ul className="space-y-1">
              {bottomItems.map((it, idx) => (
                <li key={idx} className="flex items-center justify-between text-sm">
                  <span className="truncate">{idx + 1}. {it.name}</span>
                  <span className="font-medium">{it.value.toLocaleString("id-ID")}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

