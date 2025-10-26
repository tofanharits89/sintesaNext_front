import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { CacheWarmer } from '../cache/cache-warmer';
import { queryKeyFactories } from '../config/query-configs';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock QueryClient
const mockPrefetchQuery = vi.fn();
const mockGetQueryData = vi.fn();
const mockGetQueryState = vi.fn();
const mockQueryClient = {
  prefetchQuery: mockPrefetchQuery,
  getQueryData: mockGetQueryData,
  getQueryState: mockGetQueryState,
} as unknown as QueryClient;

describe('CacheWarmer', () => {
  let cacheWarmer: CacheWarmer;

  beforeEach(() => {
    cacheWarmer = new CacheWarmer(mockQueryClient);
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: {} })
    });
    // Mock getQueryState to return stale data by default
    mockGetQueryState.mockReturnValue({
      data: undefined,
      dataUpdatedAt: 0, // Very old timestamp to ensure data is considered stale
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with QueryClient', () => {
      expect(cacheWarmer).toBeInstanceOf(CacheWarmer);
    });

    it('should initialize with empty warming set', () => {
      expect(cacheWarmer['warmingInProgress'].size).toBe(0);
    });
  });

  describe('Critical Endpoints Warming', () => {
    it('should warm auth profile endpoint', async () => {
      mockGetQueryData.mockReturnValue(undefined); // No cached data
      mockGetQueryState.mockReturnValue({ data: undefined, dataUpdatedAt: 0 });
      
      await cacheWarmer.warmCriticalEndpoints();

      expect(mockPrefetchQuery).toHaveBeenCalledWith({
        queryKey: queryKeyFactories.user.profile(),
        queryFn: expect.any(Function),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      });
    });

    it('should warm health endpoint', async () => {
      mockGetQueryData.mockReturnValue(undefined);
      mockGetQueryState.mockReturnValue({ data: undefined, dataUpdatedAt: 0 });
      
      await cacheWarmer.warmCriticalEndpoints();

      expect(mockPrefetchQuery).toHaveBeenCalledWith({
        queryKey: ['health'],
        queryFn: expect.any(Function),
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 10 * 60 * 1000, // 10 minutes
      });
    });

    it('should warm auth profile endpoint', async () => {
      mockGetQueryData.mockReturnValue(undefined);
      mockGetQueryState.mockReturnValue({ data: undefined, dataUpdatedAt: 0 });
      
      await cacheWarmer.warmCriticalEndpoints();

      expect(mockPrefetchQuery).toHaveBeenCalledWith({
        queryKey: queryKeyFactories.user.profile(),
        queryFn: expect.any(Function),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      });
    });

    it('should warm health endpoint', async () => {
      mockGetQueryData.mockReturnValue(undefined);
      mockGetQueryState.mockReturnValue({ data: undefined, dataUpdatedAt: 0 });
      
      await cacheWarmer.warmCriticalEndpoints();

      expect(mockPrefetchQuery).toHaveBeenCalledWith({
        queryKey: ['health'],
        queryFn: expect.any(Function),
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 10 * 60 * 1000, // 10 minutes
      });
    });

    it('should skip warming if data is already cached and fresh', async () => {
      const now = Date.now();
      const userProfileTimestamp = now - 2 * 60 * 1000; // 2 minutes ago (fresh for 5-minute staleTime)
      const healthTimestamp = now - 10 * 1000; // 10 seconds ago (fresh for 30-second staleTime)
      
      // Mock fresh data for both critical endpoints
      mockGetQueryData.mockImplementation((queryKey) => {
        if (JSON.stringify(queryKey) === JSON.stringify(queryKeyFactories.user.profile())) {
          return { user: 'data' };
        }
        if (JSON.stringify(queryKey) === JSON.stringify(['health'])) {
          return { status: 'ok' };
        }
        return undefined;
      });

      // Mock fresh state for both endpoints with appropriate timestamps
      mockGetQueryState.mockImplementation((queryKey) => {
        if (JSON.stringify(queryKey) === JSON.stringify(queryKeyFactories.user.profile())) {
          return { data: { user: 'data' }, dataUpdatedAt: userProfileTimestamp };
        }
        if (JSON.stringify(queryKey) === JSON.stringify(['health'])) {
          return { data: { status: 'ok' }, dataUpdatedAt: healthTimestamp };
        }
        return { data: undefined, dataUpdatedAt: 0 };
      });

      await cacheWarmer.warmCriticalEndpoints();

      expect(mockPrefetchQuery).not.toHaveBeenCalled();
    });

    it('should handle warming errors gracefully', async () => {
      mockGetQueryData.mockReturnValue(undefined);
      mockPrefetchQuery.mockRejectedValue(new Error('Network error'));
      
      // Should not throw
      await expect(cacheWarmer.warmCriticalEndpoints()).resolves.toBeUndefined();
    });
  });

  describe('High Priority Endpoints Warming', () => {
    it('should warm dashboard stats endpoint', async () => {
      mockGetQueryData.mockReturnValue(undefined);
      mockGetQueryState.mockReturnValue({ data: undefined, dataUpdatedAt: 0 });
      
      await cacheWarmer.warmHighPriorityEndpoints();

      expect(mockPrefetchQuery).toHaveBeenCalledWith({
        queryKey: queryKeyFactories.dashboard.stats(),
        queryFn: expect.any(Function),
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      });
    });

    it('should warm financial MBG rankings endpoint', async () => {
      mockGetQueryData.mockReturnValue(undefined);
      
      await cacheWarmer.warmHighPriorityEndpoints();

      expect(mockPrefetchQuery).toHaveBeenCalledWith({
        queryKey: queryKeyFactories.financial.mbg.rankings(),
        queryFn: expect.any(Function),
        staleTime: 5 * 60 * 1000, // 5 minutes as per cache warmer config
        gcTime: 10 * 60 * 1000, // 10 minutes
      });
    });

    it('should handle partial failures in high priority warming', async () => {
      mockGetQueryData.mockReturnValue(undefined);
      mockGetQueryState.mockReturnValue({
        data: undefined,
        dataUpdatedAt: 0,
      });
      mockPrefetchQuery
        .mockResolvedValueOnce(undefined) // First call succeeds
        .mockRejectedValueOnce(new Error('Network error')) // Second call fails
      
      await expect(cacheWarmer.warmHighPriorityEndpoints()).resolves.toBeUndefined();
      expect(mockPrefetchQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe('Duplicate Request Prevention', () => {
    it('should prevent duplicate warming requests for same endpoint', async () => {
      mockGetQueryData.mockReturnValue(undefined);
      
      // Start two warming operations simultaneously
      const promise1 = cacheWarmer.warmCriticalEndpoints();
      const promise2 = cacheWarmer.warmCriticalEndpoints();
      
      await Promise.all([promise1, promise2]);
      
      // Should only call prefetch once per endpoint, not twice
      const authVerifyCalls = mockPrefetchQuery.mock.calls.filter(
        call => JSON.stringify(call[0].queryKey) === JSON.stringify(queryKeyFactories.user.profile())
      );
      expect(authVerifyCalls).toHaveLength(1);
    });

    it('should allow warming after previous request completes', async () => {
      mockGetQueryData.mockReturnValue(undefined);
      
      // First warming
      await cacheWarmer.warmCriticalEndpoints();
      
      // Second warming (should be allowed)
      await cacheWarmer.warmCriticalEndpoints();
      
      // Should have been called twice (once for each warming)
      const authVerifyCalls = mockPrefetchQuery.mock.calls.filter(
        call => JSON.stringify(call[0].queryKey) === JSON.stringify(queryKeyFactories.user.profile())
      );
      expect(authVerifyCalls).toHaveLength(2);
    });
  });

  describe('Cache Freshness Checking', () => {
    it('should check if cache data is fresh before warming', async () => {
      const userProfileKey = queryKeyFactories.user.profile();
      
      // Mock that fresh data exists for user profile (within 5 minute staleTime)
      const freshTimestamp = Date.now() - (2 * 60 * 1000); // 2 minutes ago, fresh for 5min staleTime
      
      mockGetQueryData.mockImplementation((key) => {
        if (JSON.stringify(key) === JSON.stringify(userProfileKey)) {
          return { user: 'data' }; // Return actual data for user profile
        }
        return undefined; // No data for other endpoints
      });
      
      mockGetQueryState.mockImplementation((key) => {
        if (JSON.stringify(key) === JSON.stringify(userProfileKey)) {
          return {
            data: { user: 'data' },
            dataUpdatedAt: freshTimestamp,
          };
        }
        return {
          data: undefined,
          dataUpdatedAt: 0,
        };
      });
      
      await cacheWarmer.warmCriticalEndpoints();
      
      // Should not prefetch user profile since data is fresh
      const authVerifyCalls = mockPrefetchQuery.mock.calls.filter(
        call => JSON.stringify(call[0].queryKey) === JSON.stringify(userProfileKey)
      );
      expect(authVerifyCalls).toHaveLength(0);
      
      // But should still prefetch other endpoints that don't have fresh data
      expect(mockPrefetchQuery).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during warming', async () => {
      mockGetQueryData.mockReturnValue(undefined);
      mockPrefetchQuery.mockRejectedValue(new Error('Network timeout'));
      
      // Should not throw error
      await expect(cacheWarmer.warmCriticalEndpoints()).resolves.toBeUndefined();
    });

    it('should handle QueryClient errors', async () => {
      mockGetQueryData.mockReturnValue(undefined);
      mockPrefetchQuery.mockRejectedValue(new Error('QueryClient error'));
      
      await expect(cacheWarmer.warmHighPriorityEndpoints()).resolves.toBeUndefined();
    });

    it('should continue warming other endpoints if one fails', async () => {
      mockGetQueryData.mockReturnValue(undefined);
      mockGetQueryState.mockReturnValue({
        data: undefined,
        dataUpdatedAt: 0,
      });
      
      let callCount = 0;
      mockPrefetchQuery.mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error('Second call fails'));
        }
        return Promise.resolve();
      });
      
      await cacheWarmer.warmCriticalEndpoints();
      
      // Should have attempted all endpoints despite one failure
      expect(mockPrefetchQuery).toHaveBeenCalledTimes(2); // auth/profile, health
    });
  });

  describe('Query Function Generation', () => {
    it('should generate correct query functions for different endpoints', async () => {
      mockGetQueryData.mockReturnValue(undefined);
      
      await cacheWarmer.warmCriticalEndpoints();
      
      // Check that query functions are properly generated
      const calls = mockPrefetchQuery.mock.calls;
      
      calls.forEach(call => {
        const { queryFn } = call[0];
        expect(typeof queryFn).toBe('function');
      });
    });

    it('should use correct API endpoints in query functions', async () => {
      mockGetQueryData.mockReturnValue(undefined);
      
      await cacheWarmer.warmCriticalEndpoints();
      
      // Execute one of the query functions to test API call
      const userProfileCall = mockPrefetchQuery.mock.calls.find(
        call => JSON.stringify(call[0].queryKey) === JSON.stringify(queryKeyFactories.user.profile())
      );
      
      if (userProfileCall) {
        const { queryFn } = userProfileCall[0];
        await queryFn();
        
        expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/profile');
      }
    });
  });

  describe('Performance Considerations', () => {
    it('should warm endpoints in parallel for better performance', async () => {
      mockGetQueryData.mockReturnValue(undefined);
      
      const startTime = Date.now();
      
      // Mock slow prefetch operations
      mockPrefetchQuery.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      await cacheWarmer.warmCriticalEndpoints();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in roughly 100ms (parallel) rather than 300ms (sequential)
      expect(duration).toBeLessThan(200);
    });

    it('should not block on warming operations', () => {
      mockGetQueryData.mockReturnValue(undefined);
      
      // Warming should return immediately, not wait for completion
      const warmingPromise = cacheWarmer.warmCriticalEndpoints();
      expect(warmingPromise).toBeInstanceOf(Promise);
    });
  });
});

// Test the singleton instance and initialization function
describe('CacheWarmer Singleton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export initializeCacheWarming function', async () => {
    const { initializeCacheWarming } = await import('../cache-warmer');
    expect(typeof initializeCacheWarming).toBe('function');
  });

  it('should initialize cache warming with QueryClient', async () => {
    const { initializeCacheWarming } = await import('../cache-warmer');
    
    // Mock QueryClient
    const mockQueryClient = {
      prefetchQuery: vi.fn().mockResolvedValue(undefined),
      getQueryData: vi.fn().mockReturnValue(undefined)
    } as unknown as QueryClient;
    
    // Should not throw
    await expect(initializeCacheWarming(mockQueryClient)).resolves.toBeUndefined();
  });
});
