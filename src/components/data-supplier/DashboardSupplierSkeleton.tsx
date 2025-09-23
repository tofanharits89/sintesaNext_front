"use client";
import { GenericCardSkeleton, BarChartSkeleton, LineChartSkeleton } from "@/components/ui/dashboard-skeletons";

export default function DashboardSupplierSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GenericCardSkeleton className="h-full" showHeader contentLines={1} />
        <GenericCardSkeleton className="h-full" showHeader contentLines={1} />
        <GenericCardSkeleton className="h-full" showHeader contentLines={1} />
      </div>

      {/* Top vendors charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        <BarChartSkeleton height={320} />
        <BarChartSkeleton height={320} />
      </div>

      {/* Trend line chart */}
      <div className="mt-2">
        <LineChartSkeleton height={360} />
      </div>
    </div>
  );
}
