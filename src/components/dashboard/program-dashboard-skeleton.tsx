"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

/**
 * ProgramCardSkeleton - Loading skeleton for ProgramCard components
 * Mimics the exact layout of ProgramCard with proper structure and styling
 */
export function ProgramCardSkeleton() {
  return (
    <Card className="flex flex-col overflow-hidden">
      {/* Card Header */}
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-5 w-3/4" /> {/* CardTitle */}
            <Skeleton className="h-3 w-20" /> {/* CardDescription */}
          </div>
          <Skeleton className="h-8 w-8 rounded-md" /> {/* Info button */}
        </div>
      </CardHeader>

      {/* Card Body */}
      <CardContent>
        <div className="flex gap-2">
          {/* Left side: Info */}
          <div className="flex-1 space-y-1">
            {/* Pagu */}
            <div className="space-y-1">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-4 w-24" />
            </div>

            {/* Realisasi */}
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>

            {/* Blokir */}
            <div className="space-y-1">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          {/* Right side: Donut Chart */}
          <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center overflow-hidden">
            <Skeleton className="h-24 w-24 rounded-full" />
          </div>
        </div>
      </CardContent>

      {/* Card Footer */}
      <CardFooter>
        <div className="w-full">
          <Skeleton className="h-3 w-20" />
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
