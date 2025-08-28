"use client";

import type { ReactNode } from "react";

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
  className = "rounded-lg p-3 bg-white dark:bg-neutral-900 shadow relative",
  valueClassName = "mt-1 text-lg font-semibold",
}: StatCardProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className={valueClassName}>{loading ? "..." : value}</p>
    </div>
  );
}

