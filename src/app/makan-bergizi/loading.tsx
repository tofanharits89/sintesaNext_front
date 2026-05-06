import {
  QuickStatCardSkeleton,
  MapSearchCardSkeleton,
  StatsRankingCardSkeleton,
  ChartCardSkeleton,
} from "@/components/ui/dashboard-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function MakanBergiziLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-56 mb-1" /> {/* Title */}
          <Skeleton className="h-4 w-80" /> {/* Subtitle */}
          <Skeleton className="h-3 w-48 mt-1" /> {/* Last Update */}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-12" /> {/* "Tahun:" label */}
            <Skeleton className="h-9 w-[100px] rounded-md" /> {/* Select */}
          </div>
          <Skeleton className="h-9 w-9 rounded-md" /> {/* Refresh button */}
        </div>
      </div>

      {/* Row 1: Quick Stats (6 cards) */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <QuickStatCardSkeleton key={`skeleton-${i}`} />
        ))}
      </div>

      {/* Row 2: Map (75%) + Stats (25%) */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-4">
        <div className="xl:col-span-3">
          <MapSearchCardSkeleton className="h-96" />
        </div>
        <div className="xl:col-span-1">
          <StatsRankingCardSkeleton />
        </div>
      </div>

      {/* Row 3: charts */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ChartCardSkeleton key={`chart-skeleton-${i}`} />
        ))}
      </div>
    </div>
  );
}
