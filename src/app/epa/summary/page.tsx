"use client";

import { Suspense } from "react";
import { EpaFilterCard, EpaTabsCard } from "@/components/lazy";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Loading skeleton for the filter card - matches FilterCard component structure
function FilterCardSkeleton(): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_: unknown, i: number) => (
            <div key={i} className="space-y-2 min-w-0">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Loading skeleton for the tabs card - matches TabsCard component structure
function TabsCardSkeleton(): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-64" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <div className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
            {Array.from({ length: 6 }).map((_: unknown, i: number) => (
              <Skeleton
                key={i}
                className="h-20 w-full rounded-md"
              />
            ))}
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_: unknown, i: number) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-5 w-5 rounded" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <Skeleton className="h-64 w-full rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EPASummaryPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">EPA Summary</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan dan analisis pelaksanaan Electronic Payment Administration
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
export const dynamic = 'force-dynamic';
