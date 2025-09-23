"use client";
import { StatCardSkeleton, MultipleBarChartSkeleton, LineChartSkeleton } from "@/components/ui/dashboard-skeletons";

export default function DashboardSupplierSkeleton() {
  return (
    <div className="space-y-6">
      {/* Quick stats cards matching StatCard layout */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Top vendors charts (Kontraktual & Non-Kontraktual values) */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MultipleBarChartSkeleton height={340} />
        <MultipleBarChartSkeleton height={340} />
      </div>

      {/* Count-based rankings (Kontraktual & Non-Kontraktual counts) */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MultipleBarChartSkeleton height={340} />
        <MultipleBarChartSkeleton height={340} />
      </div>

      {/* Trend line chart */}
      <div className="mt-6">
        <LineChartSkeleton height={360} />
      </div>
    </div>
  );
}
