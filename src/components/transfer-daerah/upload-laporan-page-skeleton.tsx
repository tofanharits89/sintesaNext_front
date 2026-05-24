"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { Skeleton } from "@/components/ui/skeleton";

export function UploadLaporanPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Skeleton className="h-8 w-44" />
          <Skeleton className="mt-2 h-4 w-72 max-w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-[130px]" />
          <Skeleton className="h-10 w-[130px]" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="border-b border-border/50 pb-3 mb-0">
        <div className="w-full h-auto md:h-14 p-2 rounded-xl border bg-muted/20 grid grid-cols-1 md:grid-cols-3 gap-2">
          <Skeleton className="h-12 md:h-full" />
          <Skeleton className="h-12 md:h-full" />
          <Skeleton className="h-12 md:h-full" />
        </div>
      </div>

      {/* Table card skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-52" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={10} />
        </CardContent>
      </Card>
    </div>
  );
}
