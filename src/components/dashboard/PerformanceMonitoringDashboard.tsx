"use client";

import { useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "@/components/animate-ui/components/animate/tabs";
import { QueryErrorBoundary } from "@/components/ui/query-error-boundary";
import { 
  usePerformanceMetrics, 
  useMonitoringControls, 
  useHistoricalData 
} from "@/hooks/monitoring";
import { 
  MonitoringControls, 
  KeyMetricsCards 
} from "@/components/monitoring/sections";
import {
  MonitoringControlsSkeleton,
  KeyMetricsCardsSkeleton,
  TabContentSkeleton,
  TabsListSkeleton
} from "@/components/monitoring/skeletons/PerformanceMonitoringSkeleton";
import {
  CacheMetricsTab,
  CompressionTab,
  RealtimeTab,
  HealthTab,
  AnalyticsTab
} from "@/components/monitoring/tabs";
import type { TimeRange } from "@/types/monitoring";

export function PerformanceMonitoringDashboard() {
  const metrics = usePerformanceMetrics();
  const controls = useMonitoringControls();
  const historicalData = useHistoricalData(controls.selectedTimeRange);

  // Auto-refresh effect
  useEffect(() => {
    if (!controls.isAutoRefresh) return;

    const interval = setInterval(() => {
      metrics.refetch();
      historicalData.refetch();
    }, controls.refreshInterval);

    return () => clearInterval(interval);
  }, [controls.isAutoRefresh, controls.refreshInterval, metrics, historicalData]);

  // Generate mock data when API fails
  useEffect(() => {
    if (historicalData.error && historicalData.error.includes('mock')) {
      historicalData.generateMockData();
    }
  }, [historicalData.error, historicalData]);

  return (
    <div className="space-y-6">
      {/* Monitoring Controls Section */}
      <QueryErrorBoundary
        fallback={
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-red-500">Failed to load controls</div>
            </CardContent>
          </Card>
        }
      >
        <Suspense fallback={<MonitoringControlsSkeleton />}>
          {metrics.metrics ? (
            <MonitoringControls
              metrics={metrics.metrics}
              controls={controls}
              lastUpdated={metrics.lastUpdated}
              loading={metrics.loading}
              onTimeRangeChange={controls.handleTimeRangeChange}
              onRefresh={metrics.refetch}
              onAutoRefreshToggle={controls.toggleAutoRefresh}
            />
          ) : (
            <MonitoringControlsSkeleton />
          )}
        </Suspense>
      </QueryErrorBoundary>

      {/* Key Metrics Cards Section */}
      <QueryErrorBoundary
        fallback={
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-red-500">Failed to load metrics</div>
            </CardContent>
          </Card>
        }
      >
        <Suspense fallback={<KeyMetricsCardsSkeleton />}>
          {metrics.metrics ? (
            <KeyMetricsCards
              metrics={metrics.metrics}
              loading={metrics.loading}
            />
          ) : (
            <KeyMetricsCardsSkeleton />
          )}
        </Suspense>
      </QueryErrorBoundary>

      {/* Tabs Section */}
      <QueryErrorBoundary
        fallback={
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-red-500">Failed to load tabs</div>
            </CardContent>
          </Card>
        }
      >
        <Tabs defaultValue="cache" className="w-full gap-3">
          <div className="border-b border-border/50 pb-3 mb-0">
            <Suspense fallback={<TabsListSkeleton />}>
              <TabsList className="w-full h-12 md:h-14 p-2 rounded-xl">
                <TabsTrigger value="cache" className="h-full px-4 md:px-5 py-0 text-base">Cache Metrics</TabsTrigger>
                <TabsTrigger value="compression" className="h-full px-4 md:px-5 py-0 text-base">Compression</TabsTrigger>
                <TabsTrigger value="realtime" className="h-full px-4 md:px-5 py-0 text-base">Real-time</TabsTrigger>
                <TabsTrigger value="health" className="h-full px-4 md:px-5 py-0 text-base">Health Status</TabsTrigger>
                <TabsTrigger value="analytics" className="h-full px-4 md:px-5 py-0 text-base">Analytics</TabsTrigger>
              </TabsList>
            </Suspense>
          </div>

          <TabsContents>
            <TabsContent value="cache">
              <QueryErrorBoundary fallback={<TabContentSkeleton />}>
                <Suspense fallback={<TabContentSkeleton />}>
                  {metrics.metrics ? (
                    <CacheMetricsTab metrics={metrics.metrics} />
                  ) : (
                    <TabContentSkeleton />
                  )}
                </Suspense>
              </QueryErrorBoundary>
            </TabsContent>

            <TabsContent value="compression">
              <QueryErrorBoundary fallback={<TabContentSkeleton />}>
                <Suspense fallback={<TabContentSkeleton />}>
                  {metrics.metrics ? (
                    <CompressionTab metrics={metrics.metrics} />
                  ) : (
                    <TabContentSkeleton />
                  )}
                </Suspense>
              </QueryErrorBoundary>
            </TabsContent>

            <TabsContent value="realtime">
              <QueryErrorBoundary fallback={<TabContentSkeleton />}>
                <Suspense fallback={<TabContentSkeleton />}>
                  {metrics.metrics ? (
                    <RealtimeTab metrics={metrics.metrics} />
                  ) : (
                    <TabContentSkeleton />
                  )}
                </Suspense>
              </QueryErrorBoundary>
            </TabsContent>

            <TabsContent value="health">
              <QueryErrorBoundary fallback={<TabContentSkeleton />}>
                <Suspense fallback={<TabContentSkeleton />}>
                  {metrics.metrics ? (
                    <HealthTab metrics={metrics.metrics} />
                  ) : (
                    <TabContentSkeleton />
                  )}
                </Suspense>
              </QueryErrorBoundary>
            </TabsContent>

            <TabsContent value="analytics">
              <QueryErrorBoundary fallback={<TabContentSkeleton />}>
                <Suspense fallback={<TabContentSkeleton />}>
                  {metrics.metrics && historicalData.historicalData ? (
                    <AnalyticsTab
                      metrics={metrics.metrics}
                      historicalData={historicalData.historicalData}
                      selectedTimeRange={controls.selectedTimeRange}
                    />
                  ) : (
                    <TabContentSkeleton />
                  )}
                </Suspense>
              </QueryErrorBoundary>
            </TabsContent>
          </TabsContents>
        </Tabs>
      </QueryErrorBoundary>
    </div>
  );
}