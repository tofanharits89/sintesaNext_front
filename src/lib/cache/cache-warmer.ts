/**
 * Cache Warmer - Preloads critical endpoints for better performance
 * Implements intelligent cache warming strategies for React Query
 */

import { QueryClient } from "@tanstack/react-query";
import { apiPath } from "../config/base-path";
import { cacheMetrics } from "./cache-metrics";
import { queryKeyFactories } from "../config/query-configs";

export interface WarmingConfig {
  endpoint: string;
  priority: "critical" | "high" | "medium" | "low";
  queryKey: ReadonlyArray<string>;
  queryFn: () => Promise<any>;
  staleTime?: number;
  cacheTime?: number;
}

export interface WarmingStats {
  totalWarmed: number;
  successfulWarms: number;
  failedWarms: number;
  lastWarmingTime: number;
  warmingDuration: number;
  endpointStats: Record<
    string,
    {
      attempts: number;
      successes: number;
      failures: number;
      lastAttempt: number;
      averageDuration: number;
    }
  >;
}

export class CacheWarmer {
  private queryClient: QueryClient;
  private warmingInProgress = new Set<string>();
  private stats: WarmingStats = {
    totalWarmed: 0,
    successfulWarms: 0,
    failedWarms: 0,
    lastWarmingTime: 0,
    warmingDuration: 0,
    endpointStats: {},
  };

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Warm critical endpoints that are essential for app startup
   */
  async warmCriticalEndpoints(): Promise<void> {
    // Skip if not authenticated (prevents 401 noise before/after login)
    try {
      if (typeof document !== 'undefined') {
        const hasSid = /(?:^|;\s*)sid=/.test(document.cookie || '');
        if (!hasSid) return;
      }
    } catch {}
    const criticalEndpoints = this.getCriticalEndpoints();
    await this.warmEndpoints(criticalEndpoints);
  }

  /**
   * Warm high-priority endpoints for better UX
   */
  async warmHighPriorityEndpoints(): Promise<void> {
    const highPriorityEndpoints = this.getHighPriorityEndpoints();
    await this.warmEndpoints(highPriorityEndpoints);
  }

  /**
   * Warm specific endpoints based on user behavior patterns
   */
  async warmUserSpecificEndpoints(userId: string): Promise<void> {
    const userEndpoints = this.getUserSpecificEndpoints(userId);
    await this.warmEndpoints(userEndpoints);
  }

  /**
   * Warm dashboard data that's commonly accessed
   */
  async warmDashboardData(): Promise<void> {
    const dashboardEndpoints = this.getDashboardEndpoints();
    await this.warmEndpoints(dashboardEndpoints);
  }

  /**
   * Check if cache is fresh for a given query key
   */
  isCacheFresh(
    queryKey: ReadonlyArray<string>,
    staleTime: number = 5 * 60 * 1000
  ): boolean {
    // Cast to any due to type differences between readonly arrays and QueryClient signatures
    const queryData = this.queryClient.getQueryData(queryKey as any);
    const queryState = this.queryClient.getQueryState(queryKey as any);

    if (!queryData || !queryState) {
      return false;
    }

    const now = Date.now();
    const dataUpdatedAt = queryState.dataUpdatedAt || 0;

    return now - dataUpdatedAt < staleTime;
  }

  /**
   * Get warming statistics
   */
  getStats(): WarmingStats {
    return { ...this.stats };
  }

  /**
   * Reset warming statistics
   */
  resetStats(): void {
    this.stats = {
      totalWarmed: 0,
      successfulWarms: 0,
      failedWarms: 0,
      lastWarmingTime: 0,
      warmingDuration: 0,
      endpointStats: {},
    };
  }

  private async warmEndpoints(configs: WarmingConfig[]): Promise<void> {
    const startTime = performance.now();
    this.stats.lastWarmingTime = Date.now();

    // Sort by priority
    const sortedConfigs = configs.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Warm critical and high priority in parallel, others sequentially
    const criticalAndHigh = sortedConfigs.filter(
      (c) => c.priority === "critical" || c.priority === "high"
    );
    const others = sortedConfigs.filter(
      (c) => c.priority !== "critical" && c.priority !== "high"
    );

    // Parallel warming for critical/high priority
    if (criticalAndHigh.length > 0) {
      await Promise.allSettled(
        criticalAndHigh.map((config) => this.warmSingleEndpoint(config))
      );
    }

    // Sequential warming for others to avoid overwhelming
    for (const config of others) {
      await this.warmSingleEndpoint(config);
    }

    this.stats.warmingDuration = performance.now() - startTime;
  }

  private async warmSingleEndpoint(config: WarmingConfig): Promise<void> {
    const endpointKey = config.endpoint;

    // Prevent duplicate warming
    if (this.warmingInProgress.has(endpointKey)) {
      return;
    }

    // Skip if cache is still fresh
    if (this.isCacheFresh(config.queryKey, config.staleTime || 5 * 60 * 1000)) {
      return;
    }

    this.warmingInProgress.add(endpointKey);

    // Initialize endpoint stats if needed
    if (!this.stats.endpointStats[endpointKey]) {
      this.stats.endpointStats[endpointKey] = {
        attempts: 0,
        successes: 0,
        failures: 0,
        lastAttempt: 0,
        averageDuration: 0,
      };
    }

    const endpointStats = this.stats.endpointStats[endpointKey];
    const startTime = performance.now();

    try {
      endpointStats.attempts++;
      endpointStats.lastAttempt = Date.now();
      this.stats.totalWarmed++;

      // Record cache miss for warming
      cacheMetrics.recordMiss(
        "warming",
        Array.isArray(config.queryKey)
          ? config.queryKey.join(":")
          : String(config.queryKey)
      );

      await this.queryClient.prefetchQuery({
        queryKey: config.queryKey,
        queryFn: config.queryFn,
        staleTime: config.staleTime || 5 * 60 * 1000, // 5 minutes default
        gcTime: config.cacheTime || 10 * 60 * 1000, // 10 minutes default
      });

      const duration = performance.now() - startTime;
      endpointStats.successes++;
      this.stats.successfulWarms++;

      // Update average duration
      const totalDuration =
        endpointStats.averageDuration * (endpointStats.successes - 1) +
        duration;
      endpointStats.averageDuration = totalDuration / endpointStats.successes;

      // Record successful cache warming
      cacheMetrics.recordHit(
        "warming",
        Array.isArray(config.queryKey)
          ? config.queryKey.join(":")
          : String(config.queryKey)
      );
    } catch (error) {
      endpointStats.failures++;
      this.stats.failedWarms++;

      console.warn(`Failed to warm cache for ${endpointKey}:`, error);
    } finally {
      this.warmingInProgress.delete(endpointKey);
    }
  }

