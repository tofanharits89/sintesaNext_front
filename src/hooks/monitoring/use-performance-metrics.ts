import { useState, useEffect, useCallback } from "react";
import {
  cacheMetrics,
  type CacheStats,
  type HealthStatus,
} from "@/lib/cache-metrics";
import type {
  PerformanceMetrics,
  CompressionStats,
  RealTimeData,
  CompressionApiResponse,
  HealthApiResponse,
} from "@/types/monitoring";

const API_BASE_URL = ""; // Use Next.js API proxy, so no base URL needed

// Transform API response to our internal type
const transformCompressionData = (apiData: any): CompressionStats => ({
  totalCompressed: apiData.totalCompressed,
  totalUncompressed: apiData.totalUncompressed,
  compressionRatio: apiData.compressionRatio,
  brotliUsage: apiData.brotliUsage,
  gzipUsage: apiData.gzipUsage,
  averageCompressionTime: apiData.averageCompressionTime,
});

const transformHealthData = (apiData: any): HealthStatus => ({
  status: apiData.status,
  hitRate: apiData.hitRate,
  averageQueryTime: apiData.averageQueryTime,
  issues: apiData.issues.map((issue: any) => issue.message),
});

export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchCompressionStats = async (): Promise<CompressionStats> => {
    try {
      const response = await fetch("/api/v1/monitoring/compression-stats", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return transformCompressionData(result.data.stats); // Extract stats from the response structure
    } catch (error) {
      console.error("Failed to fetch compression stats:", error);
      // Fallback to default values
      return {
        totalCompressed: 0,
        totalUncompressed: 0,
        compressionRatio: 0,
        brotliUsage: 0,
        gzipUsage: 0,
        averageCompressionTime: 0,
      };
    }
  };

  const fetchHealthStatus = async (): Promise<HealthStatus> => {
    try {
      const response = await fetch("/api/v1/monitoring/health", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return transformHealthData(result.data.health); // Extract health from the response structure
    } catch (error) {
      console.error("Failed to fetch health status:", error);
      // Fallback to cache metrics
      return cacheMetrics.getHealthStatus();
    }
  };

  const fetchRealTimeData = async (): Promise<RealTimeData> => {
    try {
      const response = await fetch("/api/v1/monitoring/realtime", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data.metrics; // Extract metrics from the response structure
    } catch (error) {
      console.error("Failed to fetch real-time data:", error);
      // Fallback to mock data - in production, this should be handled differently
      return {
        activeConnections: 0,
        requestsPerSecond: 0,
        memoryUsage: 0,
        cpuUsage: 0,
      };
    }
  };

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get cache metrics from the singleton
      const cacheStats: CacheStats = cacheMetrics.getStats();

      // Fetch other metrics from API
      const [compressionStats, healthStatus, realTimeData] = await Promise.all([
        fetchCompressionStats(),
        fetchHealthStatus(),
        fetchRealTimeData(),
      ]);

      setMetrics({
        cacheStats,
        compressionStats,
        healthStatus,
        realTimeData,
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch performance metrics:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    lastUpdated,
    refetch: fetchMetrics,
  };
};
