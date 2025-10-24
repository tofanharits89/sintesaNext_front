"use client";

import { cn } from "@/lib/utils";
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
    <div className="rounded-lg p-3 bg-card text-card-foreground shadow border relative">
      {trend && (
        <Badge variant="secondary" className={cn("absolute top-2 right-2 text-xs", badgeClasses)}>
          {trend}
        </Badge>
      )}
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

