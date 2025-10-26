export interface RealTimeData {
  activeConnections: number;
  requestsPerSecond: number;
  memoryUsage: number;
  cpuUsage: number;
}

import type { CompressionStats } from './compression.types';

export interface PerformanceMetrics {
  cacheStats: import("@/lib/cache/cache-metrics").CacheStats;
  compressionStats: CompressionStats;
  healthStatus: import("@/lib/cache/cache-metrics").HealthStatus;
  realTimeData: RealTimeData;
}

export interface HitRatePoint {
  name: string;
  hitRate: number;
  missRate: number;
}

export interface ResponseTimePoint {
  name: string;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

export interface CompressionPoint {
  name: string;
  compressionRatio: number;
  originalSize: number;
  compressedSize: number;
}

export interface ErrorRatePoint {
  name: string;
  errorRate: number;
  successRate: number;
}

export interface HistoricalData {
  hitRateHistory: HitRatePoint[];
  responseTimeHistory: ResponseTimePoint[];
  compressionHistory: CompressionPoint[];
  errorRateHistory: ErrorRatePoint[];
}

export type TimeRange = '5m' | '15m' | '1h' | '6h' | '24h';

export interface MonitoringControlsState {
  selectedTimeRange: TimeRange;
  refreshInterval: number;
  isAutoRefresh: boolean;
}
