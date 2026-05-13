"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

/**
 * ProgramCardSkeleton - Loading skeleton for ProgramCard components
 * Mimics the exact layout of ProgramCard with proper structure and styling
 */
export function ProgramCardSkeleton() {
  return (
    <Card className="flex flex-col overflow-hidden animate-pulse">
      {/* Card Header */}
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-6 w-3/4 rounded-md" /> {/* CardTitle */}
            <div className="mt-1 flex items-center gap-2">
              <Skeleton className="h-4 w-10 rounded bg-muted" /> {/* CODE badge */}
              <Skeleton className="h-3 w-16" /> {/* code description */}
            </div>
          </div>
          <Skeleton className="h-9 w-9 rounded-full" /> {/* Info button */}
        </div>
      </CardHeader>

      {/* Card Body */}
      <CardContent>
        <div className="flex gap-4 items-center">
          {/* Left side: Donut Chart */}
          <div className="w-36 h-36 flex-shrink-0 flex items-center justify-center">
            <Skeleton className="h-32 w-32 rounded-full border-4 border-muted" />
          </div>

          {/* Right side: Info */}
          <div className="flex-1 space-y-4 flex flex-col items-end">
            {/* Pagu */}
            <div className="space-y-1 flex flex-col items-end">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-5 w-28" />
            </div>

            {/* Realisasi */}
            <div className="space-y-1 flex flex-col items-end">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-32" />
            </div>

            {/* Blokir */}
            <div className="space-y-1 flex flex-col items-end">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        </div>
      </CardContent>

      {/* Card Footer */}
      <CardFooter className="pt-2 border-t border-border/50 bg-muted/5">
        <div className="w-full flex justify-between items-center">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardFooter>
    </Card>
  );
}

/**
 * ProgramDashboardSkeleton - Loading skeleton for the entire program dashboard
 * Mimics the exact layout of DashboardProgramPage with proper structure and styling
 */
export function ProgramDashboardSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <ProgramCardSkeleton key={i} />
      ))}
    </div>
  );
}
