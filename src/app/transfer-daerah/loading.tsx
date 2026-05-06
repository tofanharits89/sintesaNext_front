import { Skeleton } from "@/components/ui/skeleton";
import { GenericCardSkeleton } from "@/components/ui/dashboard-skeletons";

export default function TransferDaerahLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-1" /> {/* Title */}
          <Skeleton className="h-4 w-80" /> {/* Subtitle */}
        </div>
      </div>

      {/* Main Content Tabs Skeleton */}
      <div className="w-full space-y-6">
        <div className="border-b border-border/50 pb-3 mb-0">
          <div className="w-full h-auto md:h-14 p-2 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-0 bg-muted/20">
            <Skeleton className="h-10 md:h-full rounded-lg mx-1" />
            <Skeleton className="h-10 md:h-full rounded-lg mx-1" />
            <Skeleton className="h-10 md:h-full rounded-lg mx-1" />
          </div>
        </div>

        {/* Tab Content Placeholder */}
        <GenericCardSkeleton showHeader={false} contentLines={15} />
      </div>
    </div>
  );
}
