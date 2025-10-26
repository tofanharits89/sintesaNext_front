"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/utils";

interface StatCardProps {
  label: string;
  icon: ReactNode;
  value?: string | number;
  loading?: boolean;
  className?: string;
  valueClassName?: string;
}

export function StatCard({
  label,
  icon,
  value,
  loading = false,
  className,
  valueClassName,
}: StatCardProps) {
  return (
    <div className={cn(
      "rounded-lg p-3 bg-card text-card-foreground shadow border relative",
      className
    )}>
      <div className="flex items-center gap-2">
        {loading ? (
          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ) : (
          icon
        )}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      {loading ? (
        <div className="mt-1 h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      ) : (
        <p className={cn("mt-1 text-lg font-semibold", valueClassName)}>
          {value}
        </p>
      )}
    </div>
  );
}

