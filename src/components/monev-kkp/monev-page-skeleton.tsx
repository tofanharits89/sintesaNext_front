"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { Skeleton } from "@/components/ui/skeleton";

interface MonevKkpPageSkeletonProps {
  actionCount?: number;
  tabCount?: number;
  filterCount?: number;
  showStatusBadge?: boolean;
}

export function MonevKkpPageSkeleton({
  actionCount = 0,
  tabCount = 0,
  filterCount = 3,
  showStatusBadge = false,
}: MonevKkpPageSkeletonProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        </div>
        {actionCount > 0 ? (
          <div className="flex items-center gap-2">
            {Array.from({ length: actionCount }).map((_, idx) => (
              <Skeleton key={`action-${idx}`} className="h-10 w-28" />
            ))}
          </div>
        ) : null}
      </div>

      {tabCount > 0 ? (
        <div className="border-b border-border/50 pb-3 mb-0">
          <div className="w-full h-auto md:h-14 p-2 rounded-xl border bg-muted/20 flex flex-col md:flex-row gap-2">
            {Array.from({ length: tabCount }).map((_, idx) => (
              <Skeleton key={`tab-${idx}`} className="h-12 md:h-full flex-1" />
            ))}
          </div>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              <Skeleton className="h-6 w-24" />
            </CardTitle>
            <Skeleton className="h-9 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 rounded-lg border bg-muted/20 space-y-3">
            <Skeleton className="h-4 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>

          <div className={`grid grid-cols-1 gap-4 ${filterCount >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
            {Array.from({ length: filterCount }).map((_, idx) => (
              <div key={`filter-${idx}`} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              <Skeleton className="h-6 w-56" />
            </CardTitle>
            {showStatusBadge ? <Skeleton className="h-6 w-28" /> : null}
          </div>
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={10} />
        </CardContent>
      </Card>
    </div>
  );
}

export default MonevKkpPageSkeleton;
