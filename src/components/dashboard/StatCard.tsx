"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
      "rounded-lg p-3 bg-white dark:bg-neutral-900 shadow border border-gray-200 dark:border-gray-700 relative",
      className
    )}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className={cn("mt-1 text-lg font-semibold", valueClassName)}>
        {loading ? "..." : value}
      </p>
    </div>
  );
}

