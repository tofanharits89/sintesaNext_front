"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function QuickStatCard({
  label,
  value,
  trend,
  trendVariant = "neutral",
}: {
  label: string;
  value: string;
  trend?: string;
  trendVariant?: "up" | "down" | "neutral";
}) {
  const badgeClasses =
    trendVariant === "up"
      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
      : trendVariant === "down"
      ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
      : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";

  return (
    <Card className="shadow">
      <CardContent className="p-3 relative">
        {trend && (
          <Badge variant="secondary" className={`absolute top-2 right-2 text-xs ${badgeClasses}`}>
            {trend}
          </Badge>
        )}
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-lg font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

