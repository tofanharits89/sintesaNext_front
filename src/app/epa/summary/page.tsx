"use client";

import { Suspense } from "react";
import { EpaFilterCard, EpaTabsCard } from "@/components/lazy";
import { Skeleton } from "@/components/ui/skeleton";

// Loading skeleton for the filter card
function FilterCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );
}

// Loading skeleton for the tabs card
function TabsCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EPASummaryPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">EPA Summary</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan dan analisis pelaksanaan Evaluasi Pelaksanaan Anggaran
          (EPA)
        </p>
      </div>

      {/* Filter Section */}
      <Suspense fallback={<FilterCardSkeleton />}>
        <EpaFilterCard />
      </Suspense>

      {/* Tabs Section */}
      <Suspense fallback={<TabsCardSkeleton />}>
        <EpaTabsCard />
      </Suspense>
    </div>
  );
}

// Force dynamic rendering to prevent SSR issues
export const dynamic = "force-dynamic";