  private getCriticalEndpoints(): WarmingConfig[] {
    return [
      {
        endpoint: "/auth/profile",
        priority: "critical",
        // IMPORTANT: Always cache the actual User object for this key
        // Never cache the raw API envelope to avoid invalid shapes like { success: false }
        queryKey: ['auth', 'user'], // SSOT: must match useUserProfile/query-configs
        queryFn: async () => {
          const res = await fetch(apiPath("/users/profile/me"), {
            credentials: "include",
            cache: "no-store",
          });

          // Parse once
          const body = await res.json().catch(() => ({}));

          // On error statuses, throw so React Query does NOT cache the error object as data
          if (!res.ok) {
            const message =
              typeof body?.error === 'string' ? body.error :
              typeof body?.message === 'string' ? body.message :
              body?.error?.message || body?.message?.message ||
              JSON.stringify(body?.error || body?.message) ||
              "Failed to fetch profile";
            throw new Error(message);
          }

          // Extract the user payload consistently with useUserProfile
          const user = body?.data?.user || body?.data || body;

          // Basic validation to prevent caching malformed shapes
          if (!user || !user.id || !user.username) {
            throw new Error("Invalid user data structure");
          }

          return user;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
      {
        endpoint: "/health",
        priority: "critical",
        queryKey: ["health"],
        queryFn: () => fetch(apiPath("/health")).then((res) => res.json()),
        staleTime: 30 * 1000, // 30 seconds
      },
    ];
  }

  private getHighPriorityEndpoints(): WarmingConfig[] {
    return [
      {
        endpoint: "/dashboard/stats",
        priority: "high",
        queryKey: queryKeyFactories.dashboard.stats(),
        queryFn: () =>
          fetch(apiPath("/dashboard/stats")).then((res) => res.json()),
        staleTime: 2 * 60 * 1000, // 2 minutes
      },
      {
        endpoint: "/financial/rankings",
        priority: "high",
        queryKey: queryKeyFactories.financial.mbg.rankings(),
        queryFn: () =>
          fetch(apiPath("/financial/rankings")).then((res) => res.json()),
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    ];
  }

  private getUserSpecificEndpoints(userId: string): WarmingConfig[] {
    return [
      {
        endpoint: `/users/${userId}/preferences`,
        priority: "high",
        queryKey: queryKeyFactories.user.preferences(),
        queryFn: () =>
          fetch(apiPath(`/v1/users/${userId}/preferences`)).then((res) =>
            res.json()
          ),
        staleTime: 10 * 60 * 1000, // 10 minutes
      },
      {
        endpoint: `/users/${userId}/saved-queries`,
        priority: "medium",
        queryKey: ["user", "savedQueries", userId],
        queryFn: () =>
          fetch(apiPath(`/v1/users/${userId}/saved-queries`)).then((res) =>
            res.json()
          ),
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    ];
  }

  private getDashboardEndpoints(): WarmingConfig[] {
    return [
      {
        endpoint: "/dashboard/charts",
        priority: "high",
        queryKey: queryKeyFactories.dashboard.charts(),
        queryFn: () =>
          fetch(apiPath("/dashboard/charts")).then((res) => res.json()),
        staleTime: 3 * 60 * 1000, // 3 minutes
      },
      {
        endpoint: "/dashboard/recent-activity",
        priority: "medium",
        queryKey: ["dashboard", "recentActivity"],
        queryFn: () =>
          fetch(apiPath("/dashboard/recent-activity")).then((res) => res.json()),
        staleTime: 1 * 60 * 1000, // 1 minute
      },
    ];
  }
}

// Singleton instance
let cacheWarmerInstance: CacheWarmer | null = null;

export const initializeCacheWarmer = (
  queryClient: QueryClient
): CacheWarmer => {
  if (!cacheWarmerInstance) {
    cacheWarmerInstance = new CacheWarmer(queryClient);
  }
  return cacheWarmerInstance;
};

export const getCacheWarmer = (): CacheWarmer | null => {
  return cacheWarmerInstance;
};

export const getCacheWarmingStats = (): WarmingStats | null => {
  return cacheWarmerInstance?.getStats() || null;
};

export const triggerCacheWarming = async (): Promise<void> => {
  if (cacheWarmerInstance) {
    await cacheWarmerInstance.warmCriticalEndpoints();
    await cacheWarmerInstance.warmHighPriorityEndpoints();
  }
};

// Alias for backward compatibility with tests
export const initializeCacheWarming = async (
  queryClient: QueryClient
): Promise<void> => {
  const warmer = initializeCacheWarmer(queryClient);
  await warmer.warmCriticalEndpoints();
};
