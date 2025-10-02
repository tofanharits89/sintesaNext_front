import React from "react";
import { Skeleton } from "./skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { cn } from "@/lib/utils";

// Base skeleton component props
interface BaseSkeletonProps {
  className?: string;
}

/**
 * StatCardSkeleton - Loading skeleton for StatCard components
 * Mimics the exact layout of StatCard with proper structure and styling
 */
export function StatCardSkeleton({ className }: BaseSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-lg p-3 bg-white dark:bg-neutral-900 shadow relative",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="mt-1 h-5 w-16" />
    </div>
  );
}

/**
 * QuickStatCardSkeleton - Loading skeleton for QuickStatCard components
 * Matches exact layout with absolute positioned trend badge
 */
export function QuickStatCardSkeleton({ className }: BaseSkeletonProps) {
  return (
    <Card className={cn("shadow", className)}>
      <CardContent className="p-3 relative">
        {/* Trend badge in top-right corner */}
        <Skeleton className="absolute top-2 right-2 h-5 w-12 rounded-full" />
        {/* Label */}
        <Skeleton className="h-3 w-20 mb-1" />
        {/* Value */}
        <Skeleton className="h-6 w-16 mt-1" />
      </CardContent>
    </Card>
  );
}

/**
 * MapSearchCardSkeleton - Loading skeleton for MapSearchCard components
 * Matches exact layout with proper grid structure for search controls
 */
export function MapSearchCardSkeleton({ className }: BaseSkeletonProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-2">
        <CardTitle>
          <Skeleton className="h-4 w-32" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Search controls grid - matches the original 3-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Map area with overlay */}
        <div className="relative">
          <Skeleton className="h-80 w-full rounded-lg" />

          {/* Map stats overlay - positioned like the original */}
          <div className="absolute left-3 bottom-3 w-[min(92vw,360px)]">
            <div className="bg-background/85 backdrop-blur rounded-lg p-3 space-y-2">
              <Skeleton className="h-4 w-20 mb-2" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-18" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * StatsRankingCardSkeleton - Loading skeleton for StatsRankingCard components
 * Matches exact layout with numbered list items (no circles)
 */
export function StatsRankingCardSkeleton({ className }: BaseSkeletonProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-2">
        <CardTitle>
          <Skeleton className="h-4 w-32" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Top 5 section */}
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <div className="space-y-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={`top-${i}`}
                  className="flex items-center justify-between text-sm"
                >
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </div>
          {/* Bottom 5 section */}
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <div className="space-y-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={`bottom-${i}`}
                  className="flex items-center justify-between text-sm"
                >
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * ChartCardSkeleton - Loading skeleton for PlaceholderChartCard components
 * Matches simple placeholder chart layout
 */
