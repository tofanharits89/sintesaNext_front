"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList } from "@/components/ui/tabs";

/**
 * Performance Monitoring Dashboard Skeleton
 * Detailed matching skeleton for the monitor performa page
 */

// Monitoring Controls Skeleton - Matches the actual MonitoringControls component
function MonitoringControlsSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4 animate-pulse">
        {/* Select Trigger - matches Select component */}
        <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
          <Skeleton className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded" />
        </div>
        
        {/* Refresh Button - matches Button component */}
        <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
          <Skeleton className="h-4 w-8 bg-gray-300 dark:bg-gray-600 rounded" />
        </div>
        
        {/* Auto-refresh Switch - matches Switch component */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-11 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <Skeleton className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        
        {/* Health Status Badge - matches Badge component */}
        <Skeleton className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
        
        {/* Last Updated Text */}
        <Skeleton className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

// Key Metrics Cards Skeleton - Matches the actual StatCard components
function KeyMetricsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="p-3 shadow border">
          <div className="animate-pulse">
            {/* Icon placeholder */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
              {/* Label */}
              <Skeleton className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            
            {/* Value */}
            <Skeleton className="mt-1 h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </Card>
      ))}
    </div>
  );
}

// Tab Content Skeleton - Matches actual tab content structure
function TabContentSkeleton() {
  return (
    <div className="space-y-4">
      {/* Top grid cards - matches Cache Metrics and Compression tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* First card - matches Cache Statistics card */}
        <Card>
          <CardHeader>
            <div className="animate-pulse">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded" />
                <Skeleton className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress bar section */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                <Skeleton className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <Skeleton className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <Skeleton className="h-4 w-20 mb-2 bg-gray-200 dark:bg-gray-700 rounded" />
                <Skeleton className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div>
                <Skeleton className="h-4 w-20 mb-2 bg-gray-200 dark:bg-gray-700 rounded" />
                <Skeleton className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Second card - matches Category Breakdown or Algorithm Usage card */}
        <Card>
          <CardHeader>
            <div className="animate-pulse">
              <Skeleton className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </CardHeader>
          <CardContent>
            {/* Progress sections */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                  <Skeleton className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <Skeleton className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                  <Skeleton className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <Skeleton className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Tabs List Skeleton - Matches the actual TabsList component
function TabsListSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
        <div className="flex space-x-1">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 min-w-[120px] bg-gray-300 dark:bg-gray-600 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Main Performance Monitoring Skeleton
export function PerformanceMonitoringSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Monitoring Controls */}
      <MonitoringControlsSkeleton />

      {/* Key Metrics Cards */}
      <KeyMetricsCardsSkeleton />

      {/* Tabs and Content */}
      <div className="space-y-4">
        {/* Tabs */}
        <TabsListSkeleton />

        {/* Tab Content */}
        <TabContentSkeleton />
      </div>
    </div>
  );
}

// Export individual skeleton components for flexibility
export {
  MonitoringControlsSkeleton,
  KeyMetricsCardsSkeleton,
  TabContentSkeleton,
  TabsListSkeleton
};
