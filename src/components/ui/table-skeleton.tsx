import React from "react";
import { cn } from "@/lib/utils/utils";

export function TableSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-md border border-zinc-200", className)}>
      {/* Header row */}
      <div className="flex items-center gap-3 bg-zinc-100/80 px-4 py-3 border-b border-zinc-200">
        <div className="h-3 w-1/4 rounded bg-zinc-300/70 animate-pulse" />
        <div className="h-3 w-1/6 rounded bg-zinc-300/70 animate-pulse" />
        <div className="h-3 w-1/6 rounded bg-zinc-300/70 animate-pulse ml-auto" />
        <div className="h-3 w-1/6 rounded bg-zinc-300/70 animate-pulse" />
        <div className="h-3 w-1/8 rounded bg-zinc-300/70 animate-pulse" />
      </div>
      {/* Body rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center gap-3 px-4 py-3 border-b border-zinc-200 last:border-b-0",
            i % 2 === 0 ? "bg-white" : "bg-zinc-50/40"
          )}
        >
          <div className="h-3 rounded bg-zinc-200/80 animate-pulse" style={{ width: `${30 + (i * 7) % 30}%` }} />
          <div className="h-3 w-1/6 rounded bg-zinc-200/80 animate-pulse ml-auto" />
          <div className="h-3 w-1/6 rounded bg-zinc-200/80 animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-zinc-200/80 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