export function ChartCardSkeleton({ className }: BaseSkeletonProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-4 w-32" />
        </CardTitle>
        <Skeleton className="h-3 w-20" />
      </CardHeader>
      <CardContent>
        {/* Simple placeholder chart area - matches the dashed border style */}
        <div className="h-[240px] rounded-md border border-dashed border-muted flex items-center justify-center">
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * GenericCardSkeleton - Flexible skeleton for general card layouts
 * Customizable with different content patterns
 */
interface GenericCardSkeletonProps extends BaseSkeletonProps {
  showHeader?: boolean;
  showDescription?: boolean;
  contentLines?: number;
  showFooter?: boolean;
}

export function GenericCardSkeleton({
  className,
  showHeader = true,
  showDescription = false,
  contentLines = 3,
  showFooter = false,
}: GenericCardSkeletonProps) {
  return (
    <Card className={cn("rounded-xl shadow-sm", className)}>
      {showHeader && (
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-32" />
          </CardTitle>
          {showDescription && <Skeleton className="h-4 w-48" />}
        </CardHeader>
      )}

      <CardContent className="space-y-3">
        {Array.from({ length: contentLines }).map((_, i) => (
          <Skeleton
            key={i}
            className={`h-4 ${i === contentLines - 1 ? "w-3/4" : "w-full"}`}
          />
        ))}
      </CardContent>

      {showFooter && (
        <div className="px-6 pb-6">
          <div className="flex justify-between items-center pt-4 border-t">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * FilterCardSkeleton - Loading skeleton for filter cards
 * Based on the existing FilterCardSkeleton pattern
 */
export function FilterCardSkeleton({ className }: BaseSkeletonProps) {
  return (
    <Card className={cn("rounded-xl shadow-sm", className)}>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-24" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Skeleton className="h-10 w-20 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * TabsCardSkeleton - Loading skeleton for tabbed card content
 * Based on the existing TabsCardSkeleton pattern
 */
export function TabsCardSkeleton({ className }: BaseSkeletonProps) {
  return (
    <Card className={cn("rounded-xl shadow-sm", className)}>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-32" />
        </CardTitle>
        <div className="flex space-x-1 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-md" />
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center py-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * BarChartSkeleton - Loading skeleton for bar chart components
 * Mimics the exact BarChartComponent structure with proper padding and layout
 */
export function BarChartSkeleton({
  className,
  height = 300,
}: BaseSkeletonProps & { height?: number }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-48" />
        </CardTitle>
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        {/* Match the exact ResponsiveContainer structure */}
        <div style={{ height }} className="w-full">
          <div className="h-full flex items-end justify-between px-2 py-4">
            {Array.from({ length: 12 }).map((_, i) => {
              const heights = [
                "60%",
                "45%",
                "80%",
                "35%",
                "70%",
                "50%",
                "90%",
                "40%",
                "65%",
                "75%",
                "55%",
                "85%",
              ];
              return (
                <Skeleton
                  key={i}
                  className="w-6 rounded-t-sm"
                  style={{ height: heights[i] }}
                />
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * MultipleBarChartSkeleton - Loading skeleton for multiple bar chart components
 * Mimics the exact MultipleBarChartComponent structure with proper padding and legend positioning
 */
export function MultipleBarChartSkeleton({
  className,
  height = 250,
}: BaseSkeletonProps & { height?: number }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-56" />
        </CardTitle>
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="px-8 pt-0">
        {/* Match the exact ResponsiveContainer structure */}
        <div style={{ height: height + 0 }} className="w-full">
          {/* Chart area with proper margin matching the real component */}
          <div
            className="h-full flex flex-col"
            style={{
              marginTop: 12,
              marginRight: 10,
              marginLeft: 0,
              marginBottom: 4,
            }}
          >
            {/* Chart bars area */}
            <div className="flex-1 flex items-end justify-between px-1 relative">
              {Array.from({ length: 6 }).map((_, i) => {
                // Use deterministic heights to avoid hydration mismatch
                const heights = [
                  [65, 45], [55, 75], [70, 50], [60, 80], [50, 55], [75, 65]
                ];
                const [height1, height2] = heights[i] || [60, 60];
                return (
                  <div key={i} className="flex gap-1 items-end relative">
                    <div className="relative">
                      <Skeleton
                        className="w-8 rounded-t-sm"
                        style={{ height: `${height1}%` }}
                      />
                      {/* Label on top of bar */}
                      <Skeleton className="absolute -top-4 left-1/2 transform -translate-x-1/2 h-2 w-8" />
                    </div>
                    <div className="relative">
                      <Skeleton
                        className="w-8 rounded-t-sm"
                        style={{ height: `${height2}%` }}
                      />
                      {/* Label on top of bar */}
                      <Skeleton className="absolute -top-4 left-1/2 transform -translate-x-1/2 h-2 w-8" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-axis labels area - matching the 56px height from real component */}
            <div className="h-14 flex items-center justify-between px-1 mt-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-12" />
              ))}
            </div>

            {/* Legend area at bottom */}
            <div
              className="flex justify-center gap-6 mt-2"
              style={{ marginBottom: -1 }}
            >
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-sm" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-sm" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * LineChartSkeleton - Loading skeleton for line chart components
 * Mimics the exact LineChartComponent structure with proper responsive container
 */
export function LineChartSkeleton({
  className,
  height = 280,
}: BaseSkeletonProps & { height?: number }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-64" />
        </CardTitle>
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        {/* Match the exact ResponsiveContainer structure */}
        <div style={{ height }} className="w-full">
          <div className="h-full flex flex-col">
            {/* Chart area */}
            <div className="flex-1 relative">
              {/* Simulate line paths */}
              <div className="absolute inset-0 flex items-center justify-between px-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    {/* Data points for multiple lines */}
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-2 w-2 rounded-full" />
                      <Skeleton className="h-2 w-2 rounded-full" />
                      <Skeleton className="h-2 w-2 rounded-full" />
                      <Skeleton className="h-2 w-2 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>

              {/* X-axis labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-3 w-6" />
                ))}
              </div>
            </div>

            {/* Legend at bottom - matching the real component structure */}
            <div className="flex justify-center flex-wrap gap-4 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * DashboardHeaderSkeleton - Loading skeleton for dashboard header with filter
 * Mimics the exact dashboard header structure with proper spacing and sizing
 */
export function DashboardHeaderSkeleton({ className }: BaseSkeletonProps) {
  return (
    <div className={cn("flex items-start justify-between", className)}>
      <div>
        <Skeleton className="h-7 w-52 mb-1" /> {/* text-2xl equivalent */}
        <Skeleton className="h-4 w-80" /> {/* text-sm equivalent */}
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20" /> {/* "Filter Kanwil:" label */}
        <Skeleton className="h-10 w-[180px] rounded-md" />{" "}
        {/* Select component */}
      </div>
    </div>
  );
}
