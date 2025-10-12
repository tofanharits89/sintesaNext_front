import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/base-path";

// Cache statistics interface matching backend response
export interface CacheMetricsResponse {
  success: boolean;
  data: {
    cache: {
      totalHits: number;
      totalMisses: number;
      hitRate: number;
      totalQueries: number;
      averageQueryTime: number;
      categories: Record<string, {
        hits: number;
        misses: number;
        hitRate: number;
        averageQueryTime: number;
      }>;
    };
    compression: {
      totalCompressed: number;
      totalUncompressed: number;
      compressionRatio: number;
      brotliUsage: number;
      gzipUsage: number;
      averageCompressionTime: number;
      totalSaved: number;
    };
    realtime: {
      activeConnections: number;
      requestsPerSecond: number;
      memoryUsage: number;
      cpuUsage: number;
      uptime: number;
    };
    health: {
      status: 'healthy' | 'warning' | 'critical';
      hitRate: number;
      averageQueryTime: number;
      issues: string[];
      lastCheck: string;
    };
  };
  timestamp: string;
}

interface UseCacheMetricsOptions {
  refreshInterval?: number; // in milliseconds, default 30000 (30 seconds)
  enabled?: boolean;
}

export function useCacheMetrics(options: UseCacheMetricsOptions = {}) {
  const { refreshInterval = 30000, enabled = true } = options;
  const isClient = typeof window !== "undefined";

  return useQuery<CacheMetricsResponse, Error>({
    queryKey: ["cache-metrics"],
    queryFn: async () => {
      try {
        const url = new URL(apiPath("/analytics/cache-metrics"), window.location.origin);
        const response = await fetch(url.toString(), {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(15000), // 15 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        
        if (!text.trim()) {
          throw new Error("Empty response from server");
        }

        let result: CacheMetricsResponse;
        try {
          result = JSON.parse(text);
        } catch (parseError) {
          console.error("Failed to parse cache metrics response:", text);
          throw new Error("Invalid JSON response from server");
        }

        if (!result.success) {
          throw new Error(result.data ? "Cache metrics request failed" : "Unknown error occurred");
        }

        return result;
      } catch (error: any) {
        console.error("Error fetching cache metrics:", error);
        
        // Handle specific error types
        if (error.name === 'AbortError') {
          throw new Error("Request timeout - cache metrics service may be slow");
        }
        
        if (error.message?.includes("401") || error.message?.includes("status: 401")) {
          throw new Error("Authentication failed. Please log in to continue.");
        }
        
        if (error.message?.includes("403") || error.message?.includes("status: 403")) {
          throw new Error("Access denied. Insufficient permissions to view cache metrics.");
        }
        
        if (error.message?.includes("404") || error.message?.includes("status: 404")) {
          throw new Error("Cache metrics endpoint not found. Feature may not be available.");
        }
        
        if (error.message?.includes("500") || error.message?.includes("status: 500")) {
          throw new Error("Server error while fetching cache metrics. Please try again later.");
        }
        
        throw error;
      }
    },
    enabled: isClient && enabled,
    staleTime: refreshInterval / 2, // Consider data stale after half the refresh interval
    refetchInterval: refreshInterval, // Auto-refresh every refreshInterval ms
    refetchIntervalInBackground: true, // Continue refreshing when tab is not active
    retry: (failureCount, error) => {
      // Don't retry on authentication/authorization errors
      if (
        error.message?.includes("401") ||
        error.message?.includes("403") ||
        error.message?.includes("Authentication failed") ||
        error.message?.includes("Access denied")
      ) {
        return false;
      }
      
      // Don't retry on 404 (feature not available)
      if (error.message?.includes("404") || error.message?.includes("not found")) {
        return false;
      }
      
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

// Hook for real-time cache metrics with shorter refresh interval
export function useRealTimeCacheMetrics() {
  return useCacheMetrics({ 
    refreshInterval: 5000, // 5 seconds for real-time updates
  });
}

// Hook for dashboard cache metrics with standard refresh interval
export function useDashboardCacheMetrics() {
  return useCacheMetrics({ 
    refreshInterval: 30000, // 30 seconds for dashboard
  });
}
