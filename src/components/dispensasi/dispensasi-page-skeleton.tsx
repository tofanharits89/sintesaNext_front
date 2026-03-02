"use client";

import { usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { Skeleton } from "@/components/ui/skeleton";

function DispensasiLlatSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-72 max-w-full" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      <section className="space-y-3">
        <div className="w-full h-auto p-2 rounded-xl border bg-muted/20 grid grid-cols-2 lg:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={`tab-${idx}`} className="h-10 w-full" />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>

        <Card>
          <CardContent className="p-4">
            <TableSkeleton rows={10} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function DispensasiKontrakKppnSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-64 max-w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <TableSkeleton rows={10} />
        </CardContent>
      </Card>
    </div>
  );
}

export function DispensasiPageSkeleton() {
  const pathname = usePathname();

  if (pathname?.includes("/dispensasi/kontrak-kppn")) {
    return <DispensasiKontrakKppnSkeleton />;
  }

  return <DispensasiLlatSkeleton />;
}

export default DispensasiPageSkeleton;
