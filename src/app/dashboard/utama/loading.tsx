import {
  DashboardHeaderSkeleton,
  StatCardSkeleton,
  MultipleBarChartSkeleton,
  LineChartSkeleton,
  BarChartSkeleton,
} from "@/components/ui/dashboard-skeletons";

export default function DashboardUtamaLoading() {
  return (
    <div className="space-y-6">
      <DashboardHeaderSkeleton />

      {/* Quick Stats Section Skeleton */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatCardSkeleton key={`stat-skeleton-${i}`} />
        ))}
      </div>

      {/* Charts Section Skeleton */}
      <div className="space-y-6">
        {/* Second Row: 3 Cards with Bar Charts */}
        <div className="grid gap-4 md:grid-cols-3">
          <MultipleBarChartSkeleton height={250} />
          <MultipleBarChartSkeleton height={250} />
          <MultipleBarChartSkeleton height={250} />
        </div>

        {/* Third Row: 2 Cards with Line Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <LineChartSkeleton height={280} />
          <MultipleBarChartSkeleton height={280} />
        </div>

        {/* Fourth Row: Large Bar Chart */}
        <BarChartSkeleton height={360} />
      </div>
    </div>
  );
}
