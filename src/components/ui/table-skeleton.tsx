import React from "react";
import { cn } from "@/lib/utils/utils";

export function TableSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3 animate-pulse", className)}>
      <div className="h-10 bg-muted rounded-md w-full" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 bg-muted/50 rounded-md w-full" />
        ))}
      </div>
      <div className="h-10 bg-muted rounded-md w-full" />
    </div>
  );
}
