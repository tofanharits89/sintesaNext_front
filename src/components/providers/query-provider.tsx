"use client";

import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect } from "react";
import { queryConfigs, createQueryOptions } from "@/lib/query-configs";
import { cacheInvalidation } from "@/lib/query-configs";
import { initializeCacheWarming } from "@/lib/cache-warmer";
import { logger } from "@/lib/utils";

// Cache analytics for monitoring performance
class CacheAnalytics {
  private static instance: CacheAnalytics;
  private metrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    totalQueries: 0,
    avgResponseTime: 0,
    responseTimeSum: 0,
  };

  static getInstance(): CacheAnalytics {
    if (!CacheAnalytics.instance) {
      CacheAnalytics.instance = new CacheAnalytics();
    }
    return CacheAnalytics.instance;
  }

  recordHit(responseTime?: number) {
    this.metrics.hits++;
    this.metrics.totalQueries++;
    if (responseTime) {
      this.metrics.responseTimeSum += responseTime;
      this.metrics.avgResponseTime =
        this.metrics.responseTimeSum / this.metrics.totalQueries;
    }
  }

  recordMiss(responseTime?: number) {
    this.metrics.misses++;
    this.metrics.totalQueries++;
    if (responseTime) {
      this.metrics.responseTimeSum += responseTime;
      this.metrics.avgResponseTime =
        this.metrics.responseTimeSum / this.metrics.totalQueries;
    }
  }

  recordError() {
    this.metrics.errors++;
    this.metrics.totalQueries++;
  }

  getMetrics() {
    const hitRate =
      this.metrics.totalQueries > 0
        ? (this.metrics.hits / this.metrics.totalQueries) * 100
        : 0;

    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  reset() {
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      totalQueries: 0,
      avgResponseTime: 0,
      responseTimeSum: 0,
    };
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const analytics = CacheAnalytics.getInstance();

    return new QueryClient({
      defaultOptions: {
        queries: {
          // Use dashboard config as default (balanced approach)
          ...queryConfigs.dashboard,
          // Enhanced retry logic with exponential backoff
          retry: (failureCount, error) => {
            // Don't retry on 4xx errors (client errors)
            if (
              error &&
              "status" in error &&
              typeof error.status === "number"
            ) {
              if (error.status >= 400 && error.status < 500) {
                return false;
              }
            }
            // Don't retry on authentication errors
            if (error?.message?.includes('401') || error?.message?.includes('Profile request failed: 401')) {
              return false;
            }
            return failureCount < 3;
          },
          retryDelay: (attemptIndex) =>
            Math.min(1000 * 2 ** attemptIndex, 30000),
          // Network-aware refetching
          refetchOnWindowFocus: true,
          refetchOnReconnect: true,
          // Background refetch for stale data
          refetchIntervalInBackground: false,
        },
        mutations: {
          retry: 1,
          retryDelay: 1000,
        },
      },
      queryCache: new QueryCache({
        onSuccess: (data, query) => {
          const startTime = query.state.dataUpdatedAt;
          const endTime = Date.now();
          const responseTime = startTime ? endTime - startTime : undefined;
          analytics.recordHit(responseTime);
        },
        onError: (error, query) => {
          analytics.recordError();
          // Don't log 401 errors as they're expected when user is not authenticated
          if (!error?.message?.includes('401') && !error?.message?.includes('Profile request failed: 401')) {
            logger.error("Query error:", error, "Query key:", query.queryKey);
          }
        },
      }),
      mutationCache: new MutationCache({
        onError: (error, variables, context, mutation) => {
          analytics.recordError();
          logger.error("Mutation error:", error, "Variables:", variables);
        },
      }),
    });
  });

  // Initialize cache warming on mount
  useEffect(() => {
    // Start cache warming after a short delay to avoid blocking initial render
    const timer = setTimeout(() => {
      initializeCacheWarming(queryClient);
    }, 100);

    return () => clearTimeout(timer);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools
        initialIsOpen={false}
        buttonPosition="bottom-left"
        position="left"
      />
    </QueryClientProvider>
  );
}

// Export analytics instance for external access
export const cacheAnalytics = CacheAnalytics.getInstance();
