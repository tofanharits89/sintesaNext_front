import { useState, useEffect, useCallback } from "react";
import type {
  HistoricalData,
  HitRatePoint,
  ResponseTimePoint,
  CompressionPoint,
  ErrorRatePoint,
  TimeRange,
} from "@/types/monitoring";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface HistoricalApiResponse {
  success: boolean;
  data: {
    historical: {
      timeRange: string;
      hitRateHistory: Array<{
        timestamp: string;
        hitRate: number;
        missRate: number;
      }>;
      responseTimeHistory: Array<{
        timestamp: string;
        avgResponseTime: number;
        p95ResponseTime: number;
        p99ResponseTime: number;
      }>;
      compressionHistory: Array<{
        timestamp: string;
        compressionRatio: number;
        originalSize: number;
        compressedSize: number;
      }>;
      errorRateHistory: Array<{
        timestamp: string;
        errorRate: number;
        successRate: number;
      }>;
      systemMetricsHistory: Array<{
        timestamp: string;
        memoryUsage: number;
        cpuUsage: number;
        diskUsage: number;
        activeConnections: number;
      }>;
    };
    aggregated: {
      avgHitRate: number;
      avgResponseTime: number;
      avgCompressionRatio: number;
      avgMemoryUsage: number;
      avgCpuUsage: number;
      totalRequests: number;
      maxErrorRate: number;
      uptime: number;
    };
  };
  timeRange: string;
  timestamp: string;
}

const generateMockHistoricalData = (timeRange: TimeRange): HistoricalData => {
  const now = new Date();
  const points =
    timeRange === "1h"
      ? 12
      : timeRange === "6h"
        ? 24
        : timeRange === "24h"
          ? 24
          : 7;
  const interval =
    timeRange === "1h"
      ? 5
      : timeRange === "6h"
        ? 15
        : timeRange === "24h"
          ? 60
          : 1440; // minutes

  const hitRateHistory: HitRatePoint[] = [];
  const responseTimeHistory: ResponseTimePoint[] = [];
  const compressionHistory: CompressionPoint[] = [];
  const errorRateHistory: ErrorRatePoint[] = [];

  for (let i = points - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * interval * 60000);
    const timeLabel =
      timeRange === "24h"
        ? time.toLocaleDateString("id-ID", { month: "short", day: "numeric" })
        : time.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          });

    const baseHitRate = 85 + Math.random() * 10;
    const baseResponseTime = 45 + Math.random() * 30;
    const baseCompressionRatio = 65 + Math.random() * 15;
    const baseErrorRate = Math.random() * 2;

    hitRateHistory.push({
      name: timeLabel,
      hitRate: Math.round(baseHitRate * 100) / 100,
      missRate: Math.round((100 - baseHitRate) * 100) / 100,
    });

    responseTimeHistory.push({
      name: timeLabel,
      avgResponseTime: Math.round(baseResponseTime),
      p95ResponseTime: Math.round(baseResponseTime * 1.5),
      p99ResponseTime: Math.round(baseResponseTime * 2.2),
    });

    compressionHistory.push({
      name: timeLabel,
      compressionRatio: Math.round(baseCompressionRatio * 100) / 100,
      originalSize: Math.round(1000 + Math.random() * 500),
      compressedSize: Math.round(
        (1000 + Math.random() * 500) * (1 - baseCompressionRatio / 100),
      ),
    });

    errorRateHistory.push({
      name: timeLabel,
      errorRate: Math.round(baseErrorRate * 100) / 100,
      successRate: Math.round((100 - baseErrorRate) * 100) / 100,
    });
  }

  return {
    hitRateHistory,
    responseTimeHistory,
    compressionHistory,
    errorRateHistory,
  };
};

const transformHistoricalData = (
  apiData: HistoricalApiResponse,
): HistoricalData => {
  const historical = apiData.data.historical;
  
  return {
    hitRateHistory: (historical.hitRateHistory || []).map((item) => ({
      name: new Date(item.timestamp).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      hitRate: Math.round(item.hitRate * 100) / 100,
      missRate: Math.round(item.missRate * 100) / 100,
    })),
    responseTimeHistory: (historical.responseTimeHistory || []).map((item) => ({
      name: new Date(item.timestamp).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      avgResponseTime: Math.round(item.avgResponseTime),
      p95ResponseTime: Math.round(item.p95ResponseTime),
      p99ResponseTime: Math.round(item.p99ResponseTime),
    })),
    compressionHistory: (historical.compressionHistory || []).map((item) => ({
      name: new Date(item.timestamp).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      compressionRatio: Math.round(item.compressionRatio * 100) / 100,
      originalSize: item.originalSize,
      compressedSize: item.compressedSize,
    })),
    errorRateHistory: (historical.errorRateHistory || []).map((item) => ({
      name: new Date(item.timestamp).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      errorRate: Math.round(item.errorRate * 100) / 100,
      successRate: Math.round(item.successRate * 100) / 100,
    })),
  };
};

export const useHistoricalData = (timeRange: TimeRange) => {
  const [historicalData, setHistoricalData] = useState<HistoricalData>({
    hitRateHistory: [],
    responseTimeHistory: [],
    compressionHistory: [],
    errorRateHistory: [],
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistoricalData = useCallback(
    async (selectedTimeRange: TimeRange) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/v1/monitoring/historical?timeRange=${selectedTimeRange}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const apiData: HistoricalApiResponse = await response.json();
        const transformedData = transformHistoricalData(apiData);
        setHistoricalData(transformedData);
      } catch (error) {
        console.error("Failed to fetch historical data:", error);
        // Fallback to mock data
        const mockData = generateMockHistoricalData(selectedTimeRange);
        setHistoricalData(mockData);
        setError(error instanceof Error ? error.message : "Using mock data");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const generateHistoricalData = useCallback((selectedTimeRange: TimeRange) => {
    const mockData = generateMockHistoricalData(selectedTimeRange);
    setHistoricalData(mockData);
  }, []);

  // Fetch historical data when time range changes
  useEffect(() => {
    fetchHistoricalData(timeRange);
  }, [timeRange, fetchHistoricalData]);

  return {
    historicalData,
    loading,
    error,
    refetch: () => fetchHistoricalData(timeRange),
    generateMockData: () => generateHistoricalData(timeRange),
  };
};
