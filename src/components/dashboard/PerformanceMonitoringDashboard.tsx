"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
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

      <Tabs defaultValue="cache" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cache">Cache Metrics</TabsTrigger>
          <TabsTrigger value="compression">Compression</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="health">Health Status</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

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
      </Tabs>
    </div>
  );
}