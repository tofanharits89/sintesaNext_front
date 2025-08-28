import React from 'react';
import { Skeleton } from './skeleton';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { cn } from '@/lib/utils';

// Base skeleton component props
interface BaseSkeletonProps {
  className?: string;
}

/**
 * StatCardSkeleton - Loading skeleton for StatCard components
 * Mimics the layout of StatCard with icon, label, and value
 */
export function StatCardSkeleton({ className }: BaseSkeletonProps) {
  return (
    <Card className={cn('rounded-xl shadow-sm', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-3 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * QuickStatCardSkeleton - Loading skeleton for QuickStatCard components
 * Includes trend badge placeholder
 */
export function QuickStatCardSkeleton({ className }: BaseSkeletonProps) {
  return (
    <Card className={cn('rounded-xl shadow-sm', className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Skeleton className="h-7 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * MapSearchCardSkeleton - Loading skeleton for MapSearchCard components
 * Includes search input and map area placeholders
 */
export function MapSearchCardSkeleton({ className }: BaseSkeletonProps) {
  return (
    <Card className={cn('rounded-xl shadow-sm', className)}>
      <CardHeader className="pb-4">
        <CardTitle>
          <Skeleton className="h-6 w-32" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-md" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
        
        <div className="relative">
          <Skeleton className="h-64 w-full rounded-lg" />
          
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
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
 * Includes top and bottom ranking lists
 */
export function StatsRankingCardSkeleton({ className }: BaseSkeletonProps) {
  return (
    <Card className={cn('rounded-xl shadow-sm', className)}>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-40" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-5 w-16" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`top-${i}`} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          <Skeleton className="h-5 w-20" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`bottom-${i}`} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * ChartCardSkeleton - Loading skeleton for PlaceholderChartCard components
 * Includes chart area and optional description
 */
export function ChartCardSkeleton({ className }: BaseSkeletonProps) {
  return (
    <Card className={cn('rounded-xl shadow-sm', className)}>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-36" />
        </CardTitle>
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          
          <Skeleton className="h-64 w-full rounded-lg" />
          
          <div className="flex justify-between pt-2">
            <div className="text-center">
              <Skeleton className="h-4 w-12 mx-auto mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="text-center">
              <Skeleton className="h-4 w-12 mx-auto mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="text-center">
              <Skeleton className="h-4 w-12 mx-auto mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
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
  showFooter = false 
}: GenericCardSkeletonProps) {
  return (
    <Card className={cn('rounded-xl shadow-sm', className)}>
      {showHeader && (
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-32" />
          </CardTitle>
          {showDescription && (
            <Skeleton className="h-4 w-48" />
          )}
        </CardHeader>
      )}
      
      <CardContent className="space-y-3">
        {Array.from({ length: contentLines }).map((_, i) => (
          <Skeleton 
            key={i} 
            className={`h-4 ${i === contentLines - 1 ? 'w-3/4' : 'w-full'}`} 
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
    <Card className={cn('rounded-xl shadow-sm', className)}>
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
    <Card className={cn('rounded-xl shadow-sm', className)}>
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

// Export all skeleton components
export {
  StatCardSkeleton,
  QuickStatCardSkeleton,
  MapSearchCardSkeleton,
  StatsRankingCardSkeleton,
  ChartCardSkeleton,
  GenericCardSkeleton,
  FilterCardSkeleton,
  TabsCardSkeleton,
};

// Default export for convenience
export default {
  StatCard: StatCardSkeleton,
  QuickStatCard: QuickStatCardSkeleton,
  MapSearchCard: MapSearchCardSkeleton,
  StatsRankingCard: StatsRankingCardSkeleton,
  ChartCard: ChartCardSkeleton,
  Generic: GenericCardSkeleton,
  FilterCard: FilterCardSkeleton,
  TabsCard: TabsCardSkeleton,
};