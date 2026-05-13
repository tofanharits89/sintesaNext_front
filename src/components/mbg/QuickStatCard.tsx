"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/utils";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickStatBreakdownModal } from "./QuickStatBreakdownModal";

export function QuickStatCard({
  label,
  icon,
  value,
  trend,
  trendVariant = "neutral",
  breakdown,
}: {
  label: string;
  icon?: ReactNode;
  value: string;
  trend?: string;
  trendVariant?: "up" | "down" | "neutral";
  breakdown?: { category: string; value: number }[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const badgeClasses =
    trendVariant === "up"
      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
      : trendVariant === "down"
      ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
      : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";

  return (
    <>
      <div className="rounded-lg p-3 pr-6 bg-card text-card-foreground shadow border relative group">
        {breakdown && breakdown.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-7 w-7 rounded-full text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 z-20"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            title={`Lihat Detail ${label}`}
          >
            <Info className="h-4 w-4" />
          </Button>
        )}

        {trend && (
          <Badge
            variant="secondary"
            className={cn(
              "absolute top-2 text-xs z-10",
              breakdown && breakdown.length > 0 ? "right-8" : "right-2",
              badgeClasses
            )}
          >
            {trend}
          </Badge>
        )}

        <div className="flex items-center gap-2">
          {icon}
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <p className="mt-1 text-lg font-semibold font-mono text-right">{value}</p>
      </div>

      {breakdown && (
        <QuickStatBreakdownModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          title={label}
          data={breakdown}
        />
      )}
    </>
  );
}

