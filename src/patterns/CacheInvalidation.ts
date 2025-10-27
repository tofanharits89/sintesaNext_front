"use client";

import { QueryClient } from "@tanstack/react-query";

/**
 * Cache invalidation pattern
 * Centralizes cache management across hooks and components
 */
export function createCacheInvalidator(queryClient: QueryClient) {
  /**
   * Invalidate queries related to a specific key pattern
   */
  const invalidateRelated = (keyPattern: string | string[]) => {
    if (Array.isArray(keyPattern)) {
      keyPattern.forEach((pattern) => {
        queryClient.invalidateQueries({ queryKey: [pattern] });
      });
    } else {
      queryClient.invalidateQueries({ queryKey: [keyPattern] });
    }
  };

  /**
   * Update cache optimistically
   */
  const updateOptimistically = <T>(
    key: string | string[],
    updater: (oldData: T | undefined) => T
  ) => {
    queryClient.setQueryData(Array.isArray(key) ? key : [key], updater);
  };

  /**
   * Remove from cache
   */
  const removeFromCache = (key: string | string[]) => {
    queryClient.removeQueries({ queryKey: Array.isArray(key) ? key : [key] });
  };

  /**
   * Invalidate and refetch
   */
  const invalidateAndRefetch = async (key: string | string[]) => {
    const queryKey = Array.isArray(key) ? key : [key];
    await queryClient.invalidateQueries({ queryKey });
    return queryClient.refetchQueries({ queryKey });
  };

  /**
   * Batch invalidate multiple keys
   */
  const batchInvalidate = async (keys: (string | string[])[]) => {
    await Promise.all(
      keys.map((key) => queryClient.invalidateQueries({ queryKey: [key] }))
    );
  };

  /**
   * Prefetch data into cache
   */
  const prefetch = async <T>(
    key: string | string[],
    fetcher: () => Promise<T>,
    options?: {
      staleTime?: number;
      cacheTime?: number;
    }
  ) => {
    return queryClient.prefetchQuery({
      queryKey: Array.isArray(key) ? key : [key],
      queryFn: fetcher,
      ...(options?.staleTime !== undefined && { staleTime: options.staleTime }),
      ...(options?.cacheTime !== undefined && { gcTime: options.cacheTime }),
    });
  };

  /**
   * Get cached data without triggering fetch
   */
  const getCachedData = <T>(key: string | string[]): T | undefined => {
    return queryClient.getQueryData(Array.isArray(key) ? key : [key]);
  };

  /**
   * Check if data exists in cache
   */
  const hasCachedData = (key: string | string[]): boolean => {
    return queryClient.getQueryState(Array.isArray(key) ? key : [key])?.data !== undefined;
  };

  /**
   * Get cache status
   */
  const getCacheStatus = (key: string | string[]) => {
    const state = queryClient.getQueryState(Array.isArray(key) ? key : [key]);
    return {
      status: state?.status,
      hasError: state?.status === "error",
      error: state?.error,
      dataUpdatedAt: state?.dataUpdatedAt,
    };
  };

  return {
    invalidateRelated,
    updateOptimistically,
    removeFromCache,
    invalidateAndRefetch,
    batchInvalidate,
    prefetch,
    getCachedData,
    hasCachedData,
    getCacheStatus,
  };
}

/**
 * Hook for using cache invalidator
 */
export function useCacheInvalidator() {
  // This would be initialized with a QueryClient instance
  // e.g., from useQueryClient() hook
  const queryClient = {} as QueryClient; // Placeholder - use actual QueryClient from hook

  return createCacheInvalidator(queryClient);
}

/**
 * Example usage:
 *
 * const cache = createCacheInvalidator(queryClient);
 *
 * // Invalidate related queries
 * cache.invalidateRelated('messages');
 *
 * // Update cache optimistically
 * cache.updateOptimistically(['messages', conversationId], (old) => [...old, newMessage]);
 *
 * // Batch invalidate multiple keys
 * await cache.batchInvalidate([
 *   ['messages', conversationId],
 *   ['conversations'],
 *   ['unreadCount']
 * ]);
 */
