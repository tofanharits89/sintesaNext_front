"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "@/components/animate-ui/components/animate/tabs";
import { 
  usePerformanceMetrics, 
  useMonitoringControls, 
  useHistoricalData 
} from "@/hooks/monitoring";
import { 
  MonitoringControls, 
  KeyMetricsCards 
} from "@/components/monitoring/sections";
import { PerformanceMonitoringSkeleton } from "@/components/monitoring/skeletons/PerformanceMonitoringSkeleton";
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

  if (metrics.loading && !metrics.metrics) {
    return <PerformanceMonitoringSkeleton />;
  }

  if (metrics.error && !metrics.metrics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Failed to load performance metrics. Please try again.
            <p className="text-sm text-red-500 mt-2">{metrics.error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics.metrics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No performance data available.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <MonitoringControls
        metrics={metrics.metrics}
        controls={controls}
        lastUpdated={metrics.lastUpdated}
        loading={metrics.loading}
        onTimeRangeChange={controls.handleTimeRangeChange}
        onRefresh={metrics.refetch}
        onAutoRefreshToggle={controls.toggleAutoRefresh}
      />

      <KeyMetricsCards
        metrics={metrics.metrics}
        loading={metrics.loading}
      />

      <Tabs defaultValue="cache" className="w-full gap-3">
        <div className="border-b border-border/50 pb-3 mb-0">
          <TabsList className="w-full h-12 md:h-14 p-2 rounded-xl">
            <TabsTrigger value="cache" className="h-full px-4 md:px-5 py-0 text-base">Cache Metrics</TabsTrigger>
            <TabsTrigger value="compression" className="h-full px-4 md:px-5 py-0 text-base">Compression</TabsTrigger>
            <TabsTrigger value="realtime" className="h-full px-4 md:px-5 py-0 text-base">Real-time</TabsTrigger>
            <TabsTrigger value="health" className="h-full px-4 md:px-5 py-0 text-base">Health Status</TabsTrigger>
            <TabsTrigger value="analytics" className="h-full px-4 md:px-5 py-0 text-base">Analytics</TabsTrigger>
          </TabsList>
        </div>

        <TabsContents>
          <TabsContent value="cache">
            <CacheMetricsTab metrics={metrics.metrics} />
          </TabsContent>

          <TabsContent value="compression">
            <CompressionTab metrics={metrics.metrics} />
          </TabsContent>

          <TabsContent value="realtime">
            <RealtimeTab metrics={metrics.metrics} />
          </TabsContent>

          <TabsContent value="health">
            <HealthTab metrics={metrics.metrics} />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab
              metrics={metrics.metrics}
              historicalData={historicalData.historicalData}
              selectedTimeRange={controls.selectedTimeRange}
            />
          </TabsContent>
        </TabsContents>
      </Tabs>
    </div>
  );
}