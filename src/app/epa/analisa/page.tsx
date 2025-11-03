"use client";

import { Suspense } from "react";
import { EpaFilterCard } from "@/components/lazy";
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

// Loading skeleton for the table card
function AnalisaCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function AnalisaEPAPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analisa EPA</h1>
        <p className="text-sm text-muted-foreground">
          Analisis dan evaluasi pelaksanaan Electronic Payment Administration (EPA)
        </p>
      </div>

      {/* Filter Section */}
      <Suspense fallback={<FilterCardSkeleton />}>
        <EpaFilterCard />
      </Suspense>

      {/* Analisa EPA Card with Table */}
      <Suspense fallback={<AnalisaCardSkeleton />}>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6">Analisa EPA</h2>
            <div className="border rounded-lg">
              <div className="h-96 flex items-center justify-center text-muted-foreground">
                Table container - waiting for implementation
              </div>
            </div>
          </div>
        </div>
      </Suspense>
    </div>
  );
}

// Force dynamic rendering to prevent SSR issues
export const dynamic = "force-dynamic";
