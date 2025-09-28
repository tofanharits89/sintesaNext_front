/**
 * Enhanced React Query configurations for different data types
 * Provides optimized caching strategies based on data characteristics
 */

import { UseQueryOptions, UseInfiniteQueryOptions, type QueryKey } from '@tanstack/react-query'

// Base configuration types
export interface QueryConfig {
  staleTime: number
  gcTime: number
  retry: number | ((failureCount: number, error: Error) => boolean)
  retryDelay: number | ((retryAttempt: number) => number)
  refetchOnWindowFocus: boolean
  refetchOnReconnect: boolean
  refetchInterval: number | false
}

// Predefined configurations for different data types
export const queryConfigs = {
  // Static/Reference data - rarely changes, cache aggressively
  static: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchInterval: false,
  } as QueryConfig,

  // User data - moderately dynamic, balance freshness and performance
  user: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: false,
  } as QueryConfig,

  // Dashboard/Analytics data - semi-real-time, moderate caching
  dashboard: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(500 * 2 ** attemptIndex, 5000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: false,
  } as QueryConfig,

  // Real-time data - messaging, notifications, live updates
  realtime: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: false,
  } as QueryConfig,

  // Critical data - authentication, permissions
  critical: {
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(500 * 2 ** attemptIndex, 3000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: false,
  } as QueryConfig,

  // Financial data - high accuracy required, moderate caching
  financial: {
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 8000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: false,
  } as QueryConfig,

  // Search/Filter results - short-lived, frequent updates
  search: {
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
    retry: 1,
    retryDelay: 500,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  } as QueryConfig,
} as const

// Helper function to create typed query options
export function createQueryOptions<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  configType: keyof typeof queryConfigs,
  overrides?: Partial<
    Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'>
  >
): Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'> {
  const config = queryConfigs[configType]
  return {
    ...config,
    ...(overrides as any),
  }
}

// Helper function to create typed infinite query options
export function createInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown
>(
  configType: keyof typeof queryConfigs,
  overrides?: Partial<
    Omit<
      UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
      'queryKey' | 'queryFn'
    >
  >
): Omit<
  UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  'queryKey' | 'queryFn'
> {
  const config = queryConfigs[configType]
  return {
    ...config,
    ...(overrides as any),
  }
}

// Query key factories for consistent cache management
export const queryKeyFactories = {
  // Financial data keys
  financial: {
    all: () => ['financial'] as const,
    mbg: {
      all: () => ['financial', 'mbg'] as const,
      quickStats: () => [...queryKeyFactories.financial.mbg.all(), 'quickStats'] as const,
      charts: () => [...queryKeyFactories.financial.mbg.all(), 'charts'] as const,
      rankings: () => [...queryKeyFactories.financial.mbg.all(), 'rankings'] as const,
      mapStats: (scope: 'national' | 'province' | 'regency', id?: string) =>
        [...queryKeyFactories.financial.mbg.all(), 'mapStats', scope, id ?? 'all'] as const,
    },
  },
  
  // Dashboard data keys
  dashboard: {
    all: () => ['dashboard'] as const,
    stats: () => [...queryKeyFactories.dashboard.all(), 'stats'] as const,
    charts: () => [...queryKeyFactories.dashboard.all(), 'charts'] as const,
  },

  // User data keys (auth-related)
  user: {
    all: () => ['auth'] as const, // Keep 'auth' for backward compatibility
    profile: () => [...queryKeyFactories.user.all(), 'user'] as const,
    verify: () => [...queryKeyFactories.user.all(), 'verify'] as const,
    preferences: () => [...queryKeyFactories.user.all(), 'preferences'] as const,
  },

  // Messaging keys
  messaging: {
    all: () => ['messaging'] as const,
    conversations: () => [...queryKeyFactories.messaging.all(), 'conversations'] as const,
    messages: (conversationId: string) => [...queryKeyFactories.messaging.all(), 'messages', conversationId] as const,
  },

  // Search keys
  search: {
    all: () => ['search'] as const,
    results: (query: string) => [...queryKeyFactories.search.all(), 'results', query] as const,
  },
} as const

// Cache invalidation helpers
export const cacheInvalidation = {
  invalidateUser: (queryClient: any, userId?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeyFactories.user.profile() })
    if (userId) {
      queryClient.invalidateQueries({ queryKey: [...queryKeyFactories.user.profile(), userId] })
    }
  },

  invalidateDashboard: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeyFactories.dashboard.all() })
    queryClient.invalidateQueries({ queryKey: queryKeyFactories.dashboard.stats() })
    queryClient.invalidateQueries({ queryKey: queryKeyFactories.dashboard.charts() })
  },

  invalidateMessaging: (queryClient: any, conversationId?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeyFactories.messaging.all() })
    if (conversationId) {
      queryClient.invalidateQueries({ queryKey: queryKeyFactories.messaging.messages(conversationId) })
    }
  },

  invalidateFinancial: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeyFactories.financial.all() })
    queryClient.invalidateQueries({ queryKey: queryKeyFactories.financial.mbg.all() })
  },
}