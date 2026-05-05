import {
  GenericCardSkeleton,
  FilterCardSkeleton,
} from "@/components/ui/dashboard-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function InquiryDataLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-1" /> {/* Title */}
          <Skeleton className="h-4 w-[500px]" /> {/* Subtitle */}
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32 rounded-md" /> {/* Button 1 */}
          <Skeleton className="h-10 w-32 rounded-md" /> {/* Button 2 */}
          <Skeleton className="h-8 w-20 rounded hidden sm:block" /> {/* Shortcut hint */}
        </div>
      </div>

      {/* Main Content Skeleton - Three Cards */}
      <div className="space-y-6">
        <GenericCardSkeleton showHeader contentLines={4} />
        <GenericCardSkeleton showHeader contentLines={3} />
        <FilterCardSkeleton />
      </div>
    </div>
  );
}
